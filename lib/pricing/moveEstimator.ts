/**
 * Deterministic Moving Cost Estimation Engine
 *
 * Pure, isolated mathematical utility with zero external side effects or UI imports.
 * Computes transparent, deterministic rates for DIY, Hybrid, and Full-Service options.
 */

export type TruckSizeCode = '10' | '15' | '20' | '26';
export type TruckInputSize = TruckSizeCode | '10ft' | '15ft' | '20ft' | '26ft';

export interface MoveEstimatorInput {
  truckSize: TruckInputSize;
  cargoCuFt: number;
  distanceMiles: number;
  originZip: string;
  destZip: string;
}

export interface MoveTierEstimate {
  id: 'diy' | 'hybrid' | 'full_service';
  name: string;
  tag: string;
  subtitle: string;
  low: number;
  high: number;
  formatted: string;
  breakdown: Record<string, number | string>;
  notes: string[];
}

export interface MoveEstimateResult {
  truckSize: TruckSizeCode;
  truckLabel: string;
  cargoCuFt: number;
  distanceMiles: number;
  isLocal: boolean;
  originZip: string;
  destZip: string;
  hasMetroFee: boolean;
  tiers: {
    diy: MoveTierEstimate;
    hybrid: MoveTierEstimate;
    fullService: MoveTierEstimate;
  };
}

// Universal Financial & Operating Constants
export const GAS_PRICE_PER_GAL = 3.8;
export const TOLL_RATE_PER_MILE = 0.045;
export const LOCAL_DISTANCE_THRESHOLD_MILES = 100;
export const FUEL_SURCHARGE_INDEX = 0.16; // 16% standard carrier fuel index
export const METRO_FEE_AMOUNT = 450;

// High-density urban ZIP prefixes requiring shuttle/parking access fee ($450)
export const HIGH_DENSITY_ZIP_PREFIXES = [
  '100', // Manhattan
  '101', // Manhattan
  '102', // Manhattan
  '021', // Boston
  '022', // Boston
  '941', // San Francisco
];

interface FleetParameter {
  mpg: number;
  localBasePerDay: number;
  longHaulFactor: number;
  label: string;
}

export const FLEET_MATRIX: Record<TruckSizeCode, FleetParameter> = {
  '10': { mpg: 11.0, localBasePerDay: 19.95, longHaulFactor: 0.65, label: '10ft Moving Truck' },
  '15': { mpg: 9.0, localBasePerDay: 29.95, longHaulFactor: 0.75, label: '15ft Moving Truck' },
  '20': { mpg: 8.0, localBasePerDay: 39.95, longHaulFactor: 0.85, label: '20ft Moving Truck' },
  '26': { mpg: 7.0, localBasePerDay: 39.95, longHaulFactor: 1.05, label: '26ft Moving Truck' },
};

interface LaborSpec {
  moversLoad: number;
  hoursLoad: number;
  costLoad: number;
  moversUnload: number;
  hoursUnload: number;
  costUnload: number;
  totalLaborCost: number;
  description: string;
}

export const LABOR_MATRIX: Record<TruckSizeCode, LaborSpec> = {
  '10': {
    moversLoad: 2,
    hoursLoad: 2,
    costLoad: 220,
    moversUnload: 2,
    hoursUnload: 2,
    costUnload: 240,
    totalLaborCost: 460,
    description: '2 movers × 2 hrs load ($220) + 2 movers × 2 hrs unload ($240)',
  },
  '15': {
    moversLoad: 2,
    hoursLoad: 3,
    costLoad: 330,
    moversUnload: 2,
    hoursUnload: 3,
    costUnload: 350,
    totalLaborCost: 680,
    description: '2 movers × 3 hrs load ($330) + 2 movers × 3 hrs unload ($350)',
  },
  '20': {
    moversLoad: 2,
    hoursLoad: 4,
    costLoad: 440,
    moversUnload: 2,
    hoursUnload: 4,
    costUnload: 480,
    totalLaborCost: 920,
    description: '2 movers × 4 hrs load ($440) + 2 movers × 4 hrs unload ($480)',
  },
  '26': {
    moversLoad: 3,
    hoursLoad: 4,
    costLoad: 650,
    moversUnload: 3,
    hoursUnload: 4,
    costUnload: 700,
    totalLaborCost: 1350,
    description: '3 movers × 4 hrs load ($650) + 3 movers × 4 hrs unload ($700)',
  },
};

export const FULL_SERVICE_PACKING_SURCHARGE: Record<TruckSizeCode, number> = {
  '10': 450,
  '15': 650,
  '20': 850,
  '26': 1100,
};

/**
 * Calculates long-haul tapered miles:
 * Miles 100 to 1,000: 100% of class rate.
 * Miles 1,001 to 2,000: 85% of class rate.
 * Miles > 2,000: 70% of class rate.
 */
