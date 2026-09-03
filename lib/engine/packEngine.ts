import { TruckSpec, TRUCKS, TruckId } from '../constants/trucks';
import { ItemDefinition, ITEMS, getItem, ItemCategory } from '../constants/items';

export interface DrawableBlock {
  id: string;
  itemId: string;
  label: string;
  x: number;      // inches from front bulkhead (X-axis, 0 to truck.length)
  y: number;      // inches from floor deck (Y-axis, 0 to truck.height)
  z: number;      // inches from left wall (Z-axis, 0 to truck.width)
  length: number; // inches along X
  height: number; // inches along Y
  width: number;  // inches along Z
  color: string;
  category: ItemCategory;
  isAttic: boolean;
  weightLbs: number;
  volumeCuFt: number;
  dimensionsText: string;
}

export interface CustomItemInput {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  weightLbs?: number;
  color?: string;
  category?: ItemCategory;
}

export interface PackEngineResult {
  blocks: DrawableBlock[];
  unpackedItems: Array<{ id: string; name: string; reason: string }>;
  totalPackedVolumeCuFt: number;
  totalPackedWeightLbs: number;
  truck: TruckSpec;
}

interface StackableSurface {
  x: number;
  z: number;
  length: number;
  width: number;
  y: number; // Top surface height
}

interface FloorRect {
  x: number;
  z: number;
  length: number;
  width: number;
}

function checkCollision(
  x: number,
  z: number,
  length: number,
  width: number,
  occupied: FloorRect[]
): boolean {
  for (const rect of occupied) {
    const overlapX = x < rect.x + rect.length && x + length > rect.x;
    const overlapZ = z < rect.z + rect.width && z + width > rect.z;
    if (overlapX && overlapZ) {
      return true;
    }
  }
  return false;
}

