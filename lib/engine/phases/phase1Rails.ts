import { TruckSpec } from '../../constants/trucks';
import { DrawableBlock, Occupied3D, UnpackedItem, FlatPackingItem, RailLayer } from '../types';
import { check3DCollision } from '../collision';

export interface Phase1Result {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
  leftWallFrontWidth: number;
  rightWallFrontWidth: number;
  maxLeftWallThickness: number;
}

/**
 * PHASE 1 (Side-Wall Rails): Stand mattresses, box springs, and tabletops on edge.
 * 1. Primary: End-to-end along Left Wall (Z = 0)
 * 2. Secondary: Parallel sandwiching along Z-axis (Z <= MAX_RAIL_DEPTH)
 * 3. Tertiary: Right-Wall Mirroring Fallback (Z = truck.width - item.thickness)
 */
export function packPhase1Rails(
  truck: TruckSpec,
  flatItems: FlatPackingItem[],
  occupiedSpaces: Occupied3D[],
  nextId: (prefix: string) => string
): Phase1Result {
  const blocks: DrawableBlock[] = [];
  const unpackedItems: UnpackedItem[] = [];

  const truckLength = truck.length;
  const truckWidth = truck.width;
  const truckHeight = truck.height;

  const phase1Items = flatItems.filter(
    (item) => item.zone === 'wall_left' && !item.isBox
  );

  const MAX_RAIL_DEPTH = Math.min(truckWidth * 0.35, 30);

  const leftRailLayers: RailLayer[] = [{ z: 0, thickness: 0, cursorX: 0 }];
  const rightRailLayers: RailLayer[] = [];

  for (const item of phase1Items) {
    for (let i = 0; i < item.count; i++) {
      const len = item.dimensions.length;
      const wid = item.dimensions.width;
      const hei = Math.min(item.dimensions.height, truckHeight);

      let placed = false;

      // 1. PRIMARY: End-to-End along Left Wall Rail
      for (const layer of leftRailLayers) {
        if (layer.cursorX + len <= truckLength) {
          const targetX = layer.cursorX;
          const targetY = 0;
          const targetZ = layer.z;

          if (!check3DCollision(targetX, targetY, targetZ, len, hei, wid, occupiedSpaces)) {
            blocks.push({
              id: nextId(item.id),
              itemId: item.id,
              label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
              x: targetX,
              y: targetY,
              z: targetZ,
              length: len,
              width: wid,
              height: hei,
              color: item.color,
              category: item.category,
              isAttic: false,
              weightLbs: item.weightLbs,
              volumeCuFt: item.volumeCuFt,
              dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
            });

            occupiedSpaces.push({
              x: targetX,
              y: targetY,
              z: targetZ,
              length: len,
              height: hei,
              width: wid,
            });

            layer.cursorX += len;
            layer.thickness = Math.max(layer.thickness, wid);
            placed = true;
            break;
          }
        }
      }

      // 2. SECONDARY: Parallel Sandwiching along Z-Axis (Left Rail)
      if (!placed) {
        const currentLeftRailOuterZ = leftRailLayers.reduce(
          (max, l) => Math.max(max, l.z + l.thickness),
          0
        );

        if (currentLeftRailOuterZ + wid <= MAX_RAIL_DEPTH && len <= truckLength) {
          const targetX = 0;
          const targetY = 0;
          const targetZ = currentLeftRailOuterZ;

          if (!check3DCollision(targetX, targetY, targetZ, len, hei, wid, occupiedSpaces)) {
            blocks.push({
              id: nextId(item.id),
              itemId: item.id,
              label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
              x: targetX,
              y: targetY,
              z: targetZ,
              length: len,
              width: wid,
              height: hei,
              color: item.color,
              category: item.category,
              isAttic: false,
              weightLbs: item.weightLbs,
              volumeCuFt: item.volumeCuFt,
              dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
            });

            occupiedSpaces.push({
              x: targetX,
              y: targetY,
              z: targetZ,
              length: len,
              height: hei,
              width: wid,
            });

            leftRailLayers.push({
              z: targetZ,
              thickness: wid,
              cursorX: len,
            });

            placed = true;
          }
        }
      }

      // 3. TERTIARY: Right-Wall Mirroring Fallback
      if (!placed) {
        for (const layer of rightRailLayers) {
          if (layer.cursorX + len <= truckLength) {
            const targetX = layer.cursorX;
            const targetY = 0;
            const targetZ = layer.z;

            if (!check3DCollision(targetX, targetY, targetZ, len, hei, wid, occupiedSpaces)) {
              blocks.push({
                id: nextId(item.id),
                itemId: item.id,
                label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                x: targetX,
                y: targetY,
                z: targetZ,
                length: len,
                width: wid,
                height: hei,
                color: item.color,
                category: item.category,
                isAttic: false,
                weightLbs: item.weightLbs,
                volumeCuFt: item.volumeCuFt,
                dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
              });

              occupiedSpaces.push({
                x: targetX,
                y: targetY,
                z: targetZ,
                length: len,
                height: hei,
                width: wid,
              });

              layer.cursorX += len;
              layer.thickness = Math.max(layer.thickness, wid);
              placed = true;
              break;
            }
          }
        }

        if (!placed) {
          const currentRightRailInnerZ = rightRailLayers.reduce(
            (min, l) => Math.min(min, l.z),
            truckWidth
          );

          if (truckWidth - (currentRightRailInnerZ - wid) <= MAX_RAIL_DEPTH && len <= truckLength) {
            const targetX = 0;
            const targetY = 0;
            const targetZ = truckWidth - wid;

            if (!check3DCollision(targetX, targetY, targetZ, len, hei, wid, occupiedSpaces)) {
              blocks.push({
                id: nextId(item.id),
                itemId: item.id,
                label: item.name.toUpperCase().replace(/\s*\(.*\)/, ''),
                x: targetX,
                y: targetY,
                z: targetZ,
                length: len,
                width: wid,
                height: hei,
                color: item.color,
                category: item.category,
                isAttic: false,
                weightLbs: item.weightLbs,
                volumeCuFt: item.volumeCuFt,
                dimensionsText: `${len}″L × ${wid}″W × ${hei}″H`,
              });

              occupiedSpaces.push({
                x: targetX,
                y: targetY,
                z: targetZ,
                length: len,
                height: hei,
                width: wid,
              });

              rightRailLayers.push({
                z: targetZ,
                thickness: wid,
                cursorX: len,
              });

              placed = true;
            }
          }
        }
      }

      if (!placed) {
        unpackedItems.push({
          id: item.id,
          name: item.name,
          reason: 'Insufficient side-rail length and depth',
        });
      }
    }
  }

  // Determine Z boundaries reserved near front bulkhead (X < 40)
  const leftWallFrontWidth = occupiedSpaces
    .filter((box) => box.y === 0 && box.x < 40 && box.z < truckWidth / 2)
    .reduce((max, box) => Math.max(max, box.z + box.width), 0);

  const rightWallFrontWidth = occupiedSpaces
    .filter((box) => box.y === 0 && box.x < 40 && box.z >= truckWidth / 2)
    .reduce((min, box) => Math.min(min, box.z), truckWidth);

  const maxLeftWallThickness = occupiedSpaces
    .filter((box) => box.z < truckWidth / 2)
    .reduce((max, box) => Math.max(max, box.z + box.width), 0);

  return {
    blocks,
    unpackedItems,
    leftWallFrontWidth,
    rightWallFrontWidth,
    maxLeftWallThickness,
  };
}
