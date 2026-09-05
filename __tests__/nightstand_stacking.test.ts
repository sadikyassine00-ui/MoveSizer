import { describe, it, expect } from 'vitest';
import { packTruck } from '../lib/engine/index';
import { TRUCKS } from '../lib/constants/trucks';
import { calculateCapacity } from '../lib/engine/capacityEngine';

describe('High Quantity Furniture Stacking & Bounds Validation', () => {
  it('packs high quantities of nightstands into vertical tiers without dropping items', () => {
    const inv: Record<string, number> = {
      queen_bed: 1,
      nightstand: 21,
      loveseat: 1,
      coffee_table: 1,
      tv_stand: 1,
      box_small: 3,
      box_medium: 5,
      box_large: 2,
    };

    const truck = TRUCKS['10ft'];
    const res = packTruck(truck, inv);

    // All 21 nightstands must be placed
    const placedNightstands = res.blocks.filter((b) => b.itemId === 'nightstand');
    expect(placedNightstands.length).toBe(21);

    // Verify all nightstands are strictly within truck 3D bounds
    for (const b of placedNightstands) {
      expect(b.x + b.length).toBeLessThanOrEqual(truck.length);
      expect(b.y + b.height).toBeLessThanOrEqual(truck.height);
      expect(b.z + b.width).toBeLessThanOrEqual(truck.width);
      expect(b.y).toBeGreaterThanOrEqual(0);
    }

    // Verify some nightstands are stacked vertically (y > 0)
    const stackedNightstands = placedNightstands.filter((b) => b.y > 0);
    expect(stackedNightstands.length).toBeGreaterThanOrEqual(10);

    // Zero 3D collisions across all blocks
    for (let i = 0; i < res.blocks.length; i++) {
      for (let j = i + 1; j < res.blocks.length; j++) {
        const a = res.blocks[i];
        const b = res.blocks[j];
        const overlapX = a.x < b.x + b.length && a.x + a.length > b.x;
        const overlapY = a.y < b.y + b.height && a.y + a.height > b.y;
        const overlapZ = a.z < b.z + b.width && a.z + a.width > b.z;
        const collision = overlapX && overlapY && overlapZ;
        expect(collision).toBe(false);
      }
    }
  });

  it('marks capacity status as critical when fill percentage exceeds 85%', () => {
    const inv: Record<string, number> = {
      queen_bed: 1,
      nightstand: 21,
      loveseat: 1,
      coffee_table: 1,
      tv_stand: 1,
      box_small: 3,
      box_medium: 5,
      box_large: 2,
      box_wardrobe: 2,
    };
    const cap = calculateCapacity(TRUCKS['10ft'], inv);
    expect(cap.fillPercentage).toBeGreaterThan(85);
    expect(cap.status).toBe('critical');
  });
});
