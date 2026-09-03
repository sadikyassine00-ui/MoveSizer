import { TruckId } from './trucks';

export type PresetId = 'studio' | '1-2_bed' | '3+_bed';

export interface PresetDefinition {
  id: PresetId;
  name: string;
  label: string;
  bedrooms: number;
  occupants: number;
  defaultTruck: TruckId;
  description: string;
  items: Record<string, number>;
}

export const PRESETS: Record<PresetId, PresetDefinition> = {
  studio: {
    id: 'studio',
    name: 'Studio Apartment',
    label: 'Studio',
    bedrooms: 0,
    occupants: 1,
    defaultTruck: '10ft',
    description: 'Compact apartment setup ideal for single professionals or students.',
    items: {
      queen_bed: 1,
      loveseat: 1,
      coffee_table: 1,
      tv_stand: 1,
      box_medium: 15,
      box_small: 10,
      box_wardrobe: 2,
    },
  },
  '1-2_bed': {
    id: '1-2_bed',
    name: '1-2 Bedroom Apartment',
    label: '1-2 Bed',
    bedrooms: 2,
    occupants: 2,
    defaultTruck: '15ft',
    description: 'Standard 1 to 2 bedroom layout with dining, living room, and bedroom suites.',
    items: {
      queen_bed: 1,
      sofa_3seat: 1,
      dresser_6drawer: 1,
      nightstand: 2,
      dining_table: 1,
      chair: 4,
      box_medium: 25,
      box_small: 15,
      box_large: 8,
      box_wardrobe: 4,
    },
  },
  '3+_bed': {
    id: '3+_bed',
    name: '3+ Bedroom House',
    label: '3+ Bed',
    bedrooms: 3,
    occupants: 4,
    defaultTruck: '20ft',
    description: 'Multi-bedroom home with multiple beds, living areas, dining set, and home office.',
    items: {
      king_bed: 1,
      queen_bed: 1,
      sofa_3seat: 1,
      loveseat: 1,
      dresser_6drawer: 2,
      nightstand: 4,
      dining_table: 1,
      chair: 6,
      desk: 1,
      box_medium: 40,
      box_small: 25,
      box_large: 15,
      box_wardrobe: 8,
    },
  },
};

export const DWELLING_SLUG_MAP: Record<string, { presetId: PresetId; defaultTruck: TruckId; title: string }> = {
  'studio-apartment': {
    presetId: 'studio',
    defaultTruck: '10ft',
    title: 'Studio Apartment',
  },
  '1-bedroom-apartment': {
    presetId: '1-2_bed',
    defaultTruck: '15ft',
    title: '1-Bedroom Apartment',
  },
  '2-bedroom-apartment': {
    presetId: '1-2_bed',
    defaultTruck: '15ft',
    title: '2-Bedroom Apartment',
  },
  '3-bedroom-home': {
    presetId: '3+_bed',
    defaultTruck: '20ft',
    title: '3-Bedroom Home',
  },
  '4-bedroom-house': {
    presetId: '3+_bed',
    defaultTruck: '26ft',
    title: '4-Bedroom House',
  },
};

export function getPreset(id: PresetId): PresetDefinition | undefined {
  return PRESETS[id];
}
