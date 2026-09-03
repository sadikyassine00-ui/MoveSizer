export type PackingZone = 'wall_left' | 'bulkhead' | 'floor' | 'attic' | 'tier';
export type ItemCategory = 'living_room' | 'bedroom' | 'dining_office' | 'boxes' | 'custom';

export interface ItemDimensions {
  length: number; // inches
  width: number;  // inches
  height: number; // inches
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  dimensions: ItemDimensions; // Packed dimensions [L, W, H]
  volumeCuFt: number;
  weightLbs: number;
  zone: PackingZone;
  canStackOnTop: boolean;
  maxStackHeight?: number;
  color: string;
  isBox?: boolean;
}

export const ITEMS: Record<string, ItemDefinition> = {
  // Bedrooms
  queen_bed: {
    id: 'queen_bed',
    name: 'Queen Bed (Mattress + Box)',
    category: 'bedroom',
    dimensions: { length: 80, width: 20, height: 60 },
    volumeCuFt: 55.6,
    weightLbs: 130,
    zone: 'wall_left',
    canStackOnTop: false,
    color: '#3B82F6',
  },
  king_bed: {
    id: 'king_bed',
    name: 'King Bed (Mattress + Box)',
    category: 'bedroom',
    dimensions: { length: 80, width: 20, height: 76 },
    volumeCuFt: 70.4,
    weightLbs: 160,
    zone: 'wall_left',
    canStackOnTop: false,
    color: '#1D4ED8',
  },
  dresser_6drawer: {
    id: 'dresser_6drawer',
    name: '6-Drawer Dresser',
    category: 'bedroom',
    dimensions: { length: 60, width: 20, height: 35 },
    volumeCuFt: 24.3,
    weightLbs: 140,
    zone: 'floor',
    canStackOnTop: true,
    color: '#8B5CF6',
  },
  nightstand: {
    id: 'nightstand',
    name: 'Nightstand',
    category: 'bedroom',
    dimensions: { length: 22, width: 18, height: 24 },
    volumeCuFt: 5.5,
    weightLbs: 35,
    zone: 'floor',
    canStackOnTop: false,
    color: '#A78BFA',
  },

  // Living Room
  sofa_3seat: {
    id: 'sofa_3seat',
    name: '3-Seat Sofa (Upright)',
    category: 'living_room',
    dimensions: { length: 35, width: 33, height: 84 },
    volumeCuFt: 56.0,
    weightLbs: 150,
    zone: 'bulkhead',
    canStackOnTop: false,
    color: '#06B6D4',
  },
  loveseat: {
    id: 'loveseat',
    name: 'Loveseat (Upright)',
    category: 'living_room',
    dimensions: { length: 35, width: 33, height: 60 },
    volumeCuFt: 40.1,
    weightLbs: 105,
    zone: 'bulkhead',
    canStackOnTop: false,
    color: '#0891B2',
  },
  coffee_table: {
    id: 'coffee_table',
    name: 'Coffee Table',
    category: 'living_room',
    dimensions: { length: 48, width: 24, height: 18 },
    volumeCuFt: 12.0,
    weightLbs: 45,
    zone: 'floor',
    canStackOnTop: false,
    color: '#14B8A6',
  },
  tv_stand: {
    id: 'tv_stand',
    name: 'TV Stand / Media Console',
    category: 'living_room',
    dimensions: { length: 50, width: 18, height: 24 },
    volumeCuFt: 12.5,
    weightLbs: 60,
    zone: 'floor',
    canStackOnTop: false,
    color: '#0D9488',
  },

  // Dining & Office
  dining_table: {
    id: 'dining_table',
    name: 'Dining Table (Top on edge)',
    category: 'dining_office',
    dimensions: { length: 60, width: 4, height: 36 },
    volumeCuFt: 5.0,
    weightLbs: 65,
    zone: 'wall_left',
    canStackOnTop: false,
    color: '#F59E0B',
  },
  chair: {
    id: 'chair',
    name: 'Dining / Desk Chair',
    category: 'dining_office',
    dimensions: { length: 20, width: 20, height: 38 },
    volumeCuFt: 8.8,
    weightLbs: 18,
    zone: 'floor',
    canStackOnTop: false,
    color: '#D97706',
  },
  desk: {
    id: 'desk',
    name: 'Office Desk',
    category: 'dining_office',
    dimensions: { length: 48, width: 24, height: 30 },
    volumeCuFt: 20.0,
    weightLbs: 75,
    zone: 'floor',
    canStackOnTop: true,
    color: '#B45309',
  },

  // Boxes
  box_small: {
    id: 'box_small',
    name: 'Small Box (Books/Heavy)',
    category: 'boxes',
    dimensions: { length: 16, width: 12, height: 12 },
    volumeCuFt: 1.5,
    weightLbs: 30,
    zone: 'tier',
    canStackOnTop: true,
    maxStackHeight: 5,
    color: '#EAB308',
    isBox: true,
  },
  box_medium: {
    id: 'box_medium',
    name: 'Medium Box (Pantry/Toys)',
    category: 'boxes',
    dimensions: { length: 18, width: 18, height: 16 },
    volumeCuFt: 3.0,
    weightLbs: 35,
    zone: 'tier',
    canStackOnTop: true,
    maxStackHeight: 4,
    color: '#CA8A04',
    isBox: true,
  },
  box_large: {
    id: 'box_large',
    name: 'Large Box (Linens/Pillows)',
    category: 'boxes',
    dimensions: { length: 18, width: 18, height: 24 },
    volumeCuFt: 4.5,
    weightLbs: 40,
    zone: 'tier',
    canStackOnTop: true,
    maxStackHeight: 3,
    color: '#A16207',
    isBox: true,
  },
  box_wardrobe: {
    id: 'box_wardrobe',
    name: 'Wardrobe Box (Clothes on Hanger)',
    category: 'boxes',
    dimensions: { length: 24, width: 24, height: 48 },
    volumeCuFt: 16.0,
    weightLbs: 50,
    zone: 'attic',
    canStackOnTop: false,
    maxStackHeight: 1,
    color: '#854D0E',
    isBox: true,
  },
};

export function getItem(id: string): ItemDefinition | undefined {
  return ITEMS[id];
}
