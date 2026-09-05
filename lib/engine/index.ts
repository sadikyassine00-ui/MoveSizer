import { TruckSpec, TRUCKS, TruckId } from '../constants/trucks';
import { ItemDefinition, ITEMS, getItem } from '../constants/items';
import {
  DrawableBlock,
  CustomItemInput,
  PackEngineResult,
  Bounds,
  SubFurnitureCavity,
  StackableSurface,
  Occupied3D,
  HeuristicPass,
  PassExecutionResult,
  FlatPackingItem,
  UnpackedItem,
} from './types';
import { isFourLeggedTableOrDesk } from './collision';
import { compactItems } from './compaction';
import { sortBlocksTopological } from './sort';
import { packPhase1Rails } from './phases/phase1Rails';
import { packPhase2Bulkhead } from './phases/phase2Bulkhead';
import { packPhase3Deck } from './phases/phase3Deck';
import { packPhase4Attic } from './phases/phase4Attic';
import { packPhase5Boxes } from './phases/phase5Boxes';

// Re-export all sub-modules for clean modular engine access
export * from './types';
export * from './collision';
export * from './compaction';
export * from './sort';
export * from './phases/phase1Rails';
export * from './phases/phase2Bulkhead';
export * from './phases/phase3Deck';
export * from './phases/phase4Attic';
export * from './phases/phase5Boxes';

// Re-export sibling calculation engines
export * from './boxCalculator';
export * from './capacityEngine';
export * from './pricingEngine';

/**
 * Scoring Function:
 * Score = (Count of Placed Items * 10,000) - (max(X_occupied) * Truck Width * Truck Height)
 * Maximizes items placed while packing them into the shortest truck length possible.
 */
export function calculateLayoutScore(
  placedCount: number,
  maxX: number,
  truckWidth: number,
  truckHeight: number
): number {
  return (placedCount * 10000) - (maxX * truckWidth * truckHeight);
}

/**
 * Executes a single heuristic packing pass across the overhauled execution pipeline:
 * 1. Phases 1 & 2: Rails and Bulkhead uprights
 * 2. Phase 3: Heavy floor furniture
 * 3. EARLY BULK COMPACTION: Slides case goods flush to cab and side rail
 * 4. Dynamic Platform & Cavity Recalculation from post-compaction coordinates
 * 5. Phase 4: Mom's Attic cab shelf
 * 6. Phase 5: Cavities -> Vertical Headroom Fill (3D rotations) -> Tailgate Rear Deck
 * 7. Final Micro-Compaction
 */
