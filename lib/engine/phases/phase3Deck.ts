import { TruckSpec } from '../../constants/trucks';
import { DrawableBlock, Occupied3D, UnpackedItem, FlatPackingItem, HeuristicPass } from '../types';
import { check3DCollision } from '../collision';

export interface Phase3Result {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
}

/**
 * PHASE 3 (Floor Deck): Heavy floor furniture (dressers, nightstands, tables, desks).
 * Sorted according to active heuristic pass ('height' | 'footprint' | 'volume').
 */
export function packPhase3Deck(
  truck: TruckSpec,
  flatItems: FlatPackingItem[],
  occupiedSpaces: Occupied3D[],
  heuristic: HeuristicPass,
  leftWallFrontWidth: number,
  maxLeftWallThickness: number,
  nextId: (prefix: string) => string
): Phase3Result {
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

  const phase3Items = flatItems
    .filter((item) => item.zone === 'floor' && !item.isBox)
    .map((it) => ({ ...it }));

  // Prioritize bulky base furniture (dressers, desks, tables) before smaller modular accent items
  phase3Items.sort((a, b) => {
    const areaA = a.dimensions.length * a.dimensions.width;
    const areaB = b.dimensions.length * b.dimensions.width;
    const aIsBase = a.id === 'dresser_6drawer' || a.id === 'desk' || areaA >= 800;
    const bIsBase = b.id === 'dresser_6drawer' || b.id === 'desk' || areaB >= 800;
    if (aIsBase !== bIsBase) return aIsBase ? -1 : 1;

    if (heuristic === 'height') {
      return (
        (b.canStackOnTop ? 1 : 0) - (a.canStackOnTop ? 1 : 0) ||
        b.dimensions.height - a.dimensions.height ||
        areaB - areaA ||
        b.volumeCuFt - a.volumeCuFt
      );
    } else if (heuristic === 'footprint') {
      return (
        areaB - areaA ||
        b.dimensions.height - a.dimensions.height ||
        b.volumeCuFt - a.volumeCuFt
      );
    } else {
      return b.volumeCuFt - a.volumeCuFt || areaB - areaA;
    }
  });

  function hasFurnitureSupport(
    cx: number,
    cy: number,
    cz: number,
    len: number,
    wid: number
  ): boolean {
    if (cy <= 0) return true; // Ground floor is 100% supported
    const itemArea = len * wid;
    if (itemArea <= 0) return false;

    let supportedArea = 0;
    for (let i = 0; i < occupiedSpaces.length; i++) {
      const s = occupiedSpaces[i];
      if (!s.canStackOn) continue;
      const topY = s.y + s.height;
      if (Math.abs(topY - cy) > 0.5) continue;

      const ox = Math.min(cx + len, s.x + s.length) - Math.max(cx, s.x);
      const oz = Math.min(cz + wid, s.z + s.width) - Math.max(cz, s.z);
      if (ox > 0 && oz > 0) {
        supportedArea += ox * oz;
        if (supportedArea / itemArea >= 0.70) return true;
      }
    }
    return supportedArea / itemArea >= 0.70;
  }

  for (const item of phase3Items) {
    for (let i = 0; i < item.count; i++) {
      const origLen = item.dimensions.length;
      const origWid = item.dimensions.width;
      const hei = Math.min(item.dimensions.height, truckHeight);

      const orientations = [
        { len: origLen, wid: origWid },
        ...(origLen !== origWid ? [{ len: origWid, wid: origLen }] : []),
      ];

      const canStack =
        item.id === 'nightstand' ||
        Boolean(item.canStackOnTop) ||
        (item.weightLbs <= 60 && item.dimensions.height <= 36);

      // Candidate Y planes: floor (0) plus tops of placed stackable furniture
      const stackTops = canStack
        ? occupiedSpaces
            .filter((s) => s.canStackOn && s.y + s.height + hei <= truckHeight)
            .map((s) => s.y + s.height)
        : [];
      const candidateYs = Array.from(new Set([0, ...stackTops])).sort((a, b) => a - b);

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
          ...occupiedSpaces.map((r) => r.x),
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
          ...occupiedSpaces.map((r) => r.z),
          ...occupiedSpaces.map((r) => r.z + r.width),
        ])
      )
        .filter((z) => z >= 0 && z < truckWidth)
        .sort((a, b) => a - b);

      const candidateZs = Array.from(new Set([...gridZs, ...flushZs]));

      let placed = false;

      // Pass 1: Direct vertical alignment on supporting items (column stacking)
      if (canStack) {
        for (const s of occupiedSpaces) {
          if (!s.canStackOn) continue;
          const sy = s.y + s.height;
          if (sy + hei > truckHeight) continue;

          for (const orient of orientations) {
            const { len, wid } = orient;
            const testPoints = [
              { x: s.x, z: s.z },
              ...(s.length >= len + 18 ? [{ x: s.x + len, z: s.z }] : []),
              ...(s.width >= wid + 18 ? [{ x: s.x, z: s.z + wid }] : []),
            ];

            for (const tp of testPoints) {
              if (tp.x + len > truckLength || tp.z + wid > truckWidth) continue;
              if (hasAttic && tp.x < atticL && tp.z + wid > atticStartZ && tp.z < atticStartZ + atticW) {
                if (sy + hei > atticFloorY) continue;
              }
              if (!hasFurnitureSupport(tp.x, sy, tp.z, len, wid)) continue;
              if (!check3DCollision(tp.x, sy, tp.z, len, hei, wid, occupiedSpaces)) {
                const block: DrawableBlock = {
                  id: nextId(item.id),
                  itemId: item.id,
                  label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                  x: tp.x,
                  y: sy,
                  z: tp.z,
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
                  x: tp.x,
                  y: sy,
                  z: tp.z,
                  length: len,
                  height: hei,
                  width: wid,
                  ownerBlockId: block.id,
                  canStackOn: canStack,
                });
                placed = true;
                break;
              }
            }
            if (placed) break;
          }
          if (placed) break;
        }
      }

      // Pass 2: Candidate coordinate snapping across candidate Y planes
      if (!placed) {
        for (const cy of candidateYs) {
          for (const orient of orientations) {
            const { len, wid } = orient;
            for (const cx of candidateXs) {
              if (cx + len > truckLength) continue;
              for (const cz of candidateZs) {
                if (cz + wid > truckWidth) continue;

                if (hasAttic && cx < atticL && cz + wid > atticStartZ && cz < atticStartZ + atticW) {
                  if (cy + hei > atticFloorY) continue;
                }

                if (cy > 0 && !hasFurnitureSupport(cx, cy, cz, len, wid)) continue;

                if (!check3DCollision(cx, cy, cz, len, hei, wid, occupiedSpaces)) {
                  const block: DrawableBlock = {
                    id: nextId(item.id),
                    itemId: item.id,
                    label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                    x: cx,
                    y: cy,
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
                  occupiedSpaces.push({
                    x: cx,
                    y: cy,
                    z: cz,
                    length: len,
                    height: hei,
                    width: wid,
                    ownerBlockId: block.id,
                    canStackOn: canStack,
                  });

                  placed = true;
                  break;
                }
              }
              if (placed) break;
            }
            if (placed) break;
          }
          if (placed) break;
        }
      }

      // Pass 3: Fallback scan at 3-inch resolution across candidate Ys
      if (!placed) {
        for (const cy of candidateYs) {
          for (const orient of orientations) {
            const { len, wid } = orient;
            for (let x = 0; x <= truckLength - len; x += 3) {
              for (let z = 0; z <= truckWidth - wid; z += 3) {
                if (hasAttic && x < atticL && z + wid > atticStartZ && z < atticStartZ + atticW) {
                  if (cy + hei > atticFloorY) continue;
                }

                if (cy > 0 && !hasFurnitureSupport(x, cy, z, len, wid)) continue;

                if (!check3DCollision(x, cy, z, len, hei, wid, occupiedSpaces)) {
                  const block: DrawableBlock = {
                    id: nextId(item.id),
                    itemId: item.id,
                    label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                    x,
                    y: cy,
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
                  occupiedSpaces.push({
                    x,
                    y: cy,
                    z,
                    length: len,
                    height: hei,
                    width: wid,
                    ownerBlockId: block.id,
                    canStackOn: canStack,
                  });

                  placed = true;
                  break;
                }
              }
              if (placed) break;
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
          reason: 'Vehicle cargo volume full (no remaining physical space)',
        });
      }
    }
  }

  return { blocks, unpackedItems };
}
