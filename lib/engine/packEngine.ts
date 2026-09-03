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
  y: number; // Top surface height (exact plane where boxes sit)
}

interface Occupied3D {
  x: number;
  y: number;
  z: number;
  length: number;
  height: number;
  width: number;
}

/**
 * Strict 3D AABB collision check.
 * Touching faces do NOT intersect, allowing zero-gap flush packing.
 */
function check3DCollision(
  x: number,
  y: number,
  z: number,
  length: number,
  height: number,
  width: number,
  occupied: Occupied3D[]
): boolean {
  for (const box of occupied) {
    const overlapX = x < box.x + box.length && x + length > box.x;
    const overlapY = y < box.y + box.height && y + height > box.y;
    const overlapZ = z < box.z + box.width && z + width > box.z;
    if (overlapX && overlapY && overlapZ) {
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

  // Occupied 3D spaces in the cargo hold
  const occupiedSpaces: Occupied3D[] = [];
  // Elevated stackable platforms (e.g. flat tops of dressers and desks)
  const stackableSurfaces: StackableSurface[] = [];

  // Mom's Attic specs
  const hasAttic = Boolean(truck.hasAttic && truck.attic);
  const atticL = hasAttic && truck.attic ? truck.attic.length : 0;
  const atticW = hasAttic && truck.attic ? truck.attic.width : 0;
  const atticH = hasAttic && truck.attic ? truck.attic.height : 0;
  const atticFloorY = hasAttic ? truckHeight - atticH : truckHeight;
  const atticStartZ = hasAttic ? Math.max(0, Math.floor((truckWidth - atticW) / 2)) : 0;

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
  const phase1Items = flatItems.filter(
    (item) => item.zone === 'wall_left' && !item.isBox
  );

  let leftWallCursorX = 0;
  let maxLeftWallThickness = 0;

  for (const item of phase1Items) {
    for (let i = 0; i < item.count; i++) {
      const len = item.dimensions.length;
      const wid = item.dimensions.width;
      let hei = item.dimensions.height;

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
        occupiedSpaces.push({
          x: leftWallCursorX,
          y: 0,
          z: 0,
          length: len,
          height: hei,
          width: wid,
        });

        maxLeftWallThickness = Math.max(maxLeftWallThickness, wid);
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

  // Determine Z boundary reserved by left wall items near the front on the floor
  const leftWallFrontWidth = occupiedSpaces
    .filter((box) => box.y === 0 && box.x < 40 && box.z === 0)
    .reduce((max, box) => Math.max(max, box.z + box.width), 0);

  // =========================================================================
  // PHASE 2 (Bulkhead / Upright Sofas): Stand vertically on end along X = 0
  // =========================================================================
  const phase2Items = flatItems.filter(
    (item) => item.zone === 'bulkhead' && !item.isBox
  );

  let bulkheadCursorZ = leftWallFrontWidth;

  for (const item of phase2Items) {
    for (let i = 0; i < item.count; i++) {
      let len = item.dimensions.length; // along X
      let wid = item.dimensions.width;  // along Z
      let hei = item.dimensions.height; // along Y

      if (hei > truckHeight) {
        hei = truckHeight;
      }

      const targetX = 0;

      if (bulkheadCursorZ + wid <= truckWidth && targetX + len <= truckLength) {
        const block: DrawableBlock = {
          id: nextId(item.id),
          itemId: item.id,
          label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
          x: targetX,
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
        occupiedSpaces.push({
          x: targetX,
          y: 0,
          z: bulkheadCursorZ,
          length: len,
          height: hei,
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
  // PHASE 3 (Floor Deck): Place dressers, nightstands, tables, and consoles
  // Strict gravity settlement on floor (Y = 0) with clean grid-aligned snapping
  // =========================================================================
  const phase3Items = flatItems
    .filter((item) => item.zone === 'floor' && !item.isBox)
    .sort((a, b) => b.volumeCuFt - a.volumeCuFt);

  for (const item of phase3Items) {
    for (let i = 0; i < item.count; i++) {
      const origLen = item.dimensions.length;
      const origWid = item.dimensions.width;
      let hei = Math.min(item.dimensions.height, truckHeight);

      // Generate candidate anchor coordinates:
      // Priority 1: Exact 12-inch and 6-inch grid-aligned lines for crisp CAD visual alignment
      // Priority 2: Direct flush contact points with placed items
      const gridXs = Array.from(
        new Set([
          0,
          atticL,
          ...occupiedSpaces.map((r) => Math.ceil((r.x + r.length) / 6) * 6),
          ...occupiedSpaces.map((r) => Math.ceil((r.x + r.length) / 12) * 12),
          12, 24, 36, 48, 60, 72, 84, 96, 108,
        ])
      )
        .filter((x) => x >= 0 && x < truckLength)
        .sort((a, b) => a - b);

      const flushXs = Array.from(
        new Set([
          0,
          atticL,
          ...occupiedSpaces.map((r) => r.x + r.length),
        ])
      )
        .filter((x) => x >= 0 && x < truckLength)
        .sort((a, b) => a - b);

      const candidateXs = Array.from(new Set([...gridXs, ...flushXs]));

      const gridZs = Array.from(
        new Set([
          0,
          ...occupiedSpaces.map((r) => Math.ceil((r.z + r.width) / 6) * 6),
          ...occupiedSpaces.map((r) => Math.ceil((r.z + r.width) / 12) * 12),
          12, 24, 36, 48, 60, 72,
        ])
      )
        .filter((z) => z >= 0 && z < truckWidth)
        .sort((a, b) => a - b);

      const flushZs = Array.from(
        new Set([
          0,
          leftWallFrontWidth,
          maxLeftWallThickness,
          ...occupiedSpaces.map((r) => r.z + r.width),
        ])
      )
        .filter((z) => z >= 0 && z < truckWidth)
        .sort((a, b) => a - b);

      const candidateZs = Array.from(new Set([...gridZs, ...flushZs]));

      // Test orientations: [origLen, origWid] and [origWid, origLen]
      const orientations = [
        { len: origLen, wid: origWid },
        ...(origLen !== origWid ? [{ len: origWid, wid: origLen }] : []),
      ];

      let placed = false;

      // Pass 1: Try grid-aligned candidate points
      for (const orient of orientations) {
        const { len, wid } = orient;
        for (const cx of candidateXs) {
          if (cx + len > truckLength) continue;
          for (const cz of candidateZs) {
            if (cz + wid > truckWidth) continue;

            // Check if placing under attic exceeds clearance
            if (hasAttic && cx < atticL && cz + wid > atticStartZ && cz < atticStartZ + atticW) {
              if (hei > atticFloorY) continue;
            }

            if (!check3DCollision(cx, 0, cz, len, hei, wid, occupiedSpaces)) {
              const block: DrawableBlock = {
                id: nextId(item.id),
                itemId: item.id,
                label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                x: cx,
                y: 0,
                z: cz,
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
              occupiedSpaces.push({ x: cx, y: 0, z: cz, length: len, height: hei, width: wid });

              if (item.canStackOnTop) {
                stackableSurfaces.push({
                  x: cx,
                  z: cz,
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
        if (placed) break;
      }

      // Pass 2: Fallback 1-inch scan if candidate snapping missed a narrow corridor
      if (!placed) {
        for (const orient of orientations) {
          const { len, wid } = orient;
          for (let x = 0; x <= truckLength - len; x += 1) {
            for (let z = 0; z <= truckWidth - wid; z += 1) {
              if (hasAttic && x < atticL && z + wid > atticStartZ && z < atticStartZ + atticW) {
                if (hei > atticFloorY) continue;
              }

              if (!check3DCollision(x, 0, z, len, hei, wid, occupiedSpaces)) {
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
                occupiedSpaces.push({ x, y: 0, z, length: len, height: hei, width: wid });

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
          if (placed) break;
        }
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
  // PHASE 4 (Mom's Attic): Route wardrobe boxes into elevated cab shelf
  // =========================================================================
  const atticWardrobes = flatItems.filter((item) => item.id === 'box_wardrobe');
  const remainingWardrobeCount = atticWardrobes.reduce((acc, it) => acc + it.count, 0);
  let unassignedWardrobes = 0;

  if (hasAttic && truck.attic) {
    const wardrobeDef = ITEMS.box_wardrobe;
    const wLen = wardrobeDef?.dimensions.length ?? 24;
    const wWid = wardrobeDef?.dimensions.width ?? 24;
    const wHei = Math.min(wardrobeDef?.dimensions.height ?? 48, atticH);

    let placedCount = 0;

    // Scan the attic shelf across X and Z for collision-free placement
    for (let x = 0; x + wLen <= atticL && placedCount < remainingWardrobeCount; x += 12) {
      for (
        let z = atticStartZ;
        z + wWid <= atticStartZ + atticW && placedCount < remainingWardrobeCount;
        z += 12
      ) {
        if (!check3DCollision(x, atticFloorY, z, wLen, wHei, wWid, occupiedSpaces)) {
          blocks.push({
            id: nextId('wardrobe_attic'),
            itemId: 'box_wardrobe',
            label: 'WARDROBE',
            x,
            y: atticFloorY,
            z,
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

          occupiedSpaces.push({
            x,
            y: atticFloorY,
            z,
            length: wLen,
            height: wHei,
            width: wWid,
          });

          placedCount++;
        }
      }
    }

    unassignedWardrobes = remainingWardrobeCount - placedCount;
  } else {
    unassignedWardrobes = remainingWardrobeCount;
  }

  // =========================================================================
  // PHASE 5 (Wall-First Box Tiers): Solid vertical tiers floor-to-ceiling
  // =========================================================================
  const standardBoxes = flatItems.filter((item) => item.isBox && item.id !== 'box_wardrobe');
  const sortedBoxes: Array<ItemDefinition & { count: number }> = [];

  const large = standardBoxes.find((b) => b.id === 'box_large');
  if (large) sortedBoxes.push(large);
  const medium = standardBoxes.find((b) => b.id === 'box_medium');
  if (medium) sortedBoxes.push(medium);
  const small = standardBoxes.find((b) => b.id === 'box_small');
  if (small) sortedBoxes.push(small);

  if (unassignedWardrobes > 0 && ITEMS.box_wardrobe) {
    sortedBoxes.unshift({
      ...ITEMS.box_wardrobe,
      count: unassignedWardrobes,
    });
  }

  const boxQueue: ItemDefinition[] = [];
  for (const b of sortedBoxes) {
    for (let i = 0; i < b.count; i++) {
      boxQueue.push(b);
    }
  }

  let queueIdx = 0;

  // 1. Fill stackable furniture surfaces first (tops of dressers/desks)
  for (const surf of stackableSurfaces) {
    const colLen = 18;
    const colWid = 18;

    for (let x = surf.x; x + colLen <= surf.x + surf.length; x += colLen) {
      for (let z = surf.z; z + colWid <= surf.z + surf.width; z += colWid) {
        let currentY = surf.y;
        let stackCount = 0;

        while (queueIdx < boxQueue.length && stackCount < 3) {
          const box = boxQueue[queueIdx];
          const bLen = Math.min(box.dimensions.length, colLen);
          const bWid = Math.min(box.dimensions.width, colWid);
          const bHei = box.dimensions.height;

          // Check ceiling clearance at this X position
          const maxCeilY = hasAttic && x < atticL ? atticFloorY : truckHeight;

          if (
            currentY + bHei <= maxCeilY &&
            !check3DCollision(x, currentY, z, bLen, bHei, bWid, occupiedSpaces)
          ) {
            blocks.push({
              id: nextId(box.id),
              itemId: box.id,
              label: box.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
              x,
              y: currentY,
              z,
              length: bLen,
              width: bWid,
              height: bHei,
              color: box.color,
              category: 'boxes',
              isAttic: false,
              weightLbs: box.weightLbs,
              volumeCuFt: box.volumeCuFt,
              dimensionsText: `${bLen}″L × ${bWid}″W × ${bHei}″H`,
            });

            occupiedSpaces.push({ x, y: currentY, z, length: bLen, height: bHei, width: bWid });
            currentY += bHei;
            stackCount++;
            queueIdx++;
          } else {
            break;
          }
        }
      }
    }
  }

  // 2. Build solid vertical tiers from floor (Y = 0) in open cargo deck
  const tierDepthX = 18;
  const tierWidthZ = 18;

  for (let x = 0; x + tierDepthX <= truckLength && queueIdx < boxQueue.length; x += tierDepthX) {
    for (let z = 0; z + tierWidthZ <= truckWidth && queueIdx < boxQueue.length; z += tierWidthZ) {
      // Check ceiling clearance at this (X, Z)
      const maxCeilY = hasAttic && x < atticL && z + tierWidthZ > atticStartZ && z < atticStartZ + atticW
        ? atticFloorY
        : truckHeight;

      let currentY = 0;
      let stackCount = 0;
      const maxStackInColumn = 5;

      while (queueIdx < boxQueue.length && stackCount < maxStackInColumn) {
        const box = boxQueue[queueIdx];
        const bLen = Math.min(box.dimensions.length, tierDepthX);
        const bWid = Math.min(box.dimensions.width, tierWidthZ);
        const bHei = box.dimensions.height;

        if (currentY + bHei <= maxCeilY && !check3DCollision(x, currentY, z, bLen, bHei, bWid, occupiedSpaces)) {
          blocks.push({
            id: nextId(box.id),
            itemId: box.id,
            label: box.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
            x,
            y: currentY,
            z,
            length: bLen,
            width: bWid,
            height: bHei,
            color: box.color,
            category: 'boxes',
            isAttic: false,
            weightLbs: box.weightLbs,
            volumeCuFt: box.volumeCuFt,
            dimensionsText: `${bLen}″L × ${bWid}″W × ${bHei}″H`,
          });

          occupiedSpaces.push({ x, y: currentY, z, length: bLen, height: bHei, width: bWid });
          currentY += bHei;
          stackCount++;
          queueIdx++;
        } else {
          // If collision or ceiling reached, advance to next position
          if (currentY === 0) {
            // Floor was blocked, skip this column entirely
            break;
          } else {
            // Column full to ceiling/obstacle
            break;
          }
        }
      }
    }
  }

  // Any remaining boxes that could not fit into the vehicle
  while (queueIdx < boxQueue.length) {
    const b = boxQueue[queueIdx];
    unpackedItems.push({
      id: b.id,
      name: b.name,
      reason: 'Vehicle cargo volume full (no vertical tier space remaining)',
    });
    queueIdx++;
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

export interface ScreenBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Standard canonical 30° isometric projection for screen AABB computation.
 */
function defaultProject(x: number, y: number, z: number): { x: number; y: number } {
  const cos30 = 0.8660254037844386;
  const sin30 = 0.5;
  return {
    x: (x - z) * cos30,
    y: (x + z) * sin30 - y,
  };
}

export function getBlockScreenBox(
  b: DrawableBlock,
  projectFn: (x: number, y: number, z: number) => { x: number; y: number } = defaultProject
): ScreenBox {
  const xs = [b.x, b.x + b.length];
  const ys = [b.y, b.y + b.height];
  const zs = [b.z, b.z + b.width];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const x of xs) {
    for (const y of ys) {
      for (const z of zs) {
        const p = projectFn(x, y, z);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
  }

  return { minX, maxX, minY, maxY };
}

export function doScreenBoxesOverlap(a: ScreenBox, b: ScreenBox): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY
  );
}

/**
 * Pairwise 3D Occlusion Test:
 * Evaluates whether block A is strictly behind block B in 3D world coordinates
 * relative to the 30° isometric camera viewing vector (1, 1, 1).
 */
export function isBlockBehind(a: DrawableBlock, b: DrawableBlock): boolean {
  // In our isometric coordinate system:
  // Camera vector points along (+1, +1, +1).
  // A is behind B if along any coordinate axis, A strictly precedes B:
  const aBehindB_X = a.x + a.length <= b.x;
  const aBehindB_Z = a.z + a.width <= b.z;
  const aBehindB_Y = a.y + a.height <= b.y;

  const bBehindA_X = b.x + b.length <= a.x;
  const bBehindA_Z = b.z + b.width <= a.z;
  const bBehindA_Y = b.y + b.height <= a.y;

  const aIsBehind = aBehindB_X || aBehindB_Z || aBehindB_Y;
  const bIsBehind = bBehindA_X || bBehindA_Z || bBehindA_Y;

  // Unambiguous separating axis
  if (aIsBehind && !bIsBehind) {
    return true;
  }
  if (!aIsBehind && bIsBehind) {
    return false;
  }

  // Micro-metric fallback: compare furthest extent relative to camera viewing vector (1, 1, 1)
  const maxExtentA = (a.x + a.length) + (a.z + a.width) + (a.y + a.height);
  const maxExtentB = (b.x + b.length) + (b.z + b.width) + (b.y + b.height);

  return maxExtentA < maxExtentB;
}

/**
 * Topological Sort (Poset) for Isometric 2.5D Cargo Blocks:
 * Constructs a Directed Acyclic Graph (DAG) for all overlapping blocks on screen
 * and uses Kahn's algorithm to guarantee that background blocks are painted before
 * the foreground blocks that occlude them.
 */
export function sortBlocksTopological(
  blocks: DrawableBlock[],
  projectFn: (x: number, y: number, z: number) => { x: number; y: number } = defaultProject
): DrawableBlock[] {
  const n = blocks.length;
  if (n <= 1) return [...blocks];

  const screenBoxes = blocks.map((b) => getBlockScreenBox(b, projectFn));
  const depthKeys = blocks.map(
    (b) => (b.x + b.length) + (b.z + b.width) + (b.y + b.height)
  );

  // Adjacency graph: edge u -> v means block u MUST be drawn before block v
  const adj: number[][] = Array.from({ length: n }, () => []);
  const inDegree: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!doScreenBoxesOverlap(screenBoxes[i], screenBoxes[j])) {
        continue;
      }

      const iBehindJ = isBlockBehind(blocks[i], blocks[j]);
      const jBehindI = isBlockBehind(blocks[j], blocks[i]);

      if (iBehindJ && !jBehindI) {
        adj[i].push(j);
        inDegree[j]++;
      } else if (jBehindI && !iBehindJ) {
        adj[j].push(i);
        inDegree[i]++;
      } else {
        // Fallback comparator based on furthest extent along camera ray
        if (depthKeys[i] < depthKeys[j]) {
          adj[i].push(j);
          inDegree[j]++;
        } else if (depthKeys[j] < depthKeys[i]) {
          adj[j].push(i);
          inDegree[i]++;
        }
      }
    }
  }

  // Kahn's algorithm with priority queue (furthest blocks first)
  const available: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) {
      available.push(i);
    }
  }

  available.sort((a, b) => depthKeys[a] - depthKeys[b]);

  const sorted: DrawableBlock[] = [];

  while (available.length > 0) {
    const u = available.shift()!;
    sorted.push(blocks[u]);

    for (const v of adj[u]) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        let insertIdx = 0;
        while (insertIdx < available.length && depthKeys[available[insertIdx]] < depthKeys[v]) {
          insertIdx++;
        }
        available.splice(insertIdx, 0, v);
      }
    }
  }

  // Fallback if cycles exist
  if (sorted.length < n) {
    const included = new Set(sorted.map((b) => b.id));
    const remaining = blocks.filter((b) => !included.has(b.id));
    remaining.sort((a, b) => {
      const depthA = (a.x + a.length) + (a.z + a.width) + (a.y + a.height);
      const depthB = (b.x + b.length) + (b.z + b.width) + (b.y + b.height);
      return depthA - depthB;
    });
    sorted.push(...remaining);
  }

  return sorted;
}