export function calculateTaperedLongHaulMiles(miles: number): number {
  if (miles <= 1000) {
    return miles;
  }
  const tier1 = 1000;
  const tier2 = Math.min(miles - 1000, 1000);
  const tier3 = miles > 2000 ? miles - 2000 : 0;
  return tier1 * 1.0 + tier2 * 0.85 + tier3 * 0.7;
}

/**
 * Normalizes input truck size string to valid code ('10' | '15' | '20' | '26')
 */
export function normalizeTruckSize(input: TruckInputSize): TruckSizeCode {
  const digits = String(input).replace(/[^0-9]/g, '');
  if (digits === '10' || digits === '15' || digits === '20' || digits === '26') {
    return digits;
  }
  return '15'; // Default fleet baseline
}

/**
 * Checks if a 5-digit ZIP code is in a high-density metro access surcharge zone
 */
export function isHighDensityZip(zip: string): boolean {
  const clean = zip.trim().slice(0, 5);
  return HIGH_DENSITY_ZIP_PREFIXES.some((prefix) => clean.startsWith(prefix));
}

/**
 * Formats a currency range cleanly (e.g., "$2,840 – $3,410")
 */
export function formatCurrencyRange(low: number, high: number): string {
  const roundLow = Math.round(low / 10) * 10;
  const roundHigh = Math.round(high / 10) * 10;
  return `$${roundLow.toLocaleString()} – $${roundHigh.toLocaleString()}`;
}

/**
 * Pure, deterministic moving cost estimator function.
 */