export function runPackingPass(
  truck: TruckSpec,
  flatItems: FlatPackingItem[],
  heuristic: HeuristicPass,
  layoutCache?: Map<string, PassExecutionResult>
): PassExecutionResult {
  const truckLength = truck.length;
  const truckWidth = truck.width;
  const truckHeight = truck.height;

  const bounds: Bounds = {
    length: truckLength,
    width: truckWidth,
    height: truckHeight,
    hasAttic: Boolean(truck.hasAttic && truck.attic),
    attic: truck.attic,
  };

  let blockCounter = 0;
  const nextId = (prefix: string) => `${heuristic}_${prefix}_${++blockCounter}`;

  const occupiedSpaces: Occupied3D[] = [];
  const unpackedItems: UnpackedItem[] = [];

  // -------------------------------------------------------------------------
  // 1. PHASES 1 & 2: Wall Rails and Front Bulkhead Uprights
  // -------------------------------------------------------------------------
  const p1Res = packPhase1Rails(truck, flatItems, occupiedSpaces, nextId);
  unpackedItems.push(...p1Res.unpackedItems);

  const p2Res = packPhase2Bulkhead(
    truck,
    flatItems,
    occupiedSpaces,
    p1Res.leftWallFrontWidth,
    p1Res.rightWallFrontWidth,
    nextId
  );
  unpackedItems.push(...p2Res.unpackedItems);

  const p3Res = packPhase3Deck(
    truck,
    flatItems,
    occupiedSpaces,
    heuristic,
    p1Res.leftWallFrontWidth,
    p1Res.maxLeftWallThickness,
    nextId
  );
  unpackedItems.push(...p3Res.unpackedItems);

  const initialFurnitureBlocks = [...p1Res.blocks, ...p2Res.blocks, ...p3Res.blocks];
  const compactedFurniture = compactItems(initialFurnitureBlocks, bounds);

  let layoutKey = '';
  if (layoutCache) {
    layoutKey = '';
    for (let i = 0; i < compactedFurniture.length; i++) {
      const b = compactedFurniture[i];
      layoutKey += `${b.itemId}:${b.x},${b.y},${b.z},${b.length},${b.width};`;
    }
    const cached = layoutCache.get(layoutKey);
    if (cached) {
      return {
        blocks: cached.blocks.map((b) => ({ ...b })),
        unpackedItems: [...cached.unpackedItems],
        score: cached.score,
      };
    }
  }

  occupiedSpaces.length = 0;
  const stackableSurfaces: StackableSurface[] = [];
  const subFurnitureCavities: SubFurnitureCavity[] = [];

  for (const block of compactedFurniture) {
    const itemDef = getItem(block.itemId);

    if (itemDef && isFourLeggedTableOrDesk(itemDef)) {
      subFurnitureCavities.push({
        id: nextId('cavity'),
        ownerBlockId: block.id,
        x: block.x + 2,
        y: 0,
        z: block.z + 2,
        length: block.length - 4,
        height: block.height - 4,
        width: block.width - 4,
      });

      const legH = block.height - 4;
      const topH = 4;

      // Tabletop
      occupiedSpaces.push({
        x: block.x,
        y: legH,
        z: block.z,
        length: block.length,
        height: topH,
        width: block.width,
        ownerBlockId: block.id,
        canStackOn: true,
      });

      // 4 Legs (2" x 2" posts)
      occupiedSpaces.push({ x: block.x, y: 0, z: block.z, length: 2, height: legH, width: 2, canStackOn: false });
      occupiedSpaces.push({ x: block.x, y: 0, z: block.z + block.width - 2, length: 2, height: legH, width: 2, canStackOn: false });
      occupiedSpaces.push({ x: block.x + block.length - 2, y: 0, z: block.z, length: 2, height: legH, width: 2, canStackOn: false });
      occupiedSpaces.push({ x: block.x + block.length - 2, y: 0, z: block.z + block.width - 2, length: 2, height: legH, width: 2, canStackOn: false });
    } else {
      const canStack =
        block.itemId === 'tv_stand' ||
        block.itemId === 'coffee_table' ||
        Boolean(itemDef?.canStackOnTop) ||
        block.itemId === 'dresser_6drawer' ||
        block.itemId === 'nightstand' ||
        block.itemId === 'desk';

      occupiedSpaces.push({
        x: block.x,
        y: block.y,
        z: block.z,
        length: block.length,
        height: block.height,
        width: block.width,
        ownerBlockId: block.id,
        canStackOn: canStack,
      });

      if (canStack) {
        stackableSurfaces.push({
          ownerBlockId: block.id,
          x: block.x,
          z: block.z,
          length: block.length,
          width: block.width,
          y: block.y + block.height,
        });
      }
    }
  }

  const p4Res = packPhase4Attic(truck, flatItems, occupiedSpaces, nextId);

  const standardBoxes = flatItems.filter((item) => item.isBox && item.id !== 'box_wardrobe');
  const sortedBoxes: Array<ItemDefinition & { count: number }> = [];

  const large = standardBoxes.find((b) => b.id === 'box_large');
  if (large) sortedBoxes.push(large);
  const medium = standardBoxes.find((b) => b.id === 'box_medium');
  if (medium) sortedBoxes.push(medium);
  const small = standardBoxes.find((b) => b.id === 'box_small');
  if (small) sortedBoxes.push(small);

  if (p4Res.unassignedWardrobes > 0 && ITEMS.box_wardrobe) {
    sortedBoxes.unshift({
      ...ITEMS.box_wardrobe,
      count: p4Res.unassignedWardrobes,
    });
  }

  const boxQueue: ItemDefinition[] = [];
  for (const b of sortedBoxes) {
    for (let i = 0; i < b.count; i++) {
      boxQueue.push(b);
    }
  }

  const p5Res = packPhase5Boxes(
    truck,
    boxQueue,
    occupiedSpaces,
    stackableSurfaces,
    subFurnitureCavities,
    nextId,
    heuristic,
    compactedFurniture
  );
  unpackedItems.push(...p5Res.unpackedItems);

  const allPlacedBlocks = [
    ...compactedFurniture,
    ...p4Res.blocks,
    ...p5Res.blocks,
  ];

  const finalCompactedBlocks = compactItems(allPlacedBlocks, bounds);

  // -------------------------------------------------------------------------
  // 8. SCORING
  // -------------------------------------------------------------------------
  const placedCount = finalCompactedBlocks.length;
  const maxX = placedCount > 0 ? Math.max(...finalCompactedBlocks.map((b) => b.x + b.length)) : 0;
  const score = calculateLayoutScore(placedCount, maxX, truckWidth, truckHeight);

  const result: PassExecutionResult = {
    blocks: finalCompactedBlocks,
    unpackedItems,
    score,
  };
  if (layoutCache && layoutKey) {
    layoutCache.set(layoutKey, result);
  }
  return result;
}

const PACK_TRUCK_MEMO_CACHE = new Map<string, PackEngineResult>();
const MAX_MEMO_CACHE_SIZE = 100;

function getMemoKey(
  truckId: string,
  inventory: Record<string, number>,
  customItems: CustomItemInput[]
): string {
  let invStr = '';
  const keys = Object.keys(inventory).sort();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = inventory[k];
    if (v > 0) invStr += `${k}:${v},`;
  }
  let custStr = '';
  for (let i = 0; i < customItems.length; i++) {
    const c = customItems[i];
    if (c.quantity > 0) custStr += `${c.id}:${c.quantity}:${c.length}x${c.width}x${c.height},`;
  }
  return `${truckId}|${invStr}|${custStr}`;
}