export function packTruck(
  truckOrId: TruckSpec | TruckId,
  inventory: Record<string, number>,
  customItems: CustomItemInput[] = []
): PackEngineResult {
  const truck: TruckSpec = typeof truckOrId === 'string' ? TRUCKS[truckOrId] : truckOrId;
  const blocks: DrawableBlock[] = [];
  const unpackedItems: Array<{ id: string; name: string; reason: string }> = [];

  const truckLength = truck.length;
  const truckWidth = truck.width;
  const truckHeight = truck.height;

  // Occupied 2D footprints on the floor deck
  const floorOccupied: FloorRect[] = [];
  // Elevated stackable platforms (e.g. tops of flat dressers)
  const stackableSurfaces: StackableSurface[] = [];

  let blockCounter = 0;
  const nextId = (prefix: string) => `${prefix}_${++blockCounter}`;

  // Expand inventory into concrete list of items
  const flatItems: Array<ItemDefinition & { count: number; customId?: string }> = [];

  for (const [itemId, qty] of Object.entries(inventory)) {
    if (qty <= 0) continue;
    const def = getItem(itemId);
    if (def) {
      flatItems.push({ ...def, count: qty });
    }
  }

  // Add custom items
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
      canStackOnTop: false,
      color: custom.color ?? '#6366F1',
      count: custom.quantity,
      customId: custom.id,
    });
  }

  // =========================================================================
  // PHASE 1 (Left Wall): Snap mattresses, box springs, and tabletops along Z = 0
  // Stood on edge along the X-axis
  // =========================================================================
  let leftWallCursorX = 0;
  const phase1Items = flatItems.filter(
    (item) => item.zone === 'wall_left' && !item.isBox
  );

  for (const item of phase1Items) {
    for (let i = 0; i < item.count; i++) {
      // Packed dimensions: stood on edge along left wall (Z = 0)
      const len = item.dimensions.length;
      const wid = item.dimensions.width;
      let hei = item.dimensions.height;

      // Ensure item does not exceed ceiling
      if (hei > truckHeight) {
        hei = truckHeight;
      }

      if (leftWallCursorX + len <= truckLength) {
        const block: DrawableBlock = {
          id: nextId(item.id),
          itemId: item.id,
          label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
          x: leftWallCursorX,
          y: 0,
          z: 0,
          length: len,
          width: wid,
          height: hei,
          color: item.color,
          category: item.category,
          isAttic: false,
          weightLbs: item.weightLbs,
          volumeCuFt: item.volumeCuFt,
          dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
        };

        blocks.push(block);
        floorOccupied.push({
          x: leftWallCursorX,
          z: 0,
          length: len,
          width: wid,
        });

        leftWallCursorX += len;
      } else {
        unpackedItems.push({
          id: item.id,
          name: item.name,
          reason: 'Insufficient length along left wall',
        });
      }
    }
  }

  // Determine Z boundary reserved by left wall items near front bulkhead (X < 40)
  const leftWallFrontWidth = floorOccupied
    .filter((rect) => rect.x < 40)
    .reduce((max, rect) => Math.max(max, rect.z + rect.width), 0);

  // =========================================================================
  // PHASE 2 (Front Bulkhead): Snap upright sofas and tall heavy items along X = 0
  // Across the available Z-axis width
  // =========================================================================
  let bulkheadCursorZ = leftWallFrontWidth;
  const phase2Items = flatItems.filter(
    (item) => item.zone === 'bulkhead' && !item.isBox
  );

  for (const item of phase2Items) {
    for (let i = 0; i < item.count; i++) {
      let len = item.dimensions.length; // along X
      let wid = item.dimensions.width;  // along Z
      let hei = item.dimensions.height; // along Y

      // If upright sofa height exceeds truck ceiling (e.g. 84" sofa in 74" 10ft truck),
      // Orient horizontally so it does not exceed ceiling:
      if (hei > truckHeight) {
        const prevHei = hei;
        hei = Math.min(prevHei, truckHeight);
      }

      if (bulkheadCursorZ + wid <= truckWidth && len <= truckLength) {
        const block: DrawableBlock = {
          id: nextId(item.id),
          itemId: item.id,
          label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
          x: 0,
          y: 0,
          z: bulkheadCursorZ,
          length: len,
          width: wid,
          height: hei,
          color: item.color,
          category: item.category,
          isAttic: false,
          weightLbs: item.weightLbs,
          volumeCuFt: item.volumeCuFt,
          dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
        };

        blocks.push(block);
        floorOccupied.push({
          x: 0,
          z: bulkheadCursorZ,
          length: len,
          width: wid,
        });

        bulkheadCursorZ += wid;
      } else {
        unpackedItems.push({
          id: item.id,
          name: item.name,
          reason: 'Insufficient width along front bulkhead',
        });
      }
    }
  }

  // =========================================================================
  // PHASE 3 (Floor Deck): Place dressers, nightstands, and heavy items flat on deck
  // Floor level (Y = 0) in remaining open space
  // =========================================================================
  const phase3Items = flatItems.filter(
    (item) => item.zone === 'floor' && !item.isBox
  );

  for (const item of phase3Items) {
    for (let i = 0; i < item.count; i++) {
      const len = item.dimensions.length;
      const wid = item.dimensions.width;
      let hei = Math.min(item.dimensions.height, truckHeight);

      let placed = false;
      const stepSize = 6; // Grid search step (6 inches)

      for (let x = 0; x <= truckLength - len; x += stepSize) {
        for (let z = 0; z <= truckWidth - wid; z += stepSize) {
          if (!checkCollision(x, z, len, wid, floorOccupied)) {
            const block: DrawableBlock = {
              id: nextId(item.id),
              itemId: item.id,
              label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
              x,
              y: 0,
              z,
              length: len,
              width: wid,
              height: hei,
              color: item.color,
              category: item.category,
              isAttic: false,
              weightLbs: item.weightLbs,
              volumeCuFt: item.volumeCuFt,
              dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
            };

            blocks.push(block);
            floorOccupied.push({ x, z, length: len, width: wid });

            if (item.canStackOnTop) {
              stackableSurfaces.push({
                x,
                z,
                length: len,
                width: wid,
                y: hei,
              });
            }

            placed = true;
            break;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        unpackedItems.push({
          id: item.id,
          name: item.name,
          reason: 'No open floor deck space',
        });
      }
    }
  }

  // =========================================================================
  // PHASE 4 (Mom's Attic): Route wardrobe boxes, fragile items, light parcels
  // Elevated cab compartment (Y >= usableHeight - atticHeight)
  // =========================================================================
  const atticWardrobes = flatItems.filter((item) => item.id === 'box_wardrobe');
  const remainingWardrobeCount = atticWardrobes.reduce((acc, it) => acc + it.count, 0);
  let unassignedWardrobes = 0;

  if (truck.hasAttic && truck.attic) {
    const atticL = truck.attic.length; // e.g. 36"
    const atticW = truck.attic.width;  // e.g. 76"
    const atticH = truck.attic.height; // e.g. 30"
    const atticFloorY = truckHeight - atticH;
    const atticStartZ = Math.max(0, Math.floor((truckWidth - atticW) / 2));

    let atticCursorZ = atticStartZ;
    let atticCursorX = 0;

    const wardrobeDef = ITEMS.box_wardrobe;
    const wLen = wardrobeDef?.dimensions.length ?? 24;
    const wWid = wardrobeDef?.dimensions.width ?? 24;
    const wHei = Math.min(wardrobeDef?.dimensions.height ?? 48, atticH);

    for (let i = 0; i < remainingWardrobeCount; i++) {
      if (atticCursorZ + wWid <= atticStartZ + atticW && atticCursorX + wLen <= atticL) {
        blocks.push({
          id: nextId('wardrobe_attic'),
          itemId: 'box_wardrobe',
          label: 'WARDROBE',
          x: atticCursorX,
          y: atticFloorY,
          z: atticCursorZ,
          length: wLen,
          width: wWid,
          height: wHei,
          color: wardrobeDef?.color ?? '#854D0E',
          category: 'boxes',
          isAttic: true,
          weightLbs: wardrobeDef?.weightLbs ?? 50,
          volumeCuFt: wardrobeDef?.volumeCuFt ?? 16,
          dimensionsText: `${wLen}″L × ${wWid}″W × ${wHei}″H`,
        });

        atticCursorZ += wWid;
        if (atticCursorZ + wWid > atticStartZ + atticW) {
          atticCursorZ = atticStartZ;
          atticCursorX += wLen;
        }
      } else {
        unassignedWardrobes++;
      }
    }
  } else {
    // No Mom's attic; all wardrobe boxes will be packed on floor
    unassignedWardrobes = remainingWardrobeCount;
  }

  // =========================================================================
  // PHASE 5 (Box Columns / Tiers): Aggregate small, medium, large & remaining
  // wardrobe boxes into dense uniform vertical tiers stacked floor-to-ceiling
  // =========================================================================
  const standardBoxes = flatItems.filter((item) => item.isBox && item.id !== 'box_wardrobe');
  // Order boxes: large first (base), then medium, then small (top)
  const sortedBoxes: Array<ItemDefinition & { count: number }> = [];

  const large = standardBoxes.find((b) => b.id === 'box_large');
  if (large) sortedBoxes.push(large);
  const medium = standardBoxes.find((b) => b.id === 'box_medium');
  if (medium) sortedBoxes.push(medium);
  const small = standardBoxes.find((b) => b.id === 'box_small');
  if (small) sortedBoxes.push(small);

  // Add any unassigned wardrobe boxes
  if (unassignedWardrobes > 0 && ITEMS.box_wardrobe) {
    sortedBoxes.unshift({
      ...ITEMS.box_wardrobe,
      count: unassignedWardrobes,
    });
  }

  // Packing surfaces for box tiers:
  // 1. Stackable furniture tops (dressers)
  // 2. Open floor areas in a grid
  interface TierColumn {
    x: number;
    z: number;
    baseY: number;
    currentY: number;
    length: number;
    width: number;
    boxCount: number;
    maxStack: number;
  }

  const columns: TierColumn[] = [];

  // Register stackable furniture tops as tier columns
  for (const surf of stackableSurfaces) {
    const colLen = 18;
    const colWid = 18;
    for (let x = surf.x; x + colLen <= surf.x + surf.length; x += colLen) {
      for (let z = surf.z; z + colWid <= surf.z + surf.width; z += colWid) {
        columns.push({
          x,
          z,
          baseY: surf.y,
          currentY: surf.y,
          length: colLen,
          width: colWid,
          boxCount: 0,
          maxStack: 3,
        });
      }
    }
  }

  // Find remaining open floor spaces to create floor tier columns
  const floorStep = 18;
  for (let x = 0; x <= truckLength - floorStep; x += floorStep) {
    for (let z = 0; z <= truckWidth - floorStep; z += floorStep) {
      if (!checkCollision(x, z, floorStep, floorStep, floorOccupied)) {
        columns.push({
          x,
          z,
          baseY: 0,
          currentY: 0,
          length: floorStep,
          width: floorStep,
          boxCount: 0,
          maxStack: 4,
        });
        floorOccupied.push({ x, z, length: floorStep, width: floorStep });
      }
    }
  }

  // Pack boxes into columns
  let colIndex = 0;
  for (const boxType of sortedBoxes) {
    const bLen = boxType.dimensions.length;
    const bWid = boxType.dimensions.width;
    const bHei = boxType.dimensions.height;
    const maxStack = boxType.maxStackHeight ?? 4;

    for (let i = 0; i < boxType.count; i++) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < columns.length) {
        const col = columns[colIndex];
        if (
          col.currentY + bHei <= truckHeight &&
          col.boxCount < Math.min(col.maxStack, maxStack)
        ) {
          blocks.push({
            id: nextId(boxType.id),
            itemId: boxType.id,
            label: boxType.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
            x: col.x,
            y: col.currentY,
            z: col.z,
            length: bLen,
            width: bWid,
            height: bHei,
            color: boxType.color,
            category: 'boxes',
            isAttic: false,
            weightLbs: boxType.weightLbs,
            volumeCuFt: boxType.volumeCuFt,
            dimensionsText: `${bLen}″L × ${bWid}″W × ${bHei}″H`,
          });

          col.currentY += bHei;
          col.boxCount++;
          placed = true;
        } else {
          colIndex = (colIndex + 1) % columns.length;
          attempts++;
        }
      }

      if (!placed) {
        unpackedItems.push({
          id: boxType.id,
          name: boxType.name,
          reason: 'Truck volume full (no vertical tier space remaining)',
        });
      }
    }
  }

  // Compute packed totals
  const totalPackedVolumeCuFt = Number(
    blocks.reduce((sum, b) => sum + b.volumeCuFt, 0).toFixed(1)
  );
  const totalPackedWeightLbs = Math.round(
    blocks.reduce((sum, b) => sum + b.weightLbs, 0)
  );

  return {
    blocks,
    unpackedItems,
    totalPackedVolumeCuFt,
    totalPackedWeightLbs,
    truck,
  };
}
