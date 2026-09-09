import { describe, it, expect } from 'vitest';
import {
  calculateMoveEstimate,
  calculateTaperedLongHaulMiles,
  normalizeTruckSize,
  isHighDensityZip,
  formatCurrencyRange,
  GAS_PRICE_PER_GAL,
  TOLL_RATE_PER_MILE,
  METRO_FEE_AMOUNT,
  FLEET_MATRIX,
  LABOR_MATRIX,
  FULL_SERVICE_PACKING_SURCHARGE,
} from '@/lib/pricing/moveEstimator';

describe('Deterministic Pricing Engine (lib/pricing/moveEstimator.ts)', () => {
  describe('Mathematical Formulas & Cross-Country Verification', () => {
    it('calculates long-haul rates for a 10ft truck across 2,993 miles with tapering and strict hierarchy', () => {
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

      // Verify DIY math with tapering
      const fleet = FLEET_MATRIX['10'];
      const taperedMiles = calculateTaperedLongHaulMiles(2993);
      // 1000 + 850 + 993 * 0.70 = 2545.1
      expect(taperedMiles).toBeCloseTo(2545.1, 1);

      const expectedEquipment = taperedMiles * fleet.longHaulFactor * 1.1;
      expect(expectedEquipment).toBeGreaterThanOrEqual(1600);
      expect(expectedEquipment).toBeLessThanOrEqual(1950);

      const expectedFuel = (2993 / fleet.mpg) * GAS_PRICE_PER_GAL;
      const expectedTolls = 2993 * TOLL_RATE_PER_MILE;
      const expectedDiyLow = expectedEquipment + expectedFuel + expectedTolls;
      const expectedDiyHigh = expectedDiyLow * 1.15;

      expect(result.tiers.diy.low).toBeCloseTo(expectedDiyLow, 0);
      expect(result.tiers.diy.high).toBeCloseTo(expectedDiyHigh, 0);
      expect(result.tiers.diy.low).toBeGreaterThanOrEqual(2750);
      expect(result.tiers.diy.low).toBeLessThanOrEqual(3200);

      // Verify Hybrid math (+460 for 10ft)
      expect(result.tiers.hybrid.low).toBeCloseTo(expectedDiyLow + 460, 0);
      expect(result.tiers.hybrid.low).toBeGreaterThan(result.tiers.diy.low);

      // Verify Full-Service math:
      // Must enforce Coast-to-Coast floor ($4,200 for >2000 miles)
      // Must be >= Hybrid.low * 1.15 (Hierarchy Invariant)
      expect(result.tiers.fullService.low).toBeGreaterThanOrEqual(4200);
      expect(result.tiers.fullService.low).toBeGreaterThanOrEqual(
        Math.round(result.tiers.hybrid.low * 1.15)
      );
      expect(result.tiers.fullService.low).toBeGreaterThan(result.tiers.hybrid.low);
      expect(result.tiers.hybrid.low).toBeGreaterThan(result.tiers.diy.low);
    });

    it('calculates long-haul rates for a 10ft truck at 2,500 miles within target ranges without inversion', () => {
      const result = calculateMoveEstimate({
        truckSize: '10',
        cargoCuFt: 250,
        distanceMiles: 2500,
        originZip: '90210',
        destZip: '33101', // Miami, FL (no metro fee)
      });

      // DIY total should resolve around ~$2,750 – $3,200
      expect(result.tiers.diy.low).toBeGreaterThanOrEqual(2500);
      expect(result.tiers.diy.low).toBeLessThanOrEqual(3200);

      // Full Service must respect the $4,200 coast-to-coast floor
      expect(result.tiers.fullService.low).toBeGreaterThanOrEqual(4200);

      // Strict hierarchy assertion
      expect(result.tiers.fullService.low).toBeGreaterThanOrEqual(
        Math.round(result.tiers.hybrid.low * 1.15)
      );
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
    });

    it('applies distance tapering across mile brackets accurately', () => {
      expect(calculateTaperedLongHaulMiles(500)).toBe(500);
      expect(calculateTaperedLongHaulMiles(1000)).toBe(1000);
      // 1000 + 500 * 0.85 = 1425
      expect(calculateTaperedLongHaulMiles(1500)).toBe(1425);
      // 1000 + 1000 * 0.85 = 1850
      expect(calculateTaperedLongHaulMiles(2000)).toBe(1850);
      // 1000 + 850 + 1000 * 0.70 = 2550
      expect(calculateTaperedLongHaulMiles(3000)).toBe(2550);
    });

    it('applies turnkey packing and labor surcharge for Full-Service Van Lines', () => {
      expect(FULL_SERVICE_PACKING_SURCHARGE['10']).toBe(450);
      expect(FULL_SERVICE_PACKING_SURCHARGE['15']).toBe(650);
      expect(FULL_SERVICE_PACKING_SURCHARGE['20']).toBe(850);
      expect(FULL_SERVICE_PACKING_SURCHARGE['26']).toBe(1100);
    });

    it('enforces coast-to-coast minimum floors for Full-Service jobs', () => {
      // Move of 1,200 miles: floor is $2,800
      const midHaul = calculateMoveEstimate({
        truckSize: '10',
        cargoCuFt: 50,
        distanceMiles: 1200,
        originZip: '75001',
        destZip: '33101',
      });
      expect(midHaul.tiers.fullService.low).toBeGreaterThanOrEqual(2800);

      // Move of 2,400 miles: floor is $4,200
      const crossCountry = calculateMoveEstimate({
        truckSize: '10',
        cargoCuFt: 50,
        distanceMiles: 2400,
        originZip: '90210',
        destZip: '33101',
      });
      expect(crossCountry.tiers.fullService.low).toBeGreaterThanOrEqual(4200);
    });

    it('enforces strict hierarchy invariant across all route types: FullService >= Hybrid * 1.15 >= DIY', () => {
      const scenarios = [
        { truckSize: '10' as const, miles: 50, cargoCuFt: 100 },
        { truckSize: '10' as const, miles: 500, cargoCuFt: 150 },
        { truckSize: '10' as const, miles: 2800, cargoCuFt: 120 },
        { truckSize: '15' as const, miles: 80, cargoCuFt: 300 },
        { truckSize: '15' as const, miles: 1500, cargoCuFt: 400 },
        { truckSize: '20' as const, miles: 2200, cargoCuFt: 600 },
        { truckSize: '26' as const, miles: 2900, cargoCuFt: 1200 },
      ];

      for (const sc of scenarios) {
        const est = calculateMoveEstimate({
          truckSize: sc.truckSize,
          cargoCuFt: sc.cargoCuFt,
          distanceMiles: sc.miles,
          originZip: '90210',
          destZip: '10001',
        });

        // Hierarchy rule: DIY < Hybrid < FullService
        expect(est.tiers.diy.low).toBeLessThan(est.tiers.hybrid.low);
        expect(est.tiers.hybrid.low).toBeLessThan(est.tiers.fullService.low);
        expect(est.tiers.fullService.low).toBeGreaterThanOrEqual(
          Math.round(est.tiers.hybrid.low * 1.15)
        );
      }
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
