import { Occupied3D, DrawableBlock } from './types';
import { ItemDefinition } from '../constants/items';

/**
 * Checks if two 1D open intervals (min1, max1) and (min2, max2) overlap.
 * Touching boundaries do NOT overlap.
 */
export function intervalsOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return min1 < max2 && max1 > min2;
}

/**
 * Strict 3D AABB collision check.
 * Touching faces do NOT intersect, allowing zero-gap flush packing.
 */
export function check3DCollision(
  x: number,
  y: number,
  z: number,
  length: number,
  height: number,
  width: number,
  occupied: Occupied3D[]
): boolean {
  const x2 = x + length;
  const y2 = y + height;
  const z2 = z + width;
  for (let i = occupied.length - 1; i >= 0; i--) {
    const box = occupied[i];
    if (x2 <= box.x || x >= box.x + box.length) continue;
    if (z2 <= box.z || z >= box.z + box.width) continue;
    if (y2 <= box.y || y >= box.y + box.height) continue;
    return true;
  }
  return false;
}

/**
 * Checks whether two DrawableBlocks collide in 3D AABB space.
 */
export function checkBlockOverlap(a: DrawableBlock, b: DrawableBlock): boolean {
  const overlapX = a.x < b.x + b.length && a.x + a.length > b.x;
  const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
  const overlapZ = a.z < b.z + b.width && a.z + a.width > b.z;
  return overlapX && overlapY && overlapZ;
}

/**
 * Detect four-legged items (dining table, tall desk) whose clearance underneath
 * should be registered as a subFurnitureCavity rather than solid matter.
 */
export function isFourLeggedTableOrDesk(item: {
  id: string;
  name: string;
  dimensions?: { length: number; width: number; height: number };
  length?: number;
  width?: number;
  height?: number;
}): boolean {
  const id = item.id.toLowerCase();
  const name = item.name.toLowerCase();

  // Exclude chairs, coffee tables, and narrow edge slabs
  if (id.includes('chair') || name.includes('chair')) return false;
  if (id.includes('coffee') || name.includes('coffee')) return false;

  const len = item.dimensions ? item.dimensions.length : item.length ?? 0;
  const wid = item.dimensions ? item.dimensions.width : item.width ?? 0;
  const hei = item.dimensions ? item.dimensions.height : item.height ?? 0;

  // Must have substantial floor footprint and clearance to be a four-legged table/desk
  if (wid < 18 || len < 24 || hei < 24) return false;

  return (
    id === 'desk' ||
    id.includes('desk') ||
    id === 'dining_table' ||
    id.includes('table') ||
    name.includes('desk') ||
    name.includes('table')
  );
}

/**
 * Helper to check if a block is physically nested within a four-legged table/desk cavity.
 */
export function isInsideCavity(table: DrawableBlock, item: DrawableBlock): boolean {
  if (item.cavityOwnerId && item.cavityOwnerId === table.id) {
    return true;
  }
  const isTable =
    table.itemId === 'desk' ||
    table.itemId === 'dining_table' ||
    table.label.includes('DESK') ||
    table.label.includes('TABLE');
  if (!isTable || table.itemId === 'coffee_table' || table.label.includes('COFFEE')) {
    return false;
  }
  if (table.height < 24) return false;
  return (
    item.x >= table.x + 1.9 &&
    item.x + item.length <= table.x + table.length - 1.9 &&
    item.z >= table.z + 1.9 &&
    item.z + item.width <= table.z + table.width - 1.9 &&
    item.y >= 0 &&
    item.y + item.height <= table.height - 3.9
  );
}
