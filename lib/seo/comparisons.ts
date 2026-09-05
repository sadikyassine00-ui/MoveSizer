import { TruckId } from '../constants/trucks';
import { PresetId } from '../constants/presets';

export interface ComparisonVehicle {
  name: string;
  brand?: string;
  truckId: TruckId;
  defaultPreset: PresetId;
  lengthFt: string;
  widthFt: string;
  heightFt: string;
  interiorLengthIn: number;
  interiorWidthIn: number;
  interiorHeightIn: number;
  volumeCuFt: number;
  usableCuFt: number;
  maxPayloadLbs: number;
  deckHeightIn: number;
  doorRollupWidthIn: number;
  doorRollupHeightIn: number;
  hasMomsAttic: boolean;
  atticDims?: string;
  hasLoadingRamp: boolean;
  idealDwelling: string;
  bestFor: string;
}

export interface ComparisonDifference {
  metric: string;
  vehicleAVal: string;
  vehicleBVal: string;
  advantage: 'vehicleA' | 'vehicleB' | 'neutral';
  explanation: string;
}

export interface ComparisonBrandRow {
  brand: string;
  truckClass: string;
  grossVolumeCuFt: number;
  usableVolumeCuFt: number;
  interiorDimensions: string;
  deckHeightInches: number;
  rampIncluded: boolean;
  momsAttic: boolean;
  standoutAdvantage: string;
}

export interface ComparisonSpec {
  slug: string;
  canonicalSlug: string;
  isAlias?: boolean;
  title: string;
  h1: string;
  metaDescription: string;
  primaryKeyword: string;
  monthlyVolume: number;
  keywordDifficulty: number;
  comparisonType: 'size_vs_size' | 'fleet_brands';
  vehicleA: ComparisonVehicle;
  vehicleB: ComparisonVehicle;
  keyDifferences: ComparisonDifference[];
  brandMatrix?: ComparisonBrandRow[];
  decisionMatrix: {
    chooseAWhen: string[];
    chooseBWhen: string[];
  };
  bottomLineVerdict: string;
  faqList: { question: string; answer: string }[];
}

