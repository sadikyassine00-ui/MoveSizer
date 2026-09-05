import { TruckSpec } from '../../constants/trucks';
import { ITEMS } from '../../constants/items';
import { DrawableBlock, Occupied3D, FlatPackingItem } from '../types';
import { check3DCollision } from '../collision';

export interface Phase4Result {
  blocks: DrawableBlock[];
  unassignedWardrobes: number;
}

/**
 * PHASE 4 (Mom's Attic): Route wardrobe boxes and fragile parcels into the elevated cab compartment.
 */
export function packPhase4Attic(
  truck: TruckSpec,
  flatItems: FlatPackingItem[],
  occupiedSpaces: Occupied3D[],
  nextId: (prefix: string) => string
): Phase4Result {
  const blocks: DrawableBlock[] = [];

  const truckHeight = truck.height;
  const hasAttic = Boolean(truck.hasAttic && truck.attic);
  const atticL = hasAttic && truck.attic ? truck.attic.length : 0;
  const atticW = hasAttic && truck.attic ? truck.attic.width : 0;
  const atticH = hasAttic && truck.attic ? truck.attic.height : 0;
  const atticFloorY = hasAttic ? truckHeight - atticH : truckHeight;
  const atticStartZ = hasAttic ? Math.max(0, Math.floor((truck.width - atticW) / 2)) : 0;

  const atticWardrobes = flatItems.filter((item) => item.id === 'box_wardrobe');
  const remainingWardrobeCount = atticWardrobes.reduce((acc, it) => acc + it.count, 0);
  let unassignedWardrobes = 0;

  if (hasAttic && truck.attic) {
    const wardrobeDef = ITEMS.box_wardrobe;
    const wLen = wardrobeDef?.dimensions.length ?? 24;
    const wWid = wardrobeDef?.dimensions.width ?? 24;
    const wHei = Math.min(wardrobeDef?.dimensions.height ?? 48, atticH);

    let placedCount = 0;

    for (let x = 0; x + wLen <= atticL && placedCount < remainingWardrobeCount; x += 12) {
      for (
        let z = atticStartZ;
        z + wWid <= atticStartZ + atticW && placedCount < remainingWardrobeCount;
        z += 12
      ) {
        if (!check3DCollision(x, atticFloorY, z, wLen, wHei, wWid, occupiedSpaces)) {
          const block: DrawableBlock = {
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
          };

          blocks.push(block);
          occupiedSpaces.push({
            x,
            y: atticFloorY,
            z,
            length: wLen,
            height: wHei,
            width: wWid,
            ownerBlockId: block.id,
          });

          placedCount++;
        }
      }
    }

    unassignedWardrobes = remainingWardrobeCount - placedCount;
  } else {
    unassignedWardrobes = remainingWardrobeCount;
  }

  return { blocks, unassignedWardrobes };
}
