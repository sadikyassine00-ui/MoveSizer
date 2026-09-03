import { TruckSpec, getNextTruck, TRUCKS, TruckId } from '../constants/trucks';
import { ITEMS, getItem } from '../constants/items';

export type CapacityStatus = 'optimal' | 'caution' | 'critical';

export const SAFETY_BUFFER_PERCENT = 18;
export const USABLE_CAPACITY_FACTOR = 0.82; // 1 - 0.18

export interface CapacityCalculationResult {
  truck: TruckSpec;
  interiorVolumeCuFt: number;
  usableCapacityCuFt: number;
  safetyBufferPercent: number;
  totalVolumeCuFt: number;
  remainingCapacityCuFt: number;
  fillPercentage: number;
  status: CapacityStatus;
  totalWeightLbs: number;
  maxPayloadLbs: number;
  isOverweight: boolean;
  payloadUtilizationPercent: number;
  payloadWarning: string | null;
  statusMessage: string;
  nextTruck: TruckSpec | null;
  needsUpgrade: boolean;
}

export type InventoryInput = 
  | Record<string, number>
  | { totalVolumeCuFt: number; totalWeightLbs?: number }
  | Array<{ itemId: string; quantity: number; volumeCuFt?: number; weightLbs?: number }>;

export function calculateCapacity(
  truckOrId: TruckSpec | TruckId,
  inventoryOrTotals: InventoryInput
): CapacityCalculationResult {
  const truck: TruckSpec = typeof truckOrId === 'string' ? TRUCKS[truckOrId] : truckOrId;
  if (!truck) {
    throw new Error(`Invalid truck specified: ${truckOrId}`);
  }

  let totalVolumeCuFt = 0;
  let totalWeightLbs = 0;

  if ('totalVolumeCuFt' in inventoryOrTotals) {
    totalVolumeCuFt = inventoryOrTotals.totalVolumeCuFt;
    totalWeightLbs = inventoryOrTotals.totalWeightLbs ?? 0;
  } else if (Array.isArray(inventoryOrTotals)) {
    for (const entry of inventoryOrTotals) {
      const def = getItem(entry.itemId);
      const vol = entry.volumeCuFt ?? def?.volumeCuFt ?? 0;
      const wt = entry.weightLbs ?? def?.weightLbs ?? 0;
      totalVolumeCuFt += vol * entry.quantity;
      totalWeightLbs += wt * entry.quantity;
    }
  } else {
    // Record<string, number>
    for (const [itemId, quantity] of Object.entries(inventoryOrTotals)) {
      if (quantity <= 0) continue;
      const def = getItem(itemId);
      if (def) {
        totalVolumeCuFt += def.volumeCuFt * quantity;
        totalWeightLbs += def.weightLbs * quantity;
      }
    }
  }

  // 18% Safety buffer calculation
  // Usable Capacity = Interior Truck Volume (cu ft) * 0.82
  const usableCapacityCuFt = Number((truck.volumeCuFt * USABLE_CAPACITY_FACTOR).toFixed(1));
  
  // Fill percentage calculation
  const rawFillPercentage = (totalVolumeCuFt / usableCapacityCuFt) * 100;
  const fillPercentage = Number(rawFillPercentage.toFixed(1));

  const remainingCapacityCuFt = Number(Math.max(0, usableCapacityCuFt - totalVolumeCuFt).toFixed(1));

  // Determine status
  let status: CapacityStatus = 'optimal';
  let statusMessage = 'Optimal fit. Items will fit comfortably with safe packing buffers.';

  if (fillPercentage > 85) {
    status = 'critical';
    statusMessage = 'Over capacity! Space is critically tight. Strongly recommend upgrading truck size to prevent moving-day overflow.';
  } else if (fillPercentage > 70) {
    status = 'caution';
    statusMessage = 'Tight fit. Requires ceiling-height professional stacking and precise packing discipline.';
  }

  const isOverweight = totalWeightLbs > truck.maxPayloadLbs;
  const payloadUtilizationPercent = Number(((totalWeightLbs / truck.maxPayloadLbs) * 100).toFixed(1));
  const payloadWarning = isOverweight
    ? `Warning: Cargo weight (${totalWeightLbs.toLocaleString()} lbs) exceeds truck maximum payload rating (${truck.maxPayloadLbs.toLocaleString()} lbs) by ${(totalWeightLbs - truck.maxPayloadLbs).toLocaleString()} lbs!`
    : null;

  const nextTruck = getNextTruck(truck.id);
  const needsUpgrade = status === 'caution' || status === 'critical' || isOverweight;

  return {
    truck,
    interiorVolumeCuFt: truck.volumeCuFt,
    usableCapacityCuFt,
    safetyBufferPercent: SAFETY_BUFFER_PERCENT,
    totalVolumeCuFt: Number(totalVolumeCuFt.toFixed(1)),
    remainingCapacityCuFt,
    fillPercentage,
    status,
    totalWeightLbs: Math.round(totalWeightLbs),
    maxPayloadLbs: truck.maxPayloadLbs,
    isOverweight,
    payloadUtilizationPercent,
    payloadWarning,
    statusMessage,
    nextTruck,
    needsUpgrade,
  };
}