/**
 * Main packing entry point.
 * Runs a Multi-Pass Heuristic Race across Pass A (Height), Pass B (Footprint),
 * and Pass C (Volume FFD), returning the layout with the highest score.
 */
export function packTruck(
  truckOrId: TruckSpec | TruckId,
  inventory: Record<string, number>,
  customItems: CustomItemInput[] = []
): PackEngineResult {
  const truck: TruckSpec = typeof truckOrId === 'string' ? TRUCKS[truckOrId] : truckOrId;

  const totalItemCount =
    Object.values(inventory).reduce((sum, q) => sum + Math.max(0, q), 0) +
    customItems.reduce((sum, c) => sum + Math.max(0, c.quantity), 0);

  if (totalItemCount === 0) {
    return {
      blocks: [],
      unpackedItems: [],
      totalPackedVolumeCuFt: 0,
      totalPackedWeightLbs: 0,
      truck,
      winningPass: 'volume',
      passScores: { height: 0, footprint: 0, volume: 0 },
    };
  }

  const memoKey = getMemoKey(truck.id, inventory, customItems);
  const cached = PACK_TRUCK_MEMO_CACHE.get(memoKey);
  if (cached) {
    return {
      blocks: cached.blocks.map((b) => ({ ...b })),
      unpackedItems: cached.unpackedItems.map((u) => ({ ...u })),
      totalPackedVolumeCuFt: cached.totalPackedVolumeCuFt,
      totalPackedWeightLbs: cached.totalPackedWeightLbs,
      truck: cached.truck,
      winningPass: cached.winningPass,
      passScores: cached.passScores ? { ...cached.passScores } : undefined,
    };
  }

  const flatItems: FlatPackingItem[] = [];

  for (const [itemId, qty] of Object.entries(inventory)) {
    if (qty <= 0) continue;
    const def = getItem(itemId);
    if (def) {
      flatItems.push({ ...def, count: qty });
    }
  }

  for (const custom of customItems) {
    if (custom.quantity <= 0) continue;
    const vol = Number(((custom.length * custom.width * custom.height) / 1728).toFixed(1));
    const wt = custom.weightLbs ?? Math.round(vol * 8);
    flatItems.push({
      id: custom.id,
      name: custom.name,
      category: custom.category ?? 'custom',
      dimensions: {
        length: custom.length,
        width: custom.width,
        height: custom.height,
      },
      volumeCuFt: vol,
      weightLbs: wt,
      zone: 'floor',
      canStackOnTop: custom.height <= 36 && custom.width >= 16 && custom.length >= 16,
      color: custom.color ?? '#6366F1',
      count: custom.quantity,
      customId: custom.id,
    });
  }

  // Multi-Pass Heuristic Race: Pass A (Height), Pass B (Footprint), Pass C (Volume)
  const layoutCache = new Map<string, PassExecutionResult>();
  const passes: HeuristicPass[] = ['height', 'footprint', 'volume'];
  const passResults: Record<HeuristicPass, PassExecutionResult> = {
    height: runPackingPass(truck, flatItems, 'height', layoutCache),
    footprint: runPackingPass(truck, flatItems, 'footprint', layoutCache),
    volume: runPackingPass(truck, flatItems, 'volume', layoutCache),
  };

  const passScores: Record<HeuristicPass, number> = {
    height: passResults.height.score,
    footprint: passResults.footprint.score,
    volume: passResults.volume.score,
  };

  let bestPass: HeuristicPass = 'volume';
  let bestResult = passResults.volume;
  let highestScore = passResults.volume.score;

  for (const p of passes) {
    const cand = passResults[p];
    if (cand.score > highestScore) {
      highestScore = cand.score;
      bestPass = p;
      bestResult = cand;
    } else if (cand.score === highestScore && cand.blocks.length > bestResult.blocks.length) {
      bestPass = p;
      bestResult = cand;
    }
  }

  const totalPackedVolumeCuFt = Number(
    bestResult.blocks.reduce((sum, b) => sum + b.volumeCuFt, 0).toFixed(1)
  );
  const totalPackedWeightLbs = Math.round(
    bestResult.blocks.reduce((sum, b) => sum + b.weightLbs, 0)
  );

  const sortedBlocks = sortBlocksTopological(bestResult.blocks);

  const finalResult: PackEngineResult = {
    blocks: sortedBlocks,
    unpackedItems: bestResult.unpackedItems,
    totalPackedVolumeCuFt,
    totalPackedWeightLbs,
    truck,
    winningPass: bestPass,
    passScores,
  };

  if (PACK_TRUCK_MEMO_CACHE.size >= MAX_MEMO_CACHE_SIZE) {
    const oldestKey = PACK_TRUCK_MEMO_CACHE.keys().next().value;
    if (oldestKey) PACK_TRUCK_MEMO_CACHE.delete(oldestKey);
  }
  PACK_TRUCK_MEMO_CACHE.set(memoKey, finalResult);

  return finalResult;
}

export default packTruck;

