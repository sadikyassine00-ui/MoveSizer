import { PlacedItem, Bounds } from './types';
import { intervalsOverlap } from './collision';

interface RelativeAttachment {
  parentId: string;
  dx: number;
  dz: number;
  dy: number;
  isCavityChild?: boolean;
}

/**
 * Fast Analytic Axis-Projection Compaction.
 * Executes exact 1D interval projection along -X, -Z, and -Y without
 * iterative raymarching or incremental physics.
 */
export function compactItems(
  items: PlacedItem[],
  truckBounds: Bounds
): PlacedItem[] {
  if (items.length === 0) return [];

  const compacted = items.map((it) => ({ ...it }));

  const hasAttic = Boolean(truckBounds.hasAttic && truckBounds.attic);
  const atticL = hasAttic && truckBounds.attic ? truckBounds.attic.length : 0;
  const atticW = hasAttic && truckBounds.attic ? truckBounds.attic.width : 0;
  const atticH = hasAttic && truckBounds.attic ? truckBounds.attic.height : 0;
  const atticFloorY = hasAttic ? truckBounds.height - atticH : truckBounds.height;
  const atticStartZ = hasAttic ? Math.max(0, Math.floor((truckBounds.width - atticW) / 2)) : 0;

  // Track parent-child support attachments so stacked boxes move WITH their supporting furniture
  const attachmentMap = new Map<string, RelativeAttachment>();

  for (let c = 0; c < items.length; c++) {
    const child = items[c];
    if (child.y === 0 && !child.cavityOwnerId) continue;

    for (let p = 0; p < items.length; p++) {
      const parent = items[p];
      if (parent.id === child.id) continue;

      // Check stacked surface attachment (sitting on top)
      const topY = parent.y + parent.height;
      if (child.y > 0 && Math.abs(topY - child.y) < 0.1) {
        if (
          child.x < parent.x + parent.length &&
          child.x + child.length > parent.x &&
          child.z < parent.z + parent.width &&
          child.z + child.width > parent.z
        ) {
          attachmentMap.set(child.id, {
            parentId: parent.id,
            dx: child.x - parent.x,
            dz: child.z - parent.z,
            dy: parent.height,
            isCavityChild: false,
          });
          break;
        }
      }

      // Check cavity nesting attachment (under tabletop inside 4 legs)
      if (
        child.cavityOwnerId === parent.id ||
        (
          child.category === 'boxes' &&
          child.x >= parent.x + 1 &&
          child.x + child.length <= parent.x + parent.length - 1 &&
          child.z >= parent.z + 1 &&
          child.z + child.width <= parent.z + parent.width - 1 &&
          child.y + child.height <= parent.height - 3
        )
      ) {
        attachmentMap.set(child.id, {
          parentId: parent.id,
          dx: child.x - parent.x,
          dz: child.z - parent.z,
          dy: child.y - parent.y,
          isCavityChild: true,
        });
        break;
      }
    }
  }

  const idMap = new Map<string, PlacedItem>();
  for (let i = 0; i < compacted.length; i++) {
    idMap.set(compacted[i].id, compacted[i]);
  }

  const childrenMap = new Map<string, string[]>();
  for (const [childId, attach] of attachmentMap.entries()) {
    const list = childrenMap.get(attach.parentId) || [];
    list.push(childId);
    childrenMap.set(attach.parentId, list);
  }

  function getDescendants(rootId: string): Array<{ item: PlacedItem; dx: number; dz: number }> {
    const result: Array<{ item: PlacedItem; dx: number; dz: number }> = [];
    function traverse(currentId: string, currentDx: number, currentDz: number) {
      const children = childrenMap.get(currentId) || [];
      for (const childId of children) {
        const attach = attachmentMap.get(childId);
        const childItem = idMap.get(childId);
        if (attach && childItem) {
          const totalDx = currentDx + attach.dx;
          const totalDz = currentDz + attach.dz;
          result.push({ item: childItem, dx: totalDx, dz: totalDz });
          traverse(childId, totalDx, totalDz);
        }
      }
    }
    traverse(rootId, 0, 0);
    return result;
  }

  // 1. COMPRESS ALONG -X (Push to Cab)
  compacted.sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.z !== b.z) return a.z - b.z;
    return a.y - b.y;
  });

  for (let i = 0; i < compacted.length; i++) {
    const item = compacted[i];
    if (item.x === 0) continue; // Already flush at front bulkhead
    if (attachmentMap.has(item.id)) continue; // Children move synchronously with their root parent

    let minAllowedX = 0;
    if (item.isAttic) {
      minAllowedX = 0;
    } else if (hasAttic && item.x >= atticL) {
      const overlapsAtticZ = intervalsOverlap(item.z, item.z + item.width, atticStartZ, atticStartZ + atticW);
      if (overlapsAtticZ && item.y + item.height > atticFloorY) {
        minAllowedX = atticL;
      }
    }

    let maxX = minAllowedX;
    const hasKids = childrenMap.has(item.id);

    if (!hasKids) {
      for (let j = 0; j < compacted.length; j++) {
        const obstacle = compacted[j];
        if (obstacle.id === item.id) continue;
        if (obstacle.isAttic !== item.isAttic) continue;

        const endX = obstacle.x + obstacle.length;
        if (endX <= maxX || endX > item.x) continue;

        if (
          item.y < obstacle.y + obstacle.height &&
          item.y + item.height > obstacle.y &&
          item.z < obstacle.z + obstacle.width &&
          item.z + item.width > obstacle.z
        ) {
          if (endX > maxX) {
            maxX = endX;
          }
        }
      }
      item.x = maxX;
    } else {
      const family = [{ item, dx: 0, dz: 0 }, ...getDescendants(item.id)];
      const familyIds = new Set(family.map((f) => f.item.id));

      for (const member of family) {
        for (let j = 0; j < compacted.length; j++) {
          const obstacle = compacted[j];
          if (familyIds.has(obstacle.id)) continue;
          if (obstacle.isAttic !== member.item.isAttic) continue;

          const endX = obstacle.x + obstacle.length;
          if (endX <= maxX + member.dx || endX > member.item.x) continue;

          if (
            member.item.y < obstacle.y + obstacle.height &&
            member.item.y + member.item.height > obstacle.y &&
            member.item.z < obstacle.z + obstacle.width &&
            member.item.z + member.item.width > obstacle.z
          ) {
            const requiredRootX = endX - member.dx;
            if (requiredRootX > maxX) {
              maxX = requiredRootX;
            }
          }
        }
      }

      item.x = maxX;
      for (const desc of family) {
        desc.item.x = maxX + desc.dx;
      }
    }
  }

  // 2. COMPRESS ALONG -Z (Push to Left Rail)
  compacted.sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  const MAX_RAIL_DEPTH = Math.min(truckBounds.width * 0.35, 30);

  for (let i = 0; i < compacted.length; i++) {
    const item = compacted[i];
    if (item.z === 0) continue; // Already flush at left wall rail
    if (attachmentMap.has(item.id)) continue; // Children move synchronously with their root parent

    const isRightWallItem =
      item.category === 'bedroom' && item.z >= truckBounds.width - MAX_RAIL_DEPTH;
    if (isRightWallItem) {
      continue;
    }

    const minAllowedZ = item.isAttic ? atticStartZ : 0;
    let maxZ = minAllowedZ;
    const hasKids = childrenMap.has(item.id);

    if (!hasKids) {
      for (let j = 0; j < compacted.length; j++) {
        const obstacle = compacted[j];
        if (obstacle.id === item.id) continue;
        if (obstacle.isAttic !== item.isAttic) continue;

        const endZ = obstacle.z + obstacle.width;
        if (endZ <= maxZ || endZ > item.z) continue;

        if (
          item.x < obstacle.x + obstacle.length &&
          item.x + item.length > obstacle.x &&
          item.y < obstacle.y + obstacle.height &&
          item.y + item.height > obstacle.y
        ) {
          if (endZ > maxZ) {
            maxZ = endZ;
          }
        }
      }
      item.z = maxZ;
    } else {
      const family = [{ item, dx: 0, dz: 0 }, ...getDescendants(item.id)];
      const familyIds = new Set(family.map((f) => f.item.id));

      for (const member of family) {
        for (let j = 0; j < compacted.length; j++) {
          const obstacle = compacted[j];
          if (familyIds.has(obstacle.id)) continue;
          if (obstacle.isAttic !== member.item.isAttic) continue;

          const endZ = obstacle.z + obstacle.width;
          if (endZ <= maxZ + member.dz || endZ > member.item.z) continue;

          if (
            member.item.x < obstacle.x + obstacle.length &&
            member.item.x + member.item.length > obstacle.x &&
            member.item.y < obstacle.y + obstacle.height &&
            member.item.y + member.item.height > obstacle.y
          ) {
            const requiredRootZ = endZ - member.dz;
            if (requiredRootZ > maxZ) {
              maxZ = requiredRootZ;
            }
          }
        }
      }

      item.z = maxZ;
      for (const desc of family) {
        desc.item.z = maxZ + desc.dz;
      }
    }
  }

  // 3. SETTLE ALONG -Y (Gravity Drop)
  compacted.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.z - b.z;
  });

  for (let i = 0; i < compacted.length; i++) {
    const item = compacted[i];
    if (item.y <= 0 && !item.isAttic) continue; // Already flat on floor deck

    const attach = attachmentMap.get(item.id);
    if (attach) {
      const parent = idMap.get(attach.parentId);
      if (parent) {
        item.y = parent.y + attach.dy;
        continue;
      }
    }

    const baseY = item.isAttic ? atticFloorY : 0;
    let maxY = baseY;

    for (let j = 0; j < i; j++) {
      const support = compacted[j];
      if (support.isAttic !== item.isAttic) continue;

      const endY = support.y + support.height;
      if (endY <= maxY || endY > item.y) continue;

      if (
        item.x < support.x + support.length &&
        item.x + item.length > support.x &&
        item.z < support.z + support.width &&
        item.z + item.width > support.z
      ) {
        maxY = endY;
      }
    }

    item.y = maxY;
  }

  return compacted;
}