export const COMPARISON_SPECS: Record<string, ComparisonSpec> = {
  '10ft-vs-15ft': {
    slug: '10ft-vs-15ft',
    canonicalSlug: '10ft-vs-15ft',
    title: '10ft vs 15ft Moving Truck: Visual Size & Capacity Comparison',
    h1: '10-Foot vs 15-Foot Moving Truck: Which Size Do You Actually Need?',
    metaDescription: 'Comparing 10ft vs 15ft moving trucks side-by-side. Discover the +90% volume jump, Mom\'s Attic cab shelf, and loading ramp difference with 2.5D visual load plans.',
    primaryKeyword: '10 ft vs 15 ft uhaul',
    monthlyVolume: 170,
    keywordDifficulty: 28,
    comparisonType: 'size_vs_size',
    vehicleA: {
      name: '10-Foot Truck',
      truckId: '10ft',
      defaultPreset: 'studio',
      lengthFt: "9'11\"",
      widthFt: "6'4\"",
      heightFt: "6'2\"",
      interiorLengthIn: 119,
      interiorWidthIn: 76,
      interiorHeightIn: 74,
      volumeCuFt: 402,
      usableCuFt: 330,
      maxPayloadLbs: 2810,
      deckHeightIn: 25,
      doorRollupWidthIn: 65,
      doorRollupHeightIn: 65,
      hasMomsAttic: false,
      hasLoadingRamp: false,
      idealDwelling: 'Studio Apartment / College Dorm',
      bestFor: 'Minimalist 1-room moves without heavy appliances or long sectional sofas'
    },
    vehicleB: {
      name: '15-Foot Truck',
      truckId: '15ft',
      defaultPreset: '1-2_bed',
      lengthFt: "15'0\"",
      widthFt: "7'8\"",
      heightFt: "7'2\"",
      interiorLengthIn: 180,
      interiorWidthIn: 92,
      interiorHeightIn: 86,
      volumeCuFt: 764,
      usableCuFt: 626,
      maxPayloadLbs: 6385,
      deckHeightIn: 29,
      doorRollupWidthIn: 73,
      doorRollupHeightIn: 74,
      hasMomsAttic: true,
      atticDims: "36\"L x 76\"W x 30\"H (48 cu ft)",
      hasLoadingRamp: true,
      idealDwelling: '1 to 2 Bedroom Apartment / Small Home',
      bestFor: 'Multi-room apartments, full living room suites, and moves with large cardboard box counts'
    },
    keyDifferences: [
      {
        metric: 'Cargo Volume (Gross / Usable)',
        vehicleAVal: '402 cu ft (330 cu ft usable)',
        vehicleBVal: '764 cu ft (626 cu ft usable)',
        advantage: 'vehicleB',
        explanation: 'The 15ft truck provides nearly 2X the usable storage space (+90% increase in volume).'
      },
      {
        metric: 'Pull-Out Loading Ramp',
        vehicleAVal: 'NO RAMP (Lifting required)',
        vehicleBVal: 'YES (Wide low-deck aluminum ramp)',
        advantage: 'vehicleB',
        explanation: 'The 10ft truck has no ramp; all items must be lifted 25 inches off the ground into the bed. The 15ft includes a wide roll-out ramp.'
      },
      {
        metric: 'Mom\'s Attic Cab-Over Shelf',
        vehicleAVal: 'None',
        vehicleBVal: '36"L x 76"W x 30"H (48 cu ft shelf)',
        advantage: 'vehicleB',
        explanation: 'The 15ft truck features the signature cab shelf, perfect for keeping fragile boxes and electronics away from heavy furniture.'
      },
      {
        metric: 'Maximum Cargo Payload',
        vehicleAVal: '2,810 lbs',
        vehicleBVal: '6,385 lbs (+127% capacity)',
        advantage: 'vehicleB',
        explanation: 'A 15ft truck handles heavy solid-wood dining sets, gym weights, and appliances without exceeding axle limits.'
      },
      {
        metric: 'Maneuverability & Fuel Economy',
        vehicleAVal: '12-14 MPG (Fits standard parking spots)',
        vehicleBVal: '10 MPG (Requires wide turns)',
        advantage: 'vehicleA',
        explanation: 'The 10ft vehicle drives like a standard passenger van, making it significantly easier to navigate tight downtown alleys.'
      }
    ],
    decisionMatrix: {
      chooseAWhen: [
        'You are moving a modest studio apartment or single dorm room.',
        'You have zero heavy major appliances (no washer/dryer/fridge) to lift without a ramp.',
        'You need to navigate congested urban corridors and parallel park.',
        'Your total cardboard box count is under 25 boxes.'
      ],
      chooseBWhen: [
        'You have a 1-bedroom or 2-bedroom home with complete living room and bedroom furniture.',
        'You have heavy appliances or dressers that require an aluminum loading ramp with a dolly.',
        'You want Mom\'s Attic storage for fragile keepsakes and 4+ wardrobe boxes.',
        'You are between sizes and cannot afford an emergency second round-trip.'
      ]
    },
    bottomLineVerdict: 'If your move includes more than 1 bed or any heavy furniture that requires a loading ramp, upgrade to the 15ft truck. The nominal $10–$20 daily rate difference is vastly cheaper than spending hours lifting heavy dressers into a 10ft bed without a ramp or making an exhausting second trip.',
    faqList: [
      {
        question: 'Does the 10ft moving truck have a loading ramp?',
        answer: 'No. Standard 10ft rental trucks (including U-Haul) do NOT include a pull-out loading ramp. You must manually lift every item into the 25-inch high cargo bed. The 15ft truck is the smallest size that includes a wide aluminum loading ramp.'
      },
      {
        question: 'Will a king mattress fit in a 10ft truck vs 15ft truck?',
        answer: 'Yes, a king mattress (76" x 80") fits inside both trucks when stood on edge along the left side wall. However, in a 10ft truck it consumes 67% of total truck length, leaving minimal room for a couch or dining table.'
      },
      {
        question: 'What is the price difference between renting a 10ft vs 15ft truck?',
        answer: 'For in-town local rentals, U-Haul base daily rates are typically $19.95 for a 10ft truck and $29.95 for a 15ft truck plus mileage ($0.99–$1.29/mile). The extra $10 base cost is widely considered the best value upgrade in DIY moving.'
      }
    ]
  },
  '15ft-vs-20ft': {
    slug: '15ft-vs-20ft',
    canonicalSlug: '15ft-vs-20ft',
    title: '15ft vs 20ft Moving Truck: Capacity & Volume Comparison',
    h1: '15-Foot vs 20-Foot Moving Truck: Where Is the Capacity Threshold?',
    metaDescription: '15ft vs 20ft moving truck comparison: 764 cu ft vs 1,016 cu ft. Find out which size prevents moving-day overflow for 2 to 3 bedroom apartments and homes.',
    primaryKeyword: 'u haul 15 vs 20 foot truck',
    monthlyVolume: 210,
    keywordDifficulty: 30,
    comparisonType: 'size_vs_size',
    vehicleA: {
      name: '15-Foot Truck',
      truckId: '15ft',
      defaultPreset: '1-2_bed',
      lengthFt: "15'0\"",
      widthFt: "7'8\"",
      heightFt: "7'2\"",
      interiorLengthIn: 180,
      interiorWidthIn: 92,
      interiorHeightIn: 86,
      volumeCuFt: 764,
      usableCuFt: 626,
      maxPayloadLbs: 6385,
      deckHeightIn: 29,
      doorRollupWidthIn: 73,
      doorRollupHeightIn: 74,
      hasMomsAttic: true,
      atticDims: "36\"L x 76\"W x 30\"H (48 cu ft)",
      hasLoadingRamp: true,
      idealDwelling: '1 to 2 Bedroom Apartment (Under 1,000 sq ft)',
      bestFor: 'Moderate apartments with 1 living room, 1-2 beds, and up to 50 boxes'
    },
    vehicleB: {
      name: '20-Foot Truck',
      truckId: '20ft',
      defaultPreset: '3+_bed',
      lengthFt: "20'0\"",
      widthFt: "7'8\"",
      heightFt: "7'2\"",
      interiorLengthIn: 240,
      interiorWidthIn: 92,
      interiorHeightIn: 86,
      volumeCuFt: 1016,
      usableCuFt: 833,
      maxPayloadLbs: 5700,
      deckHeightIn: 32,
      doorRollupWidthIn: 73,
      doorRollupHeightIn: 74,
      hasMomsAttic: true,
      atticDims: "36\"L x 76\"W x 30\"H (48 cu ft)",
      hasLoadingRamp: true,
      idealDwelling: '2 to 3 Bedroom Home (1,200 to 1,600 sq ft)',
      bestFor: 'Multi-bedroom houses with formal dining sets, patio furniture, and 60+ boxes'
    },
    keyDifferences: [
      {
        metric: 'Cargo Floor Length',
        vehicleAVal: '180 inches (15 feet)',
        vehicleBVal: '240 inches (20 feet) [+5 extra feet]',
        advantage: 'vehicleB',
        explanation: 'The extra 5 feet of floor deck provides two additional vertical box tiers (accommodating ~25-30 more boxes) without needing dangerous ceiling-high stacking.'
      },
      {
        metric: 'Total Usable Capacity',
        vehicleAVal: '626 cu ft (with 18% buffer)',
        vehicleBVal: '833 cu ft (with 18% buffer)',
        advantage: 'vehicleB',
        explanation: 'Provides +207 usable cubic feet (+33% more interior capacity), preventing the common "last 15 boxes won\'t fit" panic.'
      },
      {
        metric: 'Towing Capability',
        vehicleAVal: 'Up to 10,000 lbs tow hitch',
        vehicleBVal: 'Up to 7,500 lbs tow hitch',
        advantage: 'neutral',
        explanation: 'Both vehicles easily tow an auto transport or utility trailer, but the 20ft truck body is built on a heavy commercial dual rear-wheel chassis.'
      },
      {
        metric: 'Urban Clearance & Parking',
        vehicleAVal: 'Standard commercial parking',
        vehicleBVal: 'Requires 2.5 car spaces for parking',
        advantage: 'vehicleA',
        explanation: 'At 20 feet plus cab length (total vehicle ~27 feet), the 20ft truck cannot easily navigate dead-end cul-de-sacs or tight multi-family parking structures.'
      }
    ],
    decisionMatrix: {
      chooseAWhen: [
        'You have a 1-bedroom or modest 2-bedroom apartment with minimalist furnishings.',
        'Your inventory has 45 or fewer cardboard boxes.',
        'You have no outdoor patio furniture, lawnmowers, or bulky garage tool chests.',
        'Your destination requires navigating tight one-way historic streets.'
      ],
      chooseBWhen: [
        'You have 2 bedrooms with heavy furniture (2 queen/king sets, 2 dressers, desks).',
        'You have a formal dining table with 6 chairs and an L-shaped sectional couch.',
        'You have 50 to 80 cardboard boxes and multiple wardrobe boxes.',
        'You are doing a one-way long-distance move where a second trip is impossible.'
      ]
    },
    bottomLineVerdict: 'The 15ft truck is the most commonly overloaded vehicle in the rental industry because movers underestimate their box totals. If your move exceeds 1,000 square feet or contains more than 50 boxes, reserve the 20ft truck for guaranteed peace of mind.',
    faqList: [
      {
        question: 'How many rooms does a 15ft truck hold vs a 20ft truck?',
        answer: 'A 15ft truck comfortably holds up to 2 bedrooms or small apartments (around 700–1,000 sq ft). A 20ft truck comfortably holds 2–3 bedrooms (1,200–1,600 sq ft) including full dining sets and outdoor patio furniture.'
      },
      {
        question: 'Is a 20ft moving truck hard to drive?',
        answer: 'The 20ft truck drives similar to a large delivery van. It features large side mirrors, power steering, and automatic transmission. The primary considerations are taking wider turns at tight intersections and planning clearance for low-hanging branches.'
      }
    ]
  },
  '15ft-truck-brands': {
    slug: '15ft-truck-brands',
    canonicalSlug: '15ft-truck-brands',
    title: '15ft Moving Truck Comparison: U-Haul 15\' vs Budget 16\' vs Penske 16\'',
    h1: '15ft & 16ft Moving Truck Comparison: U-Haul vs Budget vs Penske',
    metaDescription: 'Detailed comparison of mid-size rental trucks: U-Haul 15\' vs Budget 16\' vs Penske 16\'. Compare interior dimensions, Mom\'s Attic, loading ramps, and rental discounts.',
    primaryKeyword: '15f moving truck comparison',
    monthlyVolume: 140,
    keywordDifficulty: 22,
    comparisonType: 'fleet_brands',
    vehicleA: {
      name: 'U-Haul 15-Foot Truck',
      brand: 'U-Haul',
      truckId: '15ft',
      defaultPreset: '1-2_bed',
      lengthFt: "15'0\"",
      widthFt: "7'8\"",
      heightFt: "7'2\"",
      interiorLengthIn: 180,
      interiorWidthIn: 92,
      interiorHeightIn: 86,
      volumeCuFt: 764,
      usableCuFt: 626,
      maxPayloadLbs: 6385,
      deckHeightIn: 29,
      doorRollupWidthIn: 73,
      doorRollupHeightIn: 74,
      hasMomsAttic: true,
      atticDims: "36\"L x 76\"W x 30\"H",
      hasLoadingRamp: true,
      idealDwelling: '1-2 Bedroom Standard Apartment',
      bestFor: 'Lowest loading deck height (29") and patented Mom\'s Attic cab compartment'
    },
    vehicleB: {
      name: 'Penske / Budget 16-Foot Box Truck',
      brand: 'Penske / Budget',
      truckId: '15ft',
      defaultPreset: '1-2_bed',
      lengthFt: "16'0\"",
      widthFt: "7'7\"",
      heightFt: "6'6\"",
      interiorLengthIn: 192,
      interiorWidthIn: 91,
      interiorHeightIn: 78,
      volumeCuFt: 800,
      usableCuFt: 656,
      maxPayloadLbs: 4300,
      deckHeightIn: 35,
      doorRollupWidthIn: 73,
      doorRollupHeightIn: 72,
      hasMomsAttic: false,
      hasLoadingRamp: true,
      idealDwelling: '2 Bedroom Apartment / Condo',
      bestFor: 'Commercial-grade diesel engines (Penske), flatter continuous floor deck, and online booking promo discounts (15-20% off)'
    },
    keyDifferences: [
      {
        metric: 'Mom\'s Attic Cab-Over Shelf',
        vehicleAVal: 'YES (48 cu ft elevated shelf)',
        vehicleBVal: 'NO (Flat roof cab bulkhead)',
        advantage: 'vehicleA',
        explanation: 'U-Haul has a dedicated cab-over shelf for fragile items and wardrobe boxes. Budget and Penske 16\' trucks have flat roofs without cab shelves.'
      },
      {
        metric: 'Loading Deck Height from Ground',
        vehicleAVal: '29 inches (Low-deck design)',
        vehicleBVal: '35 inches (Commercial chassis)',
        advantage: 'vehicleA',
        explanation: 'U-Haul trucks feature custom lowered chassis frames that sit 6 inches lower than standard commercial truck decks, reducing ramp incline angle.'
      },
      {
        metric: 'Continuous Floor Length',
        vehicleAVal: '15 feet',
        vehicleBVal: '16 feet (+1 foot longer)',
        advantage: 'vehicleB',
        explanation: 'Budget and Penske offer an extra foot of continuous flat floor length, helpful for long ladders or oversized sectional sofas.'
      },
      {
        metric: 'Online Booking Discounts',
        vehicleAVal: 'Rarely discounted ($29.95 standard)',
        vehicleBVal: '15% to 20% online promo discounts',
        advantage: 'vehicleB',
        explanation: 'Budget and Penske offer aggressive affiliate and promo discounts (AAA, military, student, and online early booking).'
      }
    ],
    brandMatrix: [
      {
        brand: 'U-Haul',
        truckClass: '15-Foot Truck',
        grossVolumeCuFt: 764,
        usableVolumeCuFt: 626,
        interiorDimensions: "15'0\" x 7'8\" x 7'2\"",
        deckHeightInches: 29,
        rampIncluded: true,
        momsAttic: true,
        standoutAdvantage: 'Low-deck ease of loading + Mom\'s Attic shelf for delicate parcels'
      },
      {
        brand: 'Budget',
        truckClass: '16-Foot Medium Truck',
        grossVolumeCuFt: 800,
        usableVolumeCuFt: 656,
        interiorDimensions: "16'0\" x 7'7\" x 6'6\"",
        deckHeightInches: 35,
        rampIncluded: true,
        momsAttic: false,
        standoutAdvantage: 'Frequent 20% online coupons, reliable mid-range long-distance pricing'
      },
      {
        brand: 'Penske',
        truckClass: '16-Foot Box Truck',
        grossVolumeCuFt: 800,
        usableVolumeCuFt: 656,
        interiorDimensions: "16'0\" x 7'7\" x 6'6\"",
        deckHeightInches: 35,
        rampIncluded: true,
        momsAttic: false,
        standoutAdvantage: 'Newest commercial fleet average age, smooth transmission, free unlimited miles on one-way'
      }
    ],
    decisionMatrix: {
      chooseAWhen: [
        'You have fragile electronics, delicate kitchenware, or wardrobe boxes requiring Mom\'s Attic protection.',
        'You want the gentlest ramp angle and lowest 29" deck height for easier manual loading.',
        'You need a convenient local drop-off with U-Haul\'s extensive 20,000+ dealer network.'
      ],
      chooseBWhen: [
        'You want to save 15–20% on rental rates using promo codes through Budget or Penske.',
        'You are doing a long-distance move and want Penske\'s free unlimited mileage policy.',
        'You need 16 full feet of flat floor length without wheel-well intrusions.'
      ]
    },
    bottomLineVerdict: 'Choose U-Haul 15ft for easiest loading and Mom\'s Attic compartment. Choose Penske or Budget 16ft for one-way highway moves with unlimited mileage and 15–20% online booking discounts.',
    faqList: [
      {
        question: 'Which is better: U-Haul 15ft or Budget 16ft?',
        answer: 'U-Haul 15ft is easier to load due to its 29-inch low-deck height and Mom\'s Attic shelf. Budget 16ft offers slightly more cubic volume (800 cu ft) and frequently costs 15–20% less when applying online booking promo codes.'
      },
      {
        question: 'Does Penske 16ft have a loading ramp?',
        answer: 'Yes, Penske 16ft box trucks include a heavy-duty, anti-slip 1,000-lb capacity aluminum pull-out ramp.'
      },
      {
        question: 'Does Penske charge for mileage on one-way rentals?',
        answer: 'No. Penske offers free unlimited mileage on all one-way truck rentals, which can save several hundred dollars compared to competitors on cross-country moves.'
      }
    ]
  }
};

export const COMPARISON_ALIASES: Record<string, string> = {
  '10f-vs-15f': '10ft-vs-15ft',
  '15f-vs-20f': '15ft-vs-20ft',
  '15f-truck-brands': '15ft-truck-brands',
};

export function getComparisonSpec(rawSlug: string): ComparisonSpec | null {
  const normalized = rawSlug.toLowerCase().trim();
  const canonical = COMPARISON_ALIASES[normalized] || normalized;
  const spec = COMPARISON_SPECS[canonical];
  if (!spec) return null;
  if (normalized !== canonical) {
    return {
      ...spec,
      slug: normalized,
      isAlias: true,
    };
  }
  return spec;
}

export function getAllComparisonSlugs(): string[] {
  const canonicals = Object.keys(COMPARISON_SPECS);
  const aliases = Object.keys(COMPARISON_ALIASES);
  return Array.from(new Set([...canonicals, ...aliases]));
}

export function getCanonicalComparisonSlugs(): string[] {
  return Object.keys(COMPARISON_SPECS);
}
