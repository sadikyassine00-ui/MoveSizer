import { TruckSpec } from '../../constants/trucks';
import { DrawableBlock, Occupied3D, UnpackedItem, FlatPackingItem } from '../types';
import { check3DCollision } from '../collision';

export interface Phase2Result {
  blocks: DrawableBlock[];
  unpackedItems: UnpackedItem[];
}

/**
 * PHASE 2 (Bulkhead / Upright Sofas): Stand vertically on end along X = 0.
 * Placed within available width between left and right wall rail layers.
 */
export function packPhase2Bulkhead(
  truck: TruckSpec,
  flatItems: FlatPackingItem[],
  occupiedSpaces: Occupied3D[],
  leftWallFrontWidth: number,
  rightWallFrontWidth: number,
  nextId: (prefix: string) => string
): Phase2Result {
  const blocks: DrawableBlock[] = [];
  const unpackedItems: UnpackedItem[] = [];

  const truckLength = truck.length;
  const truckHeight = truck.height;

  const phase2Items = flatItems.filter(
    (item) => item.zone === 'bulkhead' && !item.isBox
  );

  let bulkheadCursorZ = leftWallFrontWidth;

  for (const item of phase2Items) {
    for (let i = 0; i < item.count; i++) {
      const len = item.dimensions.length;
      const wid = item.dimensions.width;
      const hei = Math.min(item.dimensions.height, truckHeight);
      const targetX = 0;

      if (
        bulkheadCursorZ + wid <= rightWallFrontWidth &&
        targetX + len <= truckLength &&
        !check3DCollision(targetX, 0, bulkheadCursorZ, len, hei, wid, occupiedSpaces)
      ) {
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
          ownerBlockId: block.id,
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

  return { blocks, unpackedItems };
}