export function calculateMoveEstimate(input: MoveEstimatorInput): MoveEstimateResult {
  const size = normalizeTruckSize(input.truckSize);
  const fleet = FLEET_MATRIX[size];
  const labor = LABOR_MATRIX[size];
  const miles = Math.max(1, input.distanceMiles);
  const cargoCuFt = Math.max(0, input.cargoCuFt);
  const isLocal = miles < LOCAL_DISTANCE_THRESHOLD_MILES;

  const originZipClean = input.originZip.trim().slice(0, 5);
  const destZipClean = input.destZip.trim().slice(0, 5);
  const hasMetroFee = isHighDensityZip(originZipClean) || isHighDensityZip(destZipClean);
  const metroFee = hasMetroFee ? METRO_FEE_AMOUNT : 0;

  // -------------------------------------------------------------------------
  // TIER 1: DIY Truck Rental (Self-Drive)
  // -------------------------------------------------------------------------
  let diyLow: number;
  let diyHigh: number;
  let equipmentCost: number;
  let fuelCost: number;
  let tollsCost: number;

  if (isLocal) {
    equipmentCost = fleet.localBasePerDay + miles * 0.99;
    fuelCost = (miles / fleet.mpg) * GAS_PRICE_PER_GAL;
    tollsCost = 0;
    diyLow = equipmentCost + fuelCost;
    diyHigh = diyLow * 1.15;
  } else {
    const taperedMiles = calculateTaperedLongHaulMiles(miles);
    equipmentCost = taperedMiles * fleet.longHaulFactor * 1.1;
    fuelCost = (miles / fleet.mpg) * GAS_PRICE_PER_GAL;
    tollsCost = miles * TOLL_RATE_PER_MILE;
    diyLow = equipmentCost + fuelCost + tollsCost;
    diyHigh = diyLow * 1.15;
  }

  // -------------------------------------------------------------------------
  // TIER 2: Hybrid (DIY Truck + Professional Hourly Labor)
  // -------------------------------------------------------------------------
  const hybridLow = diyLow + labor.totalLaborCost;
  const hybridHigh = diyHigh + labor.totalLaborCost;

  // -------------------------------------------------------------------------
  // TIER 3: Turnkey Full-Service Van Lines
  // -------------------------------------------------------------------------
  const estimatedWeight = cargoCuFt * 7.0; // standard 7 lbs/cu ft moving tariff factor
  const minWeight = size === '10' ? 1500 : 2100;
  const billableWeight = Math.max(estimatedWeight, minWeight);
  const packingLaborSurcharge = FULL_SERVICE_PACKING_SURCHARGE[size];

  let minRate: number;
  let maxRate: number;

  if (miles > 1500) {
    minRate = 1.45;
    maxRate = 1.85;
  } else if (miles >= 500) {
    minRate = 1.05;
    maxRate = 1.4;
  } else {
    minRate = 0.75;
    maxRate = 1.0;
  }

  let fullServiceLow =
    billableWeight * minRate * (1 + FUEL_SURCHARGE_INDEX) + packingLaborSurcharge + metroFee;
  let fullServiceHigh =
    billableWeight * maxRate * (1 + FUEL_SURCHARGE_INDEX) + packingLaborSurcharge + metroFee;

  // Enforce Coast-to-Coast Minimum Floor
  if (miles > 2000) {
    fullServiceLow = Math.max(fullServiceLow, 4200);
  } else if (miles > 1000) {
    fullServiceLow = Math.max(fullServiceLow, 2800);
  }

  // Enforce Strict Hierarchy Invariant: FullService.low MUST always be >= Hybrid.low * 1.15
  if (fullServiceLow < hybridLow * 1.15) {
    fullServiceLow = Math.round(hybridLow * 1.18);
  }

  // Ensure high is strictly greater than low with realistic commercial variance window
  if (fullServiceHigh < fullServiceLow * 1.2) {
    fullServiceHigh = Math.round(fullServiceLow * 1.22);
  }

  const tiers = {
    diy: {
      id: 'diy' as const,
      name: 'DIY Truck Rental',
      tag: 'SELF-DRIVE BUDGET',
      subtitle: 'Includes truck rental, estimated fuel, and highway tolls.',
      low: Math.round(diyLow),
      high: Math.round(diyHigh),
      formatted: formatCurrencyRange(diyLow, diyHigh),
      breakdown: {
        equipmentCost: Math.round(equipmentCost),
        estimatedFuel: Math.round(fuelCost),
        estimatedTolls: Math.round(tollsCost),
        highwayMpg: fleet.mpg,
        gasPricePerGal: GAS_PRICE_PER_GAL,
      },
      notes: [
        isLocal
          ? `Local base: $${fleet.localBasePerDay.toFixed(2)} + $0.99/mile for ${miles} miles`
          : `Long-distance equipment: ${miles} miles × $${fleet.longHaulFactor.toFixed(2)}/mi factor (+10% base)`,
        `Estimated fuel consumption: ${Math.round(miles / fleet.mpg)} gals @ $${GAS_PRICE_PER_GAL.toFixed(2)}/gal`,
        isLocal ? 'No interstate highway tolls calculated' : `Highway tolls estimated at $0.045/mile ($${Math.round(tollsCost)})`,
      ],
    },
    hybrid: {
      id: 'hybrid' as const,
      name: 'Hybrid Move',
      tag: 'MOST POPULAR',
      subtitle: 'Rent the truck yourself + hire 2 vetted helpers to load & unload.',
      low: Math.round(hybridLow),
      high: Math.round(hybridHigh),
      formatted: formatCurrencyRange(hybridLow, hybridHigh),
      breakdown: {
        truckCostLow: Math.round(diyLow),
        truckCostHigh: Math.round(diyHigh),
        laborCost: labor.totalLaborCost,
        loadMovers: labor.moversLoad,
        loadHours: labor.hoursLoad,
        unloadMovers: labor.moversUnload,
        unloadHours: labor.hoursUnload,
      },
      notes: [
        `Base truck rental & fuel: ${formatCurrencyRange(diyLow, diyHigh)}`,
        `Professional load crew: ${labor.moversLoad} movers for ${labor.hoursLoad} hrs ($${labor.costLoad})`,
        `Professional unload crew: ${labor.moversUnload} movers for ${labor.hoursUnload} hrs ($${labor.costUnload})`,
      ],
    },
    fullService: {
      id: 'full_service' as const,
      name: 'Full-Service Van Lines',
      tag: 'TURNKEY / ZERO-EFFORT',
      subtitle: 'Licensed commercial carrier handling packing, driving, and delivery.',
      low: Math.round(fullServiceLow),
      high: Math.round(fullServiceHigh),
      formatted: formatCurrencyRange(fullServiceLow, fullServiceHigh),
      breakdown: {
        cargoCuFt,
        estimatedWeightLbs: Math.round(estimatedWeight),
        billableWeightLbs: billableWeight,
        linehaulMinRate: minRate,
        linehaulMaxRate: maxRate,
        fuelSurchargePct: FUEL_SURCHARGE_INDEX * 100,
        packingLaborSurcharge,
        metroFee,
      },
      notes: [
        `Billable weight: ${billableWeight.toLocaleString()} lbs (tariff rate $${minRate.toFixed(2)}–$${maxRate.toFixed(2)}/lb)`,
        `Turnkey packing & materials surcharge: +$${packingLaborSurcharge} included`,
        `Carrier fuel surcharge index: 16% included`,
        hasMetroFee
          ? `High-density metro surcharge: +$${METRO_FEE_AMOUNT} included (parking/shuttle access)`
          : 'Standard highway access (no metro shuttle surcharge)',
      ],
    },
  };

  // Enforce Inversion Guardrail: Full-Service must never calculate lower than Hybrid
  if (tiers.fullService.low < tiers.hybrid.low) {
    tiers.fullService.low = Math.round(tiers.hybrid.low * 1.18);
    tiers.fullService.high = Math.round(tiers.hybrid.high * 1.22);
    tiers.fullService.formatted = formatCurrencyRange(tiers.fullService.low, tiers.fullService.high);
  }

  return {
    truckSize: size,
    truckLabel: fleet.label,
    cargoCuFt,
    distanceMiles: miles,
    isLocal,
    originZip: originZipClean,
    destZip: destZipClean,
    hasMetroFee,
    tiers,
  };
}
