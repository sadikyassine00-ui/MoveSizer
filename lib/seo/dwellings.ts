import { PresetId } from '@/lib/constants/presets';
import { TruckId } from '@/lib/constants/trucks';

export interface DwellingSEOConfig {
  slug: string;
  name: string;
  title: string;
  description: string;
  recommendedTruck: string;
  truckId: TruckId;
  presetId: PresetId;
  estimatedCuFt: number;
  typicalRooms: string;
  boxRange: string;
  keyFurniture: string[];
  recommendationReason: string;
  loadingTips: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
}

export const DWELLINGS_DATA: Record<string, DwellingSEOConfig> = {
  'studio-apartment': {
    slug: 'studio-apartment',
    name: 'Studio Apartment',
    title: 'What Size Moving Truck for a Studio Apartment? (Cubic Feet & Calculator)',
    description:
      'A studio apartment typically requires a 10ft moving truck (300–450 cu ft). View the recommended load layout, box counts, and calculate your exact fit.',
    recommendedTruck: '10ft Cargo Truck',
    truckId: '10ft',
    presetId: 'studio',
    estimatedCuFt: 340,
    typicalRooms: 'Studio / Efficiency (1 Occupant)',
    boxRange: '25 – 40 Boxes',
    keyFurniture: [
      'Queen or Full Bed & Frame',
      'Loveseat or Futon',
      'Coffee Table & Media Console',
      'Small Dining Table / Study Desk',
    ],
    recommendationReason:
      'A 10-foot truck provides 402 gross cu ft (329 cu ft usable with an 18% packing buffer), sufficient for small apartment furniture without paying for unused space.',
    loadingTips: [
      'Stand mattress and box spring upright along the left wall to keep the floor deck open.',
      'Place loveseat and TV console vertically against the front cab bulkhead.',
      'Stack medium and small boxes in uniform 4-high tiers from the back wall forward.',
    ],
    faq: [
      {
        question: 'What size moving truck do I need for a studio apartment?',
        answer:
          'A 10-ft moving truck is generally ideal for a studio apartment, offering approximately 402 gross cubic feet of space, which accommodates a queen bed, loveseat, small table, and 25 to 40 boxes.',
      },
      {
        question: 'Can a queen bed fit in a 10-ft moving truck?',
        answer:
          'Yes, a standard Queen mattress (80″L × 60″H) fits easily stood upright on its side edge along the interior wall of a 10-ft rental truck.',
      },
      {
        question: 'How many boxes are needed for a studio move?',
        answer:
          'Most studio apartment moves require between 25 and 40 total boxes: 30% small, 45% medium, 15% large, and 2 to 3 wardrobe hanging boxes.',
      },
    ],
  },
  '1-bedroom-apartment': {
    slug: '1-bedroom-apartment',
    name: '1-Bedroom Apartment',
    title: 'What Size Moving Truck for a 1-Bedroom Apartment? (Cubic Feet & Calculator)',
    description:
      'A 1-bedroom apartment typically requires a 15ft moving truck (600–800 cu ft). View the recommended load layout, box counts, and calculate your exact fit.',
    recommendedTruck: '15ft Cargo Truck',
    truckId: '15ft',
    presetId: '1-2_bed',
    estimatedCuFt: 620,
    typicalRooms: '1 Bedroom + Living Room & Kitchen (1–2 Occupants)',
    boxRange: '45 – 65 Boxes',
    keyFurniture: [
      'Queen Bed & Foundation',
      '3-Seat Sofa',
      '6-Drawer Dresser & 2 Nightstands',
      'Dining Table & 4 Chairs',
    ],
    recommendationReason:
      "A 15-foot truck provides 764 gross cu ft (626 cu ft usable) plus Mom's Attic shelf for wardrobe boxes and fragile parcels, preventing overloaded floor decks.",
    loadingTips: [
      'Mattress and foundation stand upright along the left side tie rails.',
      '3-seat sofa stands vertically on end against the bulkhead cab wall to conserve floor area.',
      "Utilize Mom's Attic shelf exclusively for wardrobe hanging boxes and fragile cartons.",
      'Construct tight vertical box columns directly in front of bulkhead furniture.',
    ],
    faq: [
      {
        question: 'What size moving truck do I need for a 1-bedroom apartment?',
        answer:
          'A 15-foot moving truck is the standard industry recommendation for a 1-bedroom apartment, accommodating a complete bedroom suite, living room furniture, and 45 to 65 boxes.',
      },
      {
        question: 'Will a 10-ft truck be too small for a 1-bedroom apartment?',
        answer:
          'A 10-ft truck is usually too small for a 1-bedroom apartment if you have a full sofa, dining set, and dresser in addition to your bed. A 15-ft truck provides the needed 18% buffer to avoid a second trip.',
      },
      {
        question: 'How many wardrobe boxes do I need for a 1-bedroom?',
        answer:
          'Plan for 3 to 4 wardrobe boxes (24″×24″×48″) to transport hanging closet clothes without wrinkling.',
      },
    ],
  },
  '2-bedroom-apartment': {
    slug: '2-bedroom-apartment',
    name: '2-Bedroom Apartment',
    title: 'What Size Moving Truck for a 2-Bedroom Apartment? (Cubic Feet & Calculator)',
    description:
      'A 2-bedroom apartment typically requires a 15ft to 20ft moving truck (800–1,100 cu ft). View the recommended load layout and calculate your exact fit.',
    recommendedTruck: '15ft to 20ft Cargo Truck',
    truckId: '15ft',
    presetId: '1-2_bed',
    estimatedCuFt: 750,
    typicalRooms: '2 Bedrooms + Living & Dining (2–3 Occupants)',
    boxRange: '65 – 90 Boxes',
    keyFurniture: [
      '1 King Bed & 1 Queen Bed',
      '3-Seat Sofa & Accent Chair',
      '2 Dressers & 4 Nightstands',
      'Dining Room Suite & Coffee Table',
    ],
    recommendationReason:
      'A 15-ft to 20-ft truck accommodates two full bedroom sets plus living and dining suites without requiring second trips or crushing packed boxes.',
    loadingTips: [
      'Stand both mattresses on edge along the side wall in order of size (King first, then Queen).',
      'Stand sofas vertically against the front cab bulkhead.',
      'Place solid timber dressers flat on the deck floor to establish a stable low center of gravity.',
    ],
    faq: [
      {
        question: 'What size moving truck do I need for a 2-bedroom apartment?',
        answer:
          'Most 2-bedroom apartments fit in a 15-ft truck if moderately furnished, but a 20-ft truck is strongly recommended if both bedrooms have queen/king beds and you have full dining furniture.',
      },
      {
        question: 'Can two king beds fit in a 15-ft truck?',
        answer:
          'Yes, both king mattresses can stand on edge along the 180″ side wall, but remaining deck space will be tight for two large dressers, so careful tier stacking is critical.',
      },
      {
        question: 'How many boxes for a 2-bedroom apartment move?',
        answer:
          'Expect between 65 and 90 total boxes for a 2-bedroom apartment, requiring roughly 200–270 cubic feet of cargo volume.',
      },
    ],
  },
  '2-bedroom-house': {
    slug: '2-bedroom-house',
    name: '2-Bedroom House',
    title: 'What Size Moving Truck for a 2-Bedroom House? (Cubic Feet & Calculator)',
    description:
      'A 2-bedroom house with patio, garage, and extra storage typically requires a 20ft moving truck (1,000 cu ft). View the load layout and calculate your fit.',
    recommendedTruck: '20ft Cargo Truck',
    truckId: '20ft',
    presetId: '1-2_bed',
    estimatedCuFt: 880,
    typicalRooms: '2 Bedrooms + Living, Dining, Patio & Garage (2–3 Occupants)',
    boxRange: '75 – 100 Boxes',
    keyFurniture: [
      '2 Queen Bed Suites',
      'Full Living Room Sectional',
      '2 Dressers & Home Office Desk',
      'Patio Furniture & Lawn/Tool Gear',
    ],
    recommendationReason:
      'Single-family 2-bedroom homes include outdoor items, lawn tools, and kitchen gear that quickly exceed 15-ft limits. A 20-ft truck provides 1,016 cu ft and 5,700 lbs payload.',
    loadingTips: [
      'Load bulky lawnmowers, bicycles, and patio furniture toward the rear rollup door for clean unloading.',
      'Distribute heavy timber dressers along the centerline between wheel wells.',
      'Stack corrugated boxes in 4-to-5 tier vertical columns against the cab bulkhead.',
    ],
    faq: [
      {
        question: 'Why does a 2-bedroom house need a larger truck than a 2-bedroom apartment?',
        answer:
          'Houses generally have yards, patios, garages, and larger kitchens. The additional lawn equipment, tools, and storage bins typically add 150 to 250 cubic feet of cargo.',
      },
      {
        question: 'Will a 20-ft truck handle the weight of a 2-bedroom house?',
        answer:
          'Yes. A 20-ft moving truck supports up to 5,700 lbs of cargo payload, well above the 3,500–4,500 lbs typical of a 2-bedroom home.',
      },
    ],
  },
  '3-bedroom-house': {
    slug: '3-bedroom-house',
    name: '3-Bedroom House',
    title: 'What Size Moving Truck for a 3-Bedroom House? (Cubic Feet & Calculator)',
    description:
      'A 3-bedroom house typically requires a 20ft to 26ft moving truck (1,000–1,600 cu ft). View the recommended load layout and calculate your exact fit.',
    recommendedTruck: '20ft to 26ft Cargo Truck',
    truckId: '20ft',
    presetId: '3+_bed',
    estimatedCuFt: 1100,
    typicalRooms: '3 Bedrooms + Living, Dining, Office & Garage (3–4 Occupants)',
    boxRange: '90 – 130 Boxes',
    keyFurniture: [
      '1 King Bed & 2 Queen/Twin Beds',
      'Sectional Sofa & Recliners',
      '3 Dressers & 2 Desks',
      'Full Dining Room Suite & Appliances',
    ],
    recommendationReason:
      'A 20-foot truck provides 1,016 cu ft for standard 3-bedroom homes, while a 26-foot truck is recommended if you have a garage, basement, or heavy outdoor furniture.',
    loadingTips: [
      'Stand all mattresses along side rails secured with ratchet tie-down straps.',
      'Sofas stand upright against the front bulkhead; heavy wooden dressers sit flat on the deck.',
      'Fill Mom&apos;s Attic shelf with lightweight wardrobe boxes and fragile cartons.',
    ],
    faq: [
      {
        question: 'Can a 3-bedroom house fit in a 20-foot truck?',
        answer:
          'A moderately furnished 3-bedroom home without a basement or garage can fit in a 20-foot truck. If you have substantial patio furniture, garage tools, or a large sectional, upgrade to a 26-ft vehicle.',
      },
      {
        question: 'How many boxes should I buy for a 3-bedroom house?',
        answer:
          'A typical 3-bedroom house move requires between 90 and 130 boxes, including 6 to 8 wardrobe boxes for family closets.',
      },
    ],
  },
  '3-bedroom-home': {
    slug: '3-bedroom-home',
    name: '3-Bedroom Home',
    title: 'What Size Moving Truck for a 3-Bedroom Home? (Cubic Feet & Calculator)',
    description:
      'A 3-bedroom home typically requires a 20ft to 26ft moving truck (1,000–1,600 cu ft). View the recommended load layout and calculate your exact fit.',
    recommendedTruck: '20ft to 26ft Cargo Truck',
    truckId: '20ft',
    presetId: '3+_bed',
    estimatedCuFt: 1100,
    typicalRooms: '3 Bedrooms + Living, Dining, Office & Garage (3–4 Occupants)',
    boxRange: '90 – 130 Boxes',
    keyFurniture: [
      '1 King Bed & 2 Queen/Twin Beds',
      'Sectional Sofa & Recliners',
      '3 Dressers & 2 Desks',
      'Full Dining Room Suite & Appliances',
    ],
    recommendationReason:
      'A 20-foot truck provides 1,016 cu ft for standard 3-bedroom homes, while a 26-foot truck is recommended if you have a garage, basement, or heavy outdoor furniture.',
    loadingTips: [
      'Stand all mattresses along side rails secured with ratchet tie-down straps.',
      'Sofas stand upright against the front bulkhead; heavy wooden dressers sit flat on the deck.',
      'Fill Mom&apos;s Attic shelf with lightweight wardrobe boxes and fragile cartons.',
    ],
    faq: [
      {
        question: 'What size moving truck for a 3-bedroom home?',
        answer:
          'A 20-ft to 26-ft truck is required for a 3-bedroom home, depending on whether you have a basement, garage, or extra living area.',
      },
      {
        question: 'How many cubic feet is a 3-bedroom house?',
        answer:
          'A standard 3-bedroom house holds between 1,000 and 1,400 cubic feet of furniture, appliances, and boxed household goods.',
      },
    ],
  },
  '4-bedroom-house': {
    slug: '4-bedroom-house',
    name: '4-Bedroom House',
    title: 'What Size Moving Truck for a 4-Bedroom House? (Cubic Feet & Calculator)',
    description:
      'A 4-bedroom house requires the largest 26ft commercial moving truck (1,682 cu ft). View the recommended load layout and calculate your exact fit.',
    recommendedTruck: '26ft Commercial Cargo Truck',
    truckId: '26ft',
    presetId: '3+_bed',
    estimatedCuFt: 1450,
    typicalRooms: '4+ Bedrooms + Whole Home, Yard & Garage (4–6 Occupants)',
    boxRange: '130 – 180 Boxes',
    keyFurniture: [
      '2 King/Queen Beds + Twin Beds',
      'Sectional Sofa & Living Room Set',
      '4 Dressers, Desks & Patio Furniture',
      'Large Dining Suite & Major Appliances',
    ],
    recommendationReason:
      'A 26-foot commercial truck provides 1,682 gross cu ft (1,379 cu ft usable) and 9,010 lbs payload capacity, standard for multi-bedroom single-family residences.',
    loadingTips: [
      'Group cargo into distinct loading zones: heavy appliances/bulkhead first, furniture mid-truck, box tiers rear.',
      "Fill Mom's Attic completely with wardrobe hanging boxes and light decorative cartons.",
      'Check axle weight limits and keep heaviest items forward of the rear dual wheels.',
    ],
    faq: [
      {
        question: 'Will a 26-foot moving truck fit a 4-bedroom house?',
        answer:
          'A 26-foot truck is the largest standard rental truck available and fits most 4-bedroom homes up to 2,500 sq ft. For homes over 3,000 sq ft, two trips or two trucks may be required.',
      },
      {
        question: 'What is the maximum payload of a 26-ft moving truck?',
        answer:
          'A standard 26-ft rental truck has a maximum payload capacity of up to 9,010 lbs, easily accommodating multiple solid wood furniture suites and heavy appliances.',
      },
    ],
  },
};

export function getDwellingConfig(slug: string): DwellingSEOConfig | undefined {
  return DWELLINGS_DATA[slug];
}

export function getAllDwellingSlugs(): string[] {
  return Object.keys(DWELLINGS_DATA);
}
