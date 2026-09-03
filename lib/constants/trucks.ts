export type TruckId = '10ft' | '15ft' | '20ft' | '26ft';

export interface AtticSpec {
  length: number; // inches
  width: number;  // inches
  height: number; // inches
  volumeCuFt: number;
}

export interface TruckSpec {
  id: TruckId;
  name: string;
  length: number;      // interior length in inches
  width: number;       // interior width in inches
  height: number;      // interior height in inches
  volumeCuFt: number;  // total interior volume in cu ft
  maxPayloadLbs: number; // max payload weight in lbs
  hasAttic: boolean;
  attic?: AtticSpec;
  recommendation: string;
}

export const TRUCKS: Record<TruckId, TruckSpec> = {
  '10ft': {
    id: '10ft',
    name: "10' Moving Truck",
    length: 119,
    width: 76,
    height: 74,
    volumeCuFt: 402,
    maxPayloadLbs: 2810,
    hasAttic: false,
    recommendation: 'Studio to small 1-bedroom apartment',
  },
  '15ft': {
    id: '15ft',
    name: "15' Moving Truck",
    length: 180,
    width: 92,
    height: 86,
    volumeCuFt: 764,
    maxPayloadLbs: 6385,
    hasAttic: true,
    attic: {
      length: 36,
      width: 76,
      height: 30,
      volumeCuFt: Math.round((36 * 76 * 30) / 1728),
    },
    recommendation: '1 to 2-bedroom apartment or condo',
  },
  '20ft': {
    id: '20ft',
    name: "20' Moving Truck",
    length: 240,
    width: 92,
    height: 86,
    volumeCuFt: 1016,
    maxPayloadLbs: 5700,
    hasAttic: true,
    attic: {
      length: 36,
      width: 76,
      height: 30,
      volumeCuFt: Math.round((36 * 76 * 30) / 1728),
    },
    recommendation: '2 to 3-bedroom home or large apartment',
  },
  '26ft': {
    id: '26ft',
    name: "26' Moving Truck",
    length: 312,
    width: 98,
    height: 99,
    volumeCuFt: 1682,
    maxPayloadLbs: 9010,
    hasAttic: true,
    attic: {
      length: 36,
      width: 82,
      height: 32,
      volumeCuFt: Math.round((36 * 82 * 32) / 1728),
    },
    recommendation: '3 to 5-bedroom large home',
  },
};

export const TRUCK_ORDER: TruckId[] = ['10ft', '15ft', '20ft', '26ft'];

export function getNextTruck(currentId: TruckId): TruckSpec | null {
  const currentIndex = TRUCK_ORDER.indexOf(currentId);
  if (currentIndex >= 0 && currentIndex < TRUCK_ORDER.length - 1) {
    return TRUCKS[TRUCK_ORDER[currentIndex + 1]];
  }
  return null;
}
