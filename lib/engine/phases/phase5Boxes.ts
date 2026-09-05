import { TruckSpec } from '../../constants/trucks';
import { ItemDefinition, getItem } from '../../constants/items';
import { DrawableBlock, Occupied3D, UnpackedItem, StackableSurface, SubFurnitureCavity, Bounds } from '../types';
import { check3DCollision, intervalsOverlap } from '../collision';
import { compactItems } from '../compaction';

export interface Phase5Result {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
}

interface BoxOrientation {
  len: number;
  wid: number;
  hei: number;
}

interface ExtremePoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Returns all distinct 6-degree orthogonal rotations for a box.
 * Evaluates all 6 orthogonal dimension permutations:
 * 1. [length, height, width] -> len=L, hei=H, wid=W
 * 2. [length, width, height] -> len=L, hei=W, wid=H
 * 3. [width, height, length] -> len=W, hei=H, wid=L
 * 4. [width, length, height] -> len=W, hei=L, wid=H
 * 5. [height, length, width] -> len=H, hei=L, wid=W
 * 6. [height, width, length] -> len=H, hei=W, wid=L
 */
const ORIENTATIONS_CACHE = new Map<string, BoxOrientation[]>();

function getBoxOrientations(box: ItemDefinition): BoxOrientation[] {
  const cached = ORIENTATIONS_CACHE.get(box.id);
  if (cached) return cached;

  if (box.id === 'box_wardrobe') {
    const res = [{ len: 24, wid: 24, hei: 48 }];
    ORIENTATIONS_CACHE.set(box.id, res);
    return res;
  }
  const { length: L, width: W, height: H } = box.dimensions;
  const perms = [
    { len: L, hei: H, wid: W },
    { len: L, hei: W, wid: H },
    { len: W, hei: H, wid: L },
    { len: W, hei: L, wid: H },
    { len: H, hei: L, wid: W },
    { len: H, hei: W, wid: L },
  ];

  const unique: BoxOrientation[] = [];
  const seen = new Set<string>();
  for (const p of perms) {
    const key = `${p.len}x${p.hei}x${p.wid}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }
  ORIENTATIONS_CACHE.set(box.id, unique);
  return unique;
}

interface BoxInfo {
  orientations: BoxOrientation[];
  minL: number;
  minW: number;
  minH: number;
}
const BOX_INFO_CACHE = new Map<string, BoxInfo>();

function getBoxInfo(box: ItemDefinition): BoxInfo {
  const cached = BOX_INFO_CACHE.get(box.id);
  if (cached) return cached;
  const orientations = getBoxOrientations(box);
  let minL = Infinity;
  let minW = Infinity;
  let minH = Infinity;
  for (const o of orientations) {
    if (o.len < minL) minL = o.len;
    if (o.wid < minW) minW = o.wid;
    if (o.hei < minH) minH = o.hei;
  }
  const info: BoxInfo = { orientations, minL, minW, minH };
  BOX_INFO_CACHE.set(box.id, info);
  return info;
}

/**
 * Helper to determine if an occupied item can legally have boxes stacked on top of it.
 * Mattresses, sofas, and coffee tables strictly forbid top-stacking.
 */
function canItemSupportStacking(item: Occupied3D): boolean {
  if (item.canStackOn !== undefined) return item.canStackOn;
  if (!item.ownerBlockId) return true;
  const id = item.ownerBlockId.toLowerCase();
  return !id.includes('bed') && !id.includes('mattress') && !id.includes('sofa') && !id.includes('loveseat') && !id.includes('chair');
}

/**
 * Checks if a box positioned at (x, y, z) has physical support underneath.
 * Structurally valid if: Total Supporting Area Directly Underneath / (len * wid) >= 0.70 (70% base support).
 * The support can be provided by:
 * - The ground floor (y = 0 -> 100%).
 * - The Mom's Attic cab shelf (if y = atticFloorY).
 * - The top surface of a single furniture item.
 * - The coplanar top surfaces of two or more adjacent placed boxes (bridging seams).
 * Rejects placement only if more than 30% of the box footprint hangs over empty air.
 */
function hasPhysicalSupport(
  x: number,
  y: number,
  z: number,
  len: number,
  wid: number,
  supportsByY: Map<number, Occupied3D[]>,
  hasAttic: boolean,
  atticFloorY: number,
  atticL: number,
  atticStartZ: number,
  atticW: number
): boolean {
  if (y <= 0) return true; // Ground floor is 100% supported

  const boxArea = len * wid;
  if (boxArea <= 0) return false;

  let supportedArea = 0;

  // Check Mom's Attic shelf support
  if (hasAttic && y === atticFloorY) {
    const xOverlap = Math.max(0, Math.min(x + len, atticL) - Math.max(x, 0));
    const zOverlap = Math.max(0, Math.min(z + wid, atticStartZ + atticW) - Math.max(z, atticStartZ));
    supportedArea += xOverlap * zOverlap;
    if (supportedArea / boxArea >= 0.70) return true;
  }

  // Check support from items whose top surface is at y
  const list = supportsByY.get(Math.round(y));
  if (list) {
    const x2 = x + len;
    const z2 = z + wid;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      if (x2 <= s.x || x >= s.x + s.length) continue;
      if (z2 <= s.z || z >= s.z + s.width) continue;

      const overlapX = Math.min(x2, s.x + s.length) - Math.max(x, s.x);
      const overlapZ = Math.min(z2, s.z + s.width) - Math.max(z, s.z);
      if (overlapX > 0 && overlapZ > 0) {
        supportedArea += overlapX * overlapZ;
        if (supportedArea / boxArea >= 0.70) {
          return true; // Early exit once 70% threshold is met!
        }
      }
    }
  }

  return supportedArea / boxArea >= 0.70;
}

/**
 * PHASE 5: Multi-Zone Box Packing Pipeline with 3D Extreme Point Search
 * Sequence:
 * 1. Under-Table Cavities: Place into subFurnitureCavities first.
 * 2. Mom's Attic Shelf: If truck has Mom's Attic, place small boxes (light parcels) on cab shelf.
 * 3. Furniture Tops (stackableSurfaces): Fill vertical headroom above flat furniture up to ceiling.
 * 4. General Floor & Extreme Points: Fill all remaining pockets using dynamic Extreme Point candidates.
 */
export function packPhase5Boxes(
  truck: TruckSpec,
  boxQueue: ItemDefinition[],
  occupiedSpaces: Occupied3D[],
  stackableSurfaces: StackableSurface[],
  subFurnitureCavities: SubFurnitureCavity[],
  nextId: (prefix: string) => string,
  heuristic?: 'height' | 'footprint' | 'volume',
  initialFurnitureBlocks: DrawableBlock[] = []
): Phase5Result {
  const blocks: DrawableBlock[] = [];
  const unpackedItems: UnpackedItem[] = [];

  const truckLength = truck.length;
  const truckWidth = truck.width;
  const truckHeight = truck.height;

  const hasAttic = Boolean(truck.hasAttic && truck.attic);
  const atticL = hasAttic && truck.attic ? truck.attic.length : 0;
  const atticW = hasAttic && truck.attic ? truck.attic.width : 0;
  const atticH = hasAttic && truck.attic ? truck.attic.height : 0;
  const atticFloorY = hasAttic ? truckHeight - atticH : truckHeight;
  const atticStartZ = hasAttic ? Math.max(0, Math.floor((truckWidth - atticW) / 2)) : 0;

  const cavitiesMeta = subFurnitureCavities.map((cav) => ({
    cav,
    tableX: cav.x - 2,
    tableZ: cav.z - 2,
    tableMaxX: cav.x + cav.length + 2,
    tableMaxZ: cav.z + cav.width + 2,
    tableH: cav.height + 4,
  }));

  const supportsByY = new Map<number, Occupied3D[]>();
  function registerSupport(s: Occupied3D) {
    if (s.canStackOn === false) return;
    const topY = Math.round(s.y + s.height);
    let list = supportsByY.get(topY);
    if (!list) {
      list = [];
      supportsByY.set(topY, list);
    }
    list.push(s);
  }
  for (let i = 0; i < occupiedSpaces.length; i++) {
    registerSupport(occupiedSpaces[i]);
  }

  // =========================================================================
  // ZONE 1: Under-Table Cavities (subFurnitureCavities)
  // =========================================================================
  for (const cavity of subFurnitureCavities) {
    let placedInCavity = true;
    while (placedInCavity && boxQueue.length > 0) {
      placedInCavity = false;

      let targetIdx = -1;
      for (let q = 0; q < boxQueue.length; q++) {
        if (boxQueue[q].id === 'box_small' || boxQueue[q].id === 'box_medium') {
          targetIdx = q;
          break;
        }
      }
      if (targetIdx === -1) break;

      const box = boxQueue[targetIdx];
      const orientations = getBoxOrientations(box);

      for (const orient of orientations) {
        const { len, wid, hei } = orient;
        if (len > cavity.length || wid > cavity.width || hei > cavity.height) continue;

        for (let x = cavity.x; x + len <= cavity.x + cavity.length; x += len) {
          for (let y = cavity.y; y + hei <= cavity.y + cavity.height; y += hei) {
            for (let z = cavity.z; z + wid <= cavity.z + cavity.width; z += wid) {
              if (!check3DCollision(x, y, z, len, hei, wid, occupiedSpaces)) {
                const block: DrawableBlock = {
                  id: nextId(box.id),
                  itemId: box.id,
                  label: box.id === 'box_small' ? 'SMALL BOX' : 'MED BOX',
                  x,
                  y,
                  z,
                  length: len,
                  width: wid,
                  height: hei,
                  color: box.color,
                  category: 'boxes',
                  isAttic: false,
                  weightLbs: box.weightLbs,
                  volumeCuFt: box.volumeCuFt,
                  dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
                  cavityOwnerId: cavity.ownerBlockId,
                };

                blocks.push(block);
                const occ = { x, y, z, length: len, height: hei, width: wid, ownerBlockId: block.id, canStackOn: true };
                occupiedSpaces.push(occ);
                registerSupport(occ);
                boxQueue.splice(targetIdx, 1);
                placedInCavity = true;
                break;
              }
            }
            if (placedInCavity) break;
          }
          if (placedInCavity) break;
        }
        if (placedInCavity) break;
      }
    }
  }

  // =========================================================================
  // ZONE 2: Mom's Attic Shelf (Small and Medium Boxes)
  // =========================================================================
  if (hasAttic && truck.attic) {
    const stepL = 16;
    const stepW = 12;

    const hasFurnitureOnFloor = occupiedSpaces.some(
      (s) => s.y === 0 && s.ownerBlockId && !s.ownerBlockId.includes('box')
    );

    for (let ax = 0; ax + stepL <= atticL && boxQueue.length > 0; ax += stepL) {
      for (
        let az = atticStartZ;
        az + stepW <= atticStartZ + atticW && boxQueue.length > 0;
        az += stepW
      ) {
        let ay = atticFloorY;
        while (boxQueue.length > 0 && ay < truckHeight) {
          let placedBox = false;

          let targetIdx = -1;
          for (let q = 0; q < boxQueue.length; q++) {
            if (boxQueue[q].id === 'box_small') {
              targetIdx = q;
              break;
            }
          }
          if (targetIdx === -1 && hasFurnitureOnFloor) {
            for (let q = 0; q < boxQueue.length; q++) {
              if (boxQueue[q].id === 'box_medium') {
                targetIdx = q;
                break;
              }
            }
          }
          if (targetIdx === -1) break;

          const box = boxQueue[targetIdx];
          const orientations = getBoxOrientations(box);

          for (const orient of orientations) {
            const { len, wid, hei } = orient;
            if (ax + len > atticL) continue;
            if (az + wid > atticStartZ + atticW) continue;
            if (ay + hei > truckHeight) continue;

            if (!check3DCollision(ax, ay, az, len, hei, wid, occupiedSpaces)) {
              const block: DrawableBlock = {
                id: nextId(box.id),
                itemId: box.id,
                label: box.id === 'box_small' ? 'SMALL BOX' : 'MED BOX',
                x: ax,
                y: ay,
                z: az,
                length: len,
                width: wid,
                height: hei,
                color: box.color,
                category: 'boxes',
                isAttic: true,
                weightLbs: box.weightLbs,
                volumeCuFt: box.volumeCuFt,
                dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
              };

              blocks.push(block);
              const occ = { x: ax, y: ay, z: az, length: len, height: hei, width: wid, ownerBlockId: block.id, canStackOn: true };
              occupiedSpaces.push(occ);
              registerSupport(occ);
              ay += hei;
              boxQueue.splice(targetIdx, 1);
              placedBox = true;
              break;
            }
          }

          if (!placedBox) break;
        }
      }
    }
  }

  // =========================================================================
  // ZONE 3: Furniture Tops (stackableSurfaces)
  // =========================================================================
  for (const surf of stackableSurfaces) {
    const step = 6;

    for (let x = surf.x; x < surf.x + surf.length && boxQueue.length > 0; ) {
      let nextX = x + step;
      for (let z = surf.z; z < surf.z + surf.width && boxQueue.length > 0; ) {
        let currentY = surf.y;
        const maxCeilY =
          hasAttic && x < atticL && z < atticStartZ + atticW && z + step > atticStartZ
            ? atticFloorY
            : truckHeight;

        let addedToColumn = true;
        let colBoxLen = 0;
        let colBoxWid = 0;

        while (addedToColumn && boxQueue.length > 0 && currentY < maxCeilY) {
          addedToColumn = false;
          const clearance = maxCeilY - currentY;
          if (clearance < 10) break;

          const triedInStep = new Set<string>();
          for (let q = 0; q < boxQueue.length; q++) {
            const candidateBox = boxQueue[q];
            if (candidateBox.id === 'box_wardrobe' && clearance < 48) continue;
            if (triedInStep.has(candidateBox.id)) continue;
            triedInStep.add(candidateBox.id);

            const orientations = getBoxOrientations(candidateBox);

            let fitted = false;
            for (const orient of orientations) {
              const { len, wid, hei } = orient;
              if (hei > clearance) continue;
              if (x + len > truckLength || z + wid > truckWidth) continue;

              if (!hasPhysicalSupport(x, currentY, z, len, wid, supportsByY, hasAttic, atticFloorY, atticL, atticStartZ, atticW)) {
                continue;
              }

              if (!check3DCollision(x, currentY, z, len, hei, wid, occupiedSpaces)) {
                const block: DrawableBlock = {
                  id: nextId(candidateBox.id),
                  itemId: candidateBox.id,
                  label: candidateBox.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
                  x,
                  y: currentY,
                  z,
                  length: len,
                  width: wid,
                  height: hei,
                  color: candidateBox.color,
                  category: 'boxes',
                  isAttic: false,
                  weightLbs: candidateBox.weightLbs,
                  volumeCuFt: candidateBox.volumeCuFt,
                  dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
                  stackedOnId: surf.ownerBlockId,
                };

                blocks.push(block);
                const occ = { x, y: currentY, z, length: len, height: hei, width: wid, ownerBlockId: block.id, canStackOn: true };
                occupiedSpaces.push(occ);
                registerSupport(occ);
                currentY += hei;
                boxQueue.splice(q, 1);
                addedToColumn = true;
                fitted = true;
                if (!colBoxLen) {
                  colBoxLen = len;
                  colBoxWid = wid;
                }
                break;
              }
            }
            if (fitted) break;
          }
        }

        if (colBoxWid > 0) {
          z += colBoxWid;
          if (colBoxLen > 0 && x + colBoxLen > nextX) {
            nextX = x + colBoxLen;
          }
        } else {
          z += step;
        }
      }
      x = nextX;
    }
  }

  // =========================================================================
  // ZONE 4: Surface-Projected Candidate Anchors (Corner Point Heuristic)
  // Continuous Cab-to-Tailgate Packing without Dead Zones
  // =========================================================================
  const extremePoints: ExtremePoint[] = [];
  const seenEP = new Set<number>();

  function compareAnchors(a: ExtremePoint, b: ExtremePoint): number {
    if (a.x !== b.x) return a.x - b.x; // Primary: Cab bulkhead (X=0) to tailgate (X=length)
    if (a.y !== b.y) return a.y - b.y; // Secondary: Floor (Y=0) to ceiling
    return a.z - b.z;                 // Tertiary: Left wall (Z=0) to right wall
  }

  function isPointInsideOccupied(px: number, py: number, pz: number): boolean {
    for (let i = 0; i < occupiedSpaces.length; i++) {
      const o = occupiedSpaces[i];
      if (
        px > o.x && px < o.x + o.length &&
        py >= o.y && py < o.y + o.height &&
        pz > o.z && pz < o.z + o.width
      ) {
        return true;
      }
    }
    return false;
  }

  function addInitialPoint(x: number, y: number, z: number) {
    if (x < 0 || y < 0 || z < 0) return;
    if (x + 12 > truckLength || y + 12 > truckHeight || z + 12 > truckWidth) return;
    if (y > 0 && (!hasAttic || y !== atticFloorY) && !supportsByY.has(Math.round(y))) return;

    const key = (x * 1000000) + (y * 1000) + z;
    if (seenEP.has(key)) return;
    seenEP.add(key);

    if (isPointInsideOccupied(x, y, z)) return;

    extremePoints.push({ x, y, z });
  }

  function insertDynamicPoint(pt: ExtremePoint) {
    let low = 0;
    let high = extremePoints.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (compareAnchors(extremePoints[mid], pt) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    extremePoints.splice(low, 0, pt);
  }

  function addDynamicCandidatePoint(x: number, y: number, z: number) {
    if (x < 0 || y < 0 || z < 0) return;
    if (x + 12 > truckLength || y + 12 > truckHeight || z + 12 > truckWidth) return;
    if (y > 0 && (!hasAttic || y !== atticFloorY) && !supportsByY.has(Math.round(y))) return;

    const key = (x * 1000000) + (y * 1000) + z;
    if (seenEP.has(key)) return;
    seenEP.add(key);

    if (isPointInsideOccupied(x, y, z)) return;

    insertDynamicPoint({ x, y, z });
  }

  // 1. Extract Unique Coordinate Planes from All Placed Items
  const xCoords = new Set<number>([0]);
  const yCoords = new Set<number>([0]);
  const zCoords = new Set<number>([0]);

  if (hasAttic) {
    yCoords.add(atticFloorY);
    zCoords.add(atticStartZ);
  }

  for (let i = 0; i < occupiedSpaces.length; i++) {
    const item = occupiedSpaces[i];
    xCoords.add(item.x);
    xCoords.add(item.x + item.length);
    if (canItemSupportStacking(item)) {
      yCoords.add(item.y + item.height);
    }
    zCoords.add(item.z);
    zCoords.add(item.z + item.width);
  }

  // 2. Generate Initial Surface-Projected Candidate Anchors
  for (const x of xCoords) {
    for (const y of yCoords) {
      for (const z of zCoords) {
        addInitialPoint(x, y, z);
      }
    }
  }

  // Sort candidate anchors strictly: Xc ascending -> Yc ascending -> Zc ascending
  extremePoints.sort(compareAnchors);

  while (boxQueue.length > 0) {
    let placedAny = false;
    const triedBoxIds = new Set<string>();

    for (let q = 0; q < boxQueue.length; q++) {
      const candidateBox = boxQueue[q];
      if (triedBoxIds.has(candidateBox.id)) continue;
      triedBoxIds.add(candidateBox.id);

      const boxInfo = getBoxInfo(candidateBox);
      const orientations = boxInfo.orientations;
      let placedThisCandidate = false;

      for (let p = 0; p < extremePoints.length; p++) {
        const pt = extremePoints[p];

        if (
          pt.x + 12 > truckLength ||
          pt.y + 12 > truckHeight ||
          pt.z + 12 > truckWidth
        ) {
          extremePoints.splice(p, 1);
          p--;
          continue;
        }

        if (pt.y > 0 && (!hasAttic || pt.y !== atticFloorY) && !supportsByY.has(Math.round(pt.y))) {
          extremePoints.splice(p, 1);
          p--;
          continue;
        }

        if (
          pt.x + boxInfo.minL > truckLength ||
          pt.y + boxInfo.minH > truckHeight ||
          pt.z + boxInfo.minW > truckWidth
        ) {
          continue;
        }

        const orientations = boxInfo.orientations;
        for (const orient of orientations) {
          const { len, wid, hei } = orient;

          // Wardrobe boxes can only sit on the floor deck, in Mom's Attic, or on low sturdy bases (<= 24" high)
          if (candidateBox.id === 'box_wardrobe' && pt.y > 0) {
            const isAtticPos = hasAttic && pt.y >= atticFloorY && pt.x < atticL;
            const isLowSturdyBase = pt.y <= 24 && pt.y + hei <= truckHeight;
            if (!isAtticPos && !isLowSturdyBase) {
              continue;
            }
          }

          // Truck bounding check
          if (pt.x + len > truckLength) continue;
          if (pt.y + hei > truckHeight) continue;
          if (pt.z + wid > truckWidth) continue;

          // Attic collision check
          if (hasAttic) {
            const overlapsAtticX = pt.x < atticL;
            const overlapsAtticZ = intervalsOverlap(pt.z, pt.z + wid, atticStartZ, atticStartZ + atticW);
            if (overlapsAtticX && overlapsAtticZ) {
              if (pt.y < atticFloorY && pt.y + hei > atticFloorY) {
                continue; // Cannot poke through bottom of attic shelf
              }
            }
          }

          // Support check (ground floor y <= 0 is unconditionally supported)
          if (pt.y > 0 && !hasPhysicalSupport(pt.x, pt.y, pt.z, len, wid, supportsByY, hasAttic, atticFloorY, atticL, atticStartZ, atticW)) {
            continue;
          }

          // Cavity boundary check: If placing inside a table footprint, must be strictly inside cavity
          let insideCavityId: string | undefined;
          let collidesWithTableOuter = false;
          for (let cIdx = 0; cIdx < cavitiesMeta.length; cIdx++) {
            const m = cavitiesMeta[cIdx];
            if (
              pt.x < m.tableMaxX &&
              pt.x + len > m.tableX &&
              pt.z < m.tableMaxZ &&
              pt.z + wid > m.tableZ &&
              pt.y < m.tableH
            ) {
              const cav = m.cav;
              const strictlyInside =
                pt.x >= cav.x &&
                pt.x + len <= cav.x + cav.length &&
                pt.z >= cav.z &&
                pt.z + wid <= cav.z + cav.width &&
                pt.y >= cav.y &&
                pt.y + hei <= cav.y + cav.height;

              if (strictlyInside) {
                insideCavityId = cav.ownerBlockId;
              } else {
                collidesWithTableOuter = true;
                break;
              }
            }
          }
          if (collidesWithTableOuter) continue;

          // Exact 3D collision check
          if (!check3DCollision(pt.x, pt.y, pt.z, len, hei, wid, occupiedSpaces)) {
            const isAtticBox = hasAttic && pt.y >= atticFloorY && pt.x < atticL;
            const block: DrawableBlock = {
              id: nextId(candidateBox.id),
              itemId: candidateBox.id,
              label: candidateBox.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
              x: pt.x,
              y: pt.y,
              z: pt.z,
              length: len,
              width: wid,
              height: hei,
              color: candidateBox.color,
              category: 'boxes',
              isAttic: isAtticBox,
              weightLbs: candidateBox.weightLbs,
              volumeCuFt: candidateBox.volumeCuFt,
              dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
              cavityOwnerId: insideCavityId,
            };

            blocks.push(block);
            const occ: Occupied3D = {
              x: pt.x,
              y: pt.y,
              z: pt.z,
              length: len,
              height: hei,
              width: wid,
              ownerBlockId: block.id,
              canStackOn: true,
            };
            occupiedSpaces.push(occ);
            registerSupport(occ);

            boxQueue.splice(q, 1);
            placedAny = true;
            placedThisCandidate = true;

            // Remove consumed point
            extremePoints.splice(p, 1);

            // Generate new projected Extreme Points from the placed box
            addDynamicCandidatePoint(pt.x + len, pt.y, pt.z);
            addDynamicCandidatePoint(pt.x, pt.y + hei, pt.z);
            addDynamicCandidatePoint(pt.x, pt.y, pt.z + wid);
            addDynamicCandidatePoint(pt.x + len, pt.y + hei, pt.z);
            addDynamicCandidatePoint(pt.x + len, pt.y, pt.z + wid);
            addDynamicCandidatePoint(pt.x, pt.y + hei, pt.z + wid);
            addDynamicCandidatePoint(pt.x + len, pt.y + hei, pt.z + wid);
            break;
          }
        }
        if (placedThisCandidate) break;
      }

      if (placedThisCandidate) {
        break;
      }
    }

    if (!placedAny) {
      break;
    }
  }

  // =========================================================================
  // ZONE 5: Continuous Gap-Filler Sweep (Residual Void Backfill)
  // Consolidates voids via compaction if needed, and fills any remaining unplaced boxes
  // =========================================================================
  if (boxQueue.length > 0) {
    const truckBounds: Bounds = {
      length: truckLength,
      width: truckWidth,
      height: truckHeight,
      hasAttic,
      attic: truck.attic,
    };

    // Compact all placed items so far to eliminate dead air gaps
    const currentPlaced = [...initialFurnitureBlocks, ...blocks];
    const compacted = compactItems(currentPlaced, truckBounds);

    // Update coordinates of placed box blocks from compacted result
    const compMap = new Map<string, DrawableBlock>();
    for (let i = 0; i < compacted.length; i++) {
      compMap.set(compacted[i].id, compacted[i]);
    }
    for (let i = 0; i < blocks.length; i++) {
      const cb = compMap.get(blocks[i].id);
      if (cb) {
        blocks[i].x = cb.x;
        blocks[i].y = cb.y;
        blocks[i].z = cb.z;
      }
    }

    // Rebuild occupiedSpaces and supports from compacted items
    occupiedSpaces.length = 0;
    supportsByY.clear();
    for (let i = 0; i < compacted.length; i++) {
      const b = compacted[i];
      const occ: Occupied3D = {
        x: b.x,
        y: b.y,
        z: b.z,
        length: b.length,
        height: b.height,
        width: b.width,
        ownerBlockId: b.id,
        canStackOn: b.category === 'boxes' || b.itemId === 'tv_stand' || b.itemId === 'coffee_table' || b.itemId === 'dresser_6drawer' || b.itemId === 'nightstand' || b.itemId === 'desk',
      };
      occupiedSpaces.push(occ);
      registerSupport(occ);
    }

    // Step through available support heights (including floor 0)
    const candidateYs = Array.from(new Set([0, ...supportsByY.keys()]))
      .filter((y) => y + 12 <= truckHeight)
      .sort((a, b) => a - b);

    const xSet = new Set<number>([0]);
    const zSet = new Set<number>([0]);
    for (let i = 0; i < occupiedSpaces.length; i++) {
      const o = occupiedSpaces[i];
      xSet.add(o.x);
      xSet.add(o.x + o.length);
      zSet.add(o.z);
      zSet.add(o.z + o.width);
    }
    for (let x = 0; x + 12 <= truckLength; x += 6) xSet.add(x);
    for (let z = 0; z + 12 <= truckWidth; z += 6) zSet.add(z);

    const candidateXs = Array.from(xSet).filter((x) => x + 12 <= truckLength).sort((a, b) => a - b);
    const candidateZs = Array.from(zSet).filter((z) => z + 12 <= truckWidth).sort((a, b) => a - b);

    for (let q = 0; q < boxQueue.length; q++) {
      const candidateBox = boxQueue[q];
      const orientations = getBoxOrientations(candidateBox);
      let placedInGap = false;

      for (let xi = 0; xi < candidateXs.length && !placedInGap; xi++) {
        const x = candidateXs[xi];
        for (let yi = 0; yi < candidateYs.length && !placedInGap; yi++) {
          const y = candidateYs[yi];
          if (y + 12 > truckHeight) continue;
          for (let zi = 0; zi < candidateZs.length && !placedInGap; zi++) {
            const z = candidateZs[zi];

            for (let oi = 0; oi < orientations.length; oi++) {
              const orient = orientations[oi];
              const { len, wid, hei } = orient;
              // Wardrobe boxes can only sit on the floor deck or in Mom's Attic
              if (candidateBox.id === 'box_wardrobe' && y > 0 && (!hasAttic || y < atticFloorY || x >= atticL)) {
                continue;
              }

              if (x + len > truckLength || y + hei > truckHeight || z + wid > truckWidth) continue;

              if (hasAttic && x < atticL && intervalsOverlap(z, z + wid, atticStartZ, atticStartZ + atticW)) {
                if (y < atticFloorY && y + hei > atticFloorY) continue;
              }

              if (!hasPhysicalSupport(x, y, z, len, wid, supportsByY, hasAttic, atticFloorY, atticL, atticStartZ, atticW)) {
                continue;
              }

              if (!check3DCollision(x, y, z, len, hei, wid, occupiedSpaces)) {
                const isAtticBox = hasAttic && y >= atticFloorY && x < atticL;
                const block: DrawableBlock = {
                  id: nextId(candidateBox.id),
                  itemId: candidateBox.id,
                  label: candidateBox.id === 'box_wardrobe' ? 'WARDROBE' : 'BOX TIER',
                  x,
                  y,
                  z,
                  length: len,
                  width: wid,
                  height: hei,
                  color: candidateBox.color,
                  category: 'boxes',
                  isAttic: isAtticBox,
                  weightLbs: candidateBox.weightLbs,
                  volumeCuFt: candidateBox.volumeCuFt,
                  dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
                };

                blocks.push(block);
                const occ: Occupied3D = {
                  x,
                  y,
                  z,
                  length: len,
                  height: hei,
                  width: wid,
                  ownerBlockId: block.id,
                  canStackOn: true,
                };
                occupiedSpaces.push(occ);
                registerSupport(occ);

                boxQueue.splice(q, 1);
                q--;
                placedInGap = true;

                // Dynamically expose newly placed box surfaces to subsequent boxes in queue
                const newY = occ.y + occ.height;
                if (newY + 12 <= truckHeight && !candidateYs.includes(newY)) {
                  candidateYs.push(newY);
                  candidateYs.sort((a, b) => a - b);
                }
                const newX = occ.x + occ.length;
                if (newX + 12 <= truckLength && !candidateXs.includes(newX)) {
                  candidateXs.push(newX);
                  candidateXs.sort((a, b) => a - b);
                }
                const newZ = occ.z + occ.width;
                if (newZ + 12 <= truckWidth && !candidateZs.includes(newZ)) {
                  candidateZs.push(newZ);
                  candidateZs.sort((a, b) => a - b);
                }
                break;
              }
            }
          }
        }
      }
    }
  }

  // Any remaining boxes that could not fit anywhere
  while (boxQueue.length > 0) {
    const b = boxQueue.shift()!;
    unpackedItems.push({
      id: b.id,
      name: b.name,
      reason: 'Vehicle cargo volume full (no remaining physical space)',
    });
  }

  return { blocks, unpackedItems };
}

