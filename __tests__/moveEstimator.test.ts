import { describe, it, expect } from 'vitest';
import {
  calculateMoveEstimate,
  normalizeTruckSize,
  isHighDensityZip,
  formatCurrencyRange,
  GAS_PRICE_PER_GAL,
  TOLL_RATE_PER_MILE,
  METRO_FEE_AMOUNT,
  FLEET_MATRIX,
  LABOR_MATRIX,
} from '@/lib/pricing/moveEstimator';

describe('Deterministic Pricing Engine (lib/pricing/moveEstimator.ts)', () => {
  describe('Mathematical Formulas & Cross-Country Verification', () => {
    it('calculates long-haul rates for a 10ft truck across 2,993 miles', () => {
      const result = calculateMoveEstimate({
        truckSize: '10ft',
        cargoCuFt: 300,
        distanceMiles: 2993,
        originZip: '90210',
        destZip: '10001',
      });

      expect(result.truckSize).toBe('10');
      expect(result.isLocal).toBe(false);
      expect(result.distanceMiles).toBe(2993);

      // Verify DIY math
      const fleet = FLEET_MATRIX['10'];
      const expectedEquipment = 2993 * fleet.longHaulFactor * 1.1;
      const expectedFuel = (2993 / fleet.mpg) * GAS_PRICE_PER_GAL;
      const expectedTolls = 2993 * TOLL_RATE_PER_MILE;
      const expectedDiyLow = expectedEquipment + expectedFuel + expectedTolls;
      const expectedDiyHigh = expectedDiyLow * 1.2;

      expect(result.tiers.diy.low).toBeCloseTo(expectedDiyLow, 0);
      expect(result.tiers.diy.high).toBeCloseTo(expectedDiyHigh, 0);
      expect(result.tiers.diy.low).toBeGreaterThan(3200);
      expect(result.tiers.diy.high).toBeLessThan(4100);

      // Verify Hybrid math (+460 for 10ft)
      expect(result.tiers.hybrid.low).toBeCloseTo(expectedDiyLow + 460, 0);
      expect(result.tiers.hybrid.high).toBeCloseTo(expectedDiyHigh + 460, 0);
      expect(result.tiers.hybrid.low).toBeGreaterThan(3600);
      expect(result.tiers.hybrid.high).toBeLessThan(4500);

      // Verify Full-Service math
      // 300 cu ft * 7.0 = 2100 lbs
      // Min weight for 10ft is 1500 -> billable is 2100 lbs
      // Miles > 1500 -> minRate = 1.45, maxRate = 1.85
      // 10001 triggers $450 metro fee
      expect(result.hasMetroFee).toBe(true);
      const expectedFsLow = 2100 * 1.45 * 1.16 + 450;
      const expectedFsHigh = 2100 * 1.85 * 1.16 + 450;
      expect(result.tiers.fullService.low).toBeCloseTo(expectedFsLow, 0);
      expect(result.tiers.fullService.high).toBeCloseTo(expectedFsHigh, 0);
      expect(result.tiers.fullService.low).toBeGreaterThan(3900);
      expect(result.tiers.fullService.high).toBeLessThan(5100);
    });

    it('calculates long-haul rates for a 10ft truck at 2,500 miles within the ~$2,800–$3,400 range', () => {
      const result = calculateMoveEstimate({
        truckSize: '10',
        cargoCuFt: 250,
        distanceMiles: 2500,
        originZip: '90210',
        destZip: '33101', // Miami, FL (no metro fee)
      });

      // DIY Low = 2500 * 0.65 * 1.10 (1787.5) + (2500/11)*3.8 (863.64) + 2500*0.045 (112.5) = 2763.64 (~$2,760-$2,800)
      // DIY High = 2763.64 * 1.20 = 3316.36 (~$3,320-$3,400)
      expect(result.tiers.diy.low).toBeGreaterThanOrEqual(2700);
      expect(result.tiers.diy.low).toBeLessThanOrEqual(2850);
      expect(result.tiers.diy.high).toBeGreaterThanOrEqual(3250);
      expect(result.tiers.diy.high).toBeLessThanOrEqual(3450);

      // Hybrid = DIY + 460 => ~$3,200 to ~$3,800
      expect(result.tiers.hybrid.low).toBeGreaterThanOrEqual(3150);
      expect(result.tiers.hybrid.low).toBeLessThanOrEqual(3350);
      expect(result.tiers.hybrid.high).toBeGreaterThanOrEqual(3700);
      expect(result.tiers.hybrid.high).toBeLessThanOrEqual(3950);
    });

    it('calculates local move pricing correctly with zero long-haul mileage surcharges and zero tolls', () => {
      const result = calculateMoveEstimate({
        truckSize: '15ft',
        cargoCuFt: 400,
        distanceMiles: 15,
        originZip: '90210',
        destZip: '90211',
      });

      expect(result.isLocal).toBe(true);
      expect(result.tiers.diy.breakdown.estimatedTolls).toBe(0);

      // 15ft: local base $29.95 + 15 * $0.99 = $44.80
      // Fuel: (15 / 9) * 3.80 = $6.33
      // Low: 44.80 + 6.33 = $51.13; High: 51.13 * 1.15 = $58.80
      expect(result.tiers.diy.low).toBeCloseTo(51, 0);
      expect(result.tiers.diy.high).toBeCloseTo(59, 0);

      // Hybrid adds $680 for 15ft
      expect(result.tiers.hybrid.low).toBeCloseTo(51 + 680, 0);
      expect(result.tiers.hybrid.high).toBeCloseTo(59 + 680, 0);
      expect(result.tiers.hybrid.low).toBeGreaterThan(700);
      expect(result.tiers.hybrid.low).toBeLessThan(750);
    });

    it('scales labor additions accurately across all 4 truck classes', () => {
      const inputs = [
        { size: '10' as const, expectedLabor: 460 },
        { size: '15' as const, expectedLabor: 680 },
        { size: '20' as const, expectedLabor: 920 },
        { size: '26' as const, expectedLabor: 1350 },
      ];

      for (const item of inputs) {
        expect(LABOR_MATRIX[item.size].totalLaborCost).toBe(item.expectedLabor);
        const estimate = calculateMoveEstimate({
          truckSize: item.size,
          cargoCuFt: 300,
          distanceMiles: 200,
          originZip: '75001',
          destZip: '77001',
        });
        const laborDelta = estimate.tiers.hybrid.low - estimate.tiers.diy.low;
        expect(laborDelta).toBe(item.expectedLabor);
      }
    });

    it('correctly detects high-density urban ZIPs and applies the $450 metro fee', () => {
      // Manhattan (10001)
      const nycMove = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 500,
        distanceMiles: 300,
        originZip: '10001',
        destZip: '07030',
      });
      expect(nycMove.hasMetroFee).toBe(true);
      expect(nycMove.tiers.fullService.breakdown.metroFee).toBe(METRO_FEE_AMOUNT);

      // Boston (02101)
      const bostonMove = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 500,
        distanceMiles: 300,
        originZip: '06001',
        destZip: '02101',
      });
      expect(bostonMove.hasMetroFee).toBe(true);

      // San Francisco (94103)
      const sfMove = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 500,
        distanceMiles: 300,
        originZip: '94103',
        destZip: '95814',
      });
      expect(sfMove.hasMetroFee).toBe(true);

      // Suburban Dallas (75001 to 77001) -> No metro fee
      const dallasMove = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 500,
        distanceMiles: 300,
        originZip: '75001',
        destZip: '77001',
      });
      expect(dallasMove.hasMetroFee).toBe(false);
      expect(dallasMove.tiers.fullService.breakdown.metroFee).toBe(0);
    });

    it('enforces billable weight minimums (1,500 lbs for 10ft, 2,100 lbs for 15ft+)', () => {
      // Tiny 50 cu ft cargo in 10ft truck (50 * 7 = 350 lbs)
      const tiny10 = calculateMoveEstimate({
        truckSize: '10',
        cargoCuFt: 50,
        distanceMiles: 600,
        originZip: '30301',
        destZip: '33101',
      });
      expect(tiny10.tiers.fullService.breakdown.billableWeightLbs).toBe(1500);

      // Tiny 50 cu ft cargo in 15ft truck
      const tiny15 = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 50,
        distanceMiles: 600,
        originZip: '30301',
        destZip: '33101',
      });
      expect(tiny15.tiers.fullService.breakdown.billableWeightLbs).toBe(2100);

      // Large 500 cu ft cargo in 15ft truck (500 * 7 = 3500 lbs > 2100)
      const large15 = calculateMoveEstimate({
        truckSize: '15',
        cargoCuFt: 500,
        distanceMiles: 600,
        originZip: '30301',
        destZip: '33101',
      });
      expect(large15.tiers.fullService.breakdown.billableWeightLbs).toBe(3500);
    });
  });

  describe('Utility & Helper Functions', () => {
    it('normalizes truck size inputs robustly', () => {
      expect(normalizeTruckSize('10')).toBe('10');
      expect(normalizeTruckSize('10ft')).toBe('10');
      expect(normalizeTruckSize('15ft')).toBe('15');
      expect(normalizeTruckSize('20ft')).toBe('20');
      expect(normalizeTruckSize('26ft')).toBe('26');
      expect(normalizeTruckSize('invalid' as any)).toBe('15');
    });

    it('identifies high density ZIP prefixes', () => {
      expect(isHighDensityZip('10001')).toBe(true);
      expect(isHighDensityZip('10101')).toBe(true);
      expect(isHighDensityZip('02138')).toBe(true);
      expect(isHighDensityZip('94102')).toBe(true);
      expect(isHighDensityZip('75001')).toBe(false);
      expect(isHighDensityZip('90210')).toBe(false);
    });

    it('formats currency ranges with clean rounding', () => {
      expect(formatCurrencyRange(1234, 1567)).toBe('$1,230 – $1,570');
      expect(formatCurrencyRange(2800, 3400)).toBe('$2,800 – $3,400');
    });
  });
});
