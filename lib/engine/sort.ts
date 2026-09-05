import { DrawableBlock, ScreenBox } from './types';

/**
 * Standard canonical 30° isometric projection for screen AABB computation.
 */
export function defaultProject(x: number, y: number, z: number): { x: number; y: number } {
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

  for (let xi = 0; xi < 2; xi++) {
    const x = xs[xi];
    for (let yi = 0; yi < 2; yi++) {
      const y = ys[yi];
      for (let zi = 0; zi < 2; zi++) {
        const z = zs[zi];
        const p = projectFn(x, y, z);
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
  }

  const depth = (b.x + b.length) + (b.z + b.width) + (b.y + b.height);
  return { minX, maxX, minY, maxY, depth };
}

export function doScreenBoxesOverlap(a: ScreenBox, b: ScreenBox, margin = 2.0): boolean {
  return (
    a.minX < b.maxX - margin &&
    a.maxX > b.minX + margin &&
    a.minY < b.maxY - margin &&
    a.maxY > b.minY + margin
  );
}

/**
 * Pairwise 3D Occlusion Test:
 * Evaluates whether block A is strictly behind block B in 3D world coordinates
 * relative to the 30° isometric camera viewing vector (1, 1, 1).
 */
export function isBlockBehind(a: DrawableBlock, b: DrawableBlock): boolean {
  // If A is directly underneath B in the same horizontal column (A supports B), A must be painted before B
  const xOverlap = Math.max(a.x, b.x) < Math.min(a.x + a.length, b.x + b.length);
  const zOverlap = Math.max(a.z, b.z) < Math.min(a.z + a.width, b.z + b.width);
  if (xOverlap && zOverlap) {
    if (a.y + a.height <= b.y) return true;
    if (b.y + b.height <= a.y) return false;
  }

  const aBehindB_X = a.x + a.length <= b.x;
  const aBehindB_Z = a.z + a.width <= b.z;
  const aBehindB_Y = a.y + a.height <= b.y;

  const bBehindA_X = b.x + b.length <= a.x;
  const bBehindA_Z = b.z + b.width <= a.z;
  const bBehindA_Y = b.y + b.height <= a.y;

  const aIsBehind = aBehindB_X || aBehindB_Z || aBehindB_Y;
  const bIsBehind = bBehindA_X || bBehindA_Z || bBehindA_Y;

  if (aIsBehind && !bIsBehind) {
    return true;
  }
  if (!aIsBehind && bIsBehind) {
    return false;
  }

  return false;
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
      }
    }
  }

  const available: number[] = [];
  for (let i = 0; i < n; i++) {
    if (inDegree[i] === 0) {
      available.push(i);
    }
  }

  available.sort((a, b) => depthKeys[a] - depthKeys[b]);

  const sorted: DrawableBlock[] = [];
  const visited = new Set<number>();

  while (sorted.length < n) {
    if (available.length === 0) {
      let bestCandidate = -1;
      let minDepth = Infinity;
      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          if (depthKeys[i] < minDepth) {
            minDepth = depthKeys[i];
            bestCandidate = i;
          }
        }
      }
      if (bestCandidate === -1) break;
      available.push(bestCandidate);
    }

    const u = available.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);
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
