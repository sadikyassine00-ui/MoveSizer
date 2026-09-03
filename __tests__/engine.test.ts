import { describe, it, expect } from 'vitest';
import { calculateBoxRequirements } from '../lib/engine/boxCalculator';
import { calculateCapacity } from '../lib/engine/capacityEngine';
import { TRUCKS } from '../lib/constants/trucks';

describe('Task 3: Calculation Engines', () => {
  describe('boxCalculator.ts', () => {
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
      expect(result.counts.small).toBe(24); // 81 * 0.3 = 24.3 -> 24
      expect(result.counts.medium).toBe(36); // 81 * 0.45 = 36.45 -> 36
      expect(result.counts.large).toBe(12); // 81 * 0.15 = 12.15 -> 12
      expect(result.counts.wardrobe).toBe(5); // 4 * 1.35 = 5.4 -> 5
    });
  });

  describe('capacityEngine.ts', () => {
    it('asserts that 330 cu ft of cargo inside a 10-ft truck (402 cu ft total, 329 cu ft usable at 18% buffer) triggers critical (>85%) status', () => {
      const truck10ft = TRUCKS['10ft'];
      const result = calculateCapacity(truck10ft, {
        totalVolumeCuFt: 330,
        totalWeightLbs: 1500,
      });

      // 402 * 0.82 = 329.64 cu ft usable
      expect(result.usableCapacityCuFt).toBeCloseTo(329.6, 1);
      // Fill percentage = 330 / 329.64 * 100 = 100.1% (>85%)
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
});
