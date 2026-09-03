import { describe, it, expect } from 'vitest';
import { calculateBoxRequirements } from '../lib/engine/boxCalculator';
import { calculateCapacity } from '../lib/engine/capacityEngine';
import { packTruck } from '../lib/engine/packEngine';
import { TRUCKS } from '../lib/constants/trucks';
import { PRESETS } from '../lib/constants/presets';

describe('Calculation and Packing Engines', () => {
  describe('Task 3: boxCalculator.ts', () => {
    it('asserts a 2-bedroom, 2-occupant home with standard density returns exactly 60 total boxes (18 Small, 27 Medium, 9 Large, 4 Wardrobe)', () => {
      const result = calculateBoxRequirements({
        bedrooms: 2,
        occupants: 2,
        density: 'standard',
      });

      expect(result.totalBoxes).toBe(60);
      expect(result.counts.small).toBe(18);
      expect(result.counts.medium).toBe(27);
      expect(result.counts.large).toBe(9);
      expect(result.counts.wardrobe).toBe(4);

      // Direct property access aliases
      expect(result.small).toBe(18);
      expect(result.medium).toBe(27);
      expect(result.large).toBe(9);
      expect(result.wardrobe).toBe(4);
    });

    it('asserts packrat density (1.35x) scales totals up proportionally without fractional box counts', () => {
      const result = calculateBoxRequirements({
        bedrooms: 2,
        occupants: 2,
        density: 'packrat',
      });

      // ((2 * 20) + (2 * 10)) * 1.35 = 60 * 1.35 = 81
      expect(result.totalBoxes).toBe(81);
      expect(Number.isInteger(result.counts.small)).toBe(true);
      expect(Number.isInteger(result.counts.medium)).toBe(true);
      expect(Number.isInteger(result.counts.large)).toBe(true);
      expect(Number.isInteger(result.counts.wardrobe)).toBe(true);

      // Verify proportional scaling values
      expect(result.counts.small).toBe(24);
      expect(result.counts.medium).toBe(36);
      expect(result.counts.large).toBe(12);
      expect(result.counts.wardrobe).toBe(5);
    });
  });

  describe('Task 3: capacityEngine.ts', () => {
    it('asserts that 330 cu ft of cargo inside a 10-ft truck (402 cu ft total, 329 cu ft usable at 18% buffer) triggers critical (>85%) status', () => {
      const truck10ft = TRUCKS['10ft'];
      const result = calculateCapacity(truck10ft, {
        totalVolumeCuFt: 330,
        totalWeightLbs: 1500,
      });

      // 402 * 0.82 = 329.64 cu ft usable
      expect(result.usableCapacityCuFt).toBeCloseTo(329.6, 1);
      expect(result.fillPercentage).toBeGreaterThan(85);
      expect(result.status).toBe('critical');
      expect(result.needsUpgrade).toBe(true);
      expect(result.nextTruck?.id).toBe('15ft');
    });

    it('asserts that cargo weight exceeding maxPayloadLbs flags a payload overload warning', () => {
      const truck10ft = TRUCKS['10ft']; // maxPayloadLbs: 2810
      const result = calculateCapacity(truck10ft, {
        totalVolumeCuFt: 150,
        totalWeightLbs: 3200, // Exceeds 2810 lbs
      });

      expect(result.isOverweight).toBe(true);
      expect(result.payloadWarning).not.toBeNull();
      expect(result.payloadWarning).toContain('exceeds truck maximum payload');
      expect(result.needsUpgrade).toBe(true);
    });

    it('calculates optimal status when cargo is under 70% usable capacity', () => {
      const truck15ft = TRUCKS['15ft']; // 764 cu ft, usable = 626.5 cu ft
      const result = calculateCapacity(truck15ft, {
        totalVolumeCuFt: 300, // ~47.9%
        totalWeightLbs: 2000,
      });

      expect(result.status).toBe('optimal');
      expect(result.fillPercentage).toBeLessThanOrEqual(70);
      expect(result.isOverweight).toBe(false);
    });
  });

  describe('Task 4: packEngine.ts', () => {
    it('verifies mattresses stand on edge (Z = 0, width = 20″, height = 60″/76″)', () => {
      const truck15ft = TRUCKS['15ft'];
      const result = packTruck(truck15ft, {
        queen_bed: 1,
        king_bed: 1,
      });

      const queenBlock = result.blocks.find((b) => b.itemId === 'queen_bed');
      expect(queenBlock).toBeDefined();
      expect(queenBlock?.z).toBe(0); // Left wall
      expect(queenBlock?.width).toBe(20);
      expect(queenBlock?.height).toBe(60);

      const kingBlock = result.blocks.find((b) => b.itemId === 'king_bed');
      expect(kingBlock).toBeDefined();
      expect(kingBlock?.z).toBe(0); // Left wall
      expect(kingBlock?.width).toBe(20);
      expect(kingBlock?.height).toBe(76);
    });

    it('verifies sofas stand vertically (X = 0, height = 84″)', () => {
      const truck15ft = TRUCKS['15ft']; // height is 86"
      const result = packTruck(truck15ft, {
        sofa_3seat: 1,
      });

      const sofaBlock = result.blocks.find((b) => b.itemId === 'sofa_3seat');
      expect(sofaBlock).toBeDefined();
      expect(sofaBlock?.x).toBe(0); // Front bulkhead
      expect(sofaBlock?.height).toBe(84); // Stood vertically
    });

    it('asserts that no items exceed the ceiling height of the selected truck', () => {
      // 10ft truck height is 74"
      const truck10ft = TRUCKS['10ft'];
      const result = packTruck(truck10ft, {
        sofa_3seat: 1,
        king_bed: 1, // 76" item in 74" truck
        box_large: 10,
      });

      for (const block of result.blocks) {
        expect(block.y + block.height).toBeLessThanOrEqual(truck10ft.height);
      }
    });

    it('packs studio and 1-2 bed presets with valid block geometry', () => {
      const studioPack = packTruck('10ft', PRESETS.studio.items);
      expect(studioPack.blocks.length).toBeGreaterThan(0);

      const bedPack = packTruck('15ft', PRESETS['1-2_bed'].items);
      expect(bedPack.blocks.length).toBeGreaterThan(0);

      // Verify Mom's attic receives wardrobe boxes in 15ft truck
      const atticBlocks = bedPack.blocks.filter((b) => b.isAttic);
      expect(atticBlocks.length).toBeGreaterThan(0);
    });
  });
});
