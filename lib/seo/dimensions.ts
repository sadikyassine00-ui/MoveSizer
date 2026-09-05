import { TruckId } from '../constants/trucks';
import { PresetId } from '../constants/presets';

export interface FleetBrandComparison {
  brand: 'U-Haul' | 'Budget' | 'Penske' | 'Enterprise';
  sizeName: string;
  volumeCuFt: number;
  usableCuFt: number;
  interiorDims: string; // e.g. "15' x 7'8\" x 7'2\""
  maxPayloadLbs: number;
  deckHeightInches: number;
  rampIncluded: boolean;
  momsAtticIncluded: boolean;
  estFuelEconomyMpg: string;
}

export interface DimensionSpec {
  slug: string;
  isAlias?: boolean;
  canonicalSlug: string;
  isBrandFlanking: boolean;
  brand?: 'u-haul';
  title: string;
  h1: string;
  metaDescription: string;
  primaryKeyword: string;
  monthlyVolume: number;
  keywordDifficulty: number;
  truckId: TruckId;
  targetDwelling: PresetId;
  visualHook: string;
  dimensions: {
    lengthInches: number;
    widthInches: number;
    heightInches: number;
    lengthFeet: string;
    widthFeet: string;
    heightFeet: string;
    deckHeightInches: number;
    doorRollupWidthInches: number;
    doorRollupHeightInches: number;
    grossVolumeCuFt: number;
    usableVolumeCuFt: number;
    maxPayloadLbs: number;
    hasAttic: boolean;
    atticDims?: string;
    loadingRamp: boolean;
  };
  recommendedInventory: {
    dwellingLabel: string;
    roomsLabel: string;
    boxKitRecommendation: string;
    boxCountTotal: number;
  };
  brandComparisons: FleetBrandComparison[];
  adjacentSizes: {
    previous?: { slug: string; label: string };
    next?: { slug: string; label: string };
  };
  inContentNotes: string[];
}

export const DIMENSION_SPECS: Record<string, DimensionSpec> = {
  // -------------------------------------------------------------------------
  // CLUSTER A: Master Pillar Page
  // -------------------------------------------------------------------------
  'box-truck': {
    slug: 'box-truck',
    canonicalSlug: 'box-truck',
    isBrandFlanking: false,
    title: 'Box Truck Dimensions & Cargo Sizing Guide | TruckSizer',
    h1: 'Commercial Box Truck Dimensions & Loading Capacity Chart',
    metaDescription:
      'Complete comparison chart of standard box truck dimensions (10ft to 26ft). View exact interior lengths, door heights, cubic volume, and 2.5D visual load plans.',
    primaryKeyword: 'box truck dimensions',
    monthlyVolume: 2400,
    keywordDifficulty: 12,
    truckId: '15ft',
    targetDwelling: '1-2_bed',
    visualHook: 'Master fleet comparative 2.5D visualizer across all standard cargo tiers.',
    dimensions: {
      lengthInches: 180,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "15'0\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 33,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 764,
      usableVolumeCuFt: 626,
      maxPayloadLbs: 6385,
      hasAttic: true,
      atticDims: "36″L × 76″W × 30″H (48 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: 'Fleet Comparison Index',
      roomsLabel: 'All Dwellings (Studio to 5-Bedroom)',
      boxKitRecommendation: 'Variable by selected fleet size',
      boxCountTotal: 40,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "15' Truck",
        volumeCuFt: 764,
        usableCuFt: 626,
        interiorDims: "15'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 6385,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'7\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      next: { slug: '10ft-truck', label: "10' Box Truck Dimensions" },
    },
    inContentNotes: [
      'Standard commercial box trucks feature deck heights ranging from 29 inches (small cab-overs) to 38 inches (heavy 26-foot chassis).',
      'The 18% real-world packing buffer accounts for wheel-well intrusion, roll-up door tracks, and structural furniture voids.',
    ],
  },

  // -------------------------------------------------------------------------
  // CLUSTER A: Generic Box Trucks
  // -------------------------------------------------------------------------
  '10ft-truck': {
    slug: '10ft-truck',
    canonicalSlug: '10ft-truck',
    isBrandFlanking: false,
    title: "10-Ft Box Truck Dimensions & Sizing Guide | TruckSizer",
    h1: "10' Box Truck Interior Dimensions, Specs & Capacity",
    metaDescription:
      "Exact interior dimensions for 10-foot box trucks: 119″ length, 76″ width, 74″ height, 402 cu ft volume. View 2.5D visual load plan and moving rates.",
    primaryKeyword: '10 f truck',
    monthlyVolume: 880,
    keywordDifficulty: 30,
    truckId: '10ft',
    targetDwelling: 'studio',
    visualHook: 'Studio / Dormitory 2.5D Layout showing Queen Bed on edge and stacked box tiers.',
    dimensions: {
      lengthInches: 119,
      widthInches: 76,
      heightInches: 74,
      lengthFeet: "9'11\"",
      widthFeet: "6'4\"",
      heightFeet: "6'2\"",
      deckHeightInches: 29,
      doorRollupWidthInches: 67,
      doorRollupHeightInches: 71,
      grossVolumeCuFt: 402,
      usableVolumeCuFt: 330,
      maxPayloadLbs: 2810,
      hasAttic: false,
      loadingRamp: false,
    },
    recommendedInventory: {
      dwellingLabel: 'Studio or College Dormitory',
      roomsLabel: '1 Room + Kitchen Essentials',
      boxKitRecommendation: '27-Piece Studio Moving Box Kit',
      boxCountTotal: 27,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "10' Truck",
        volumeCuFt: 402,
        usableCuFt: 330,
        interiorDims: "9'11\" × 6'4\" × 6'2\"",
        maxPayloadLbs: 2810,
        deckHeightInches: 29,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "12' Truck",
        volumeCuFt: 450,
        usableCuFt: 369,
        interiorDims: "11'6\" × 6'6\" × 6'2\"",
        maxPayloadLbs: 3100,
        deckHeightInches: 31,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "12' Truck",
        volumeCuFt: 450,
        usableCuFt: 369,
        interiorDims: "11'6\" × 6'6\" × 6'2\"",
        maxPayloadLbs: 3100,
        deckHeightInches: 31,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      next: { slug: '12ft-truck', label: "12' Box Truck Specs" },
    },
    inContentNotes: [
      'The 10-foot truck is the only standard commercial rental vehicle designed with a low deck height of 29 inches that eliminates the need for a loading ramp.',
      'Fits a standard Queen mattress stood vertically along the driver-side cargo rail with 14 inches of ceiling clearance.',
    ],
  },

  '12ft-truck': {
    slug: '12ft-truck',
    canonicalSlug: '12ft-truck',
    isBrandFlanking: false,
    title: "12-Ft Box Truck Dimensions & Capacity Guide | TruckSizer",
    h1: "12' Box Truck Dimensions, Interior Specs & Load Capacity",
    metaDescription:
      "Exact 12-foot box truck dimensions: 138″ length, 78″ width, 74″ height, 450 cu ft interior capacity. Compare Budget & Penske 12ft specs with 2.5D visual load plan.",
    primaryKeyword: '12 f box truck',
    monthlyVolume: 720,
    keywordDifficulty: 30,
    truckId: '10ft', // Maps to 10ft/compact engine representation
    targetDwelling: '1-2_bed',
    visualHook: '1 Bedroom Small Apartment Layout with Queen Bed, Loveseat, and 30+ boxes.',
    dimensions: {
      lengthInches: 138,
      widthInches: 78,
      heightInches: 74,
      lengthFeet: "11'6\"",
      widthFeet: "6'6\"",
      heightFeet: "6'2\"",
      deckHeightInches: 31,
      doorRollupWidthInches: 71,
      doorRollupHeightInches: 71,
      grossVolumeCuFt: 450,
      usableVolumeCuFt: 369,
      maxPayloadLbs: 3100,
      hasAttic: false,
      loadingRamp: false,
    },
    recommendedInventory: {
      dwellingLabel: '1-Bedroom Small Apartment',
      roomsLabel: 'Bedroom + Living Room + Dining',
      boxKitRecommendation: '35-Piece 1-Bedroom Box Kit',
      boxCountTotal: 35,
    },
    brandComparisons: [
      {
        brand: 'Budget',
        sizeName: "12' Truck",
        volumeCuFt: 450,
        usableCuFt: 369,
        interiorDims: "11'6\" × 6'6\" × 6'2\"",
        maxPayloadLbs: 3100,
        deckHeightInches: 31,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "12' Truck",
        volumeCuFt: 450,
        usableCuFt: 369,
        interiorDims: "11'6\" × 6'6\" × 6'2\"",
        maxPayloadLbs: 3100,
        deckHeightInches: 31,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'U-Haul',
        sizeName: "10' Truck (Closest)",
        volumeCuFt: 402,
        usableCuFt: 330,
        interiorDims: "9'11\" × 6'4\" × 6'2\"",
        maxPayloadLbs: 2810,
        deckHeightInches: 29,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '10ft-truck', label: "10' Box Truck" },
      next: { slug: '15ft-truck', label: "15' Box Truck" },
    },
    inContentNotes: [
      'Popular size in Budget and Penske fleets offering 12% more cubic footage than U-Haul 10-foot trucks.',
      'Standard automatic transmission with fuel economy averaging 12 mpg.',
    ],
  },

  '15ft-truck': {
    slug: '15ft-truck',
    canonicalSlug: '15ft-truck',
    isBrandFlanking: false,
    title: "15-Ft Box Truck Dimensions & Interior Volume | TruckSizer",
    h1: "15' Box Truck Dimensions, Interior Specs & Load Capacity",
    metaDescription:
      "Comprehensive dimensions for 15-ft moving trucks: 180″ length, 92″ width, 86″ height, 764 cu ft volume. View 2.5D visual load plan for 1-2 bedroom moves.",
    primaryKeyword: "15' truck",
    monthlyVolume: 1300,
    keywordDifficulty: 21,
    truckId: '15ft',
    targetDwelling: '1-2_bed',
    visualHook: "1-2 Bedroom Standard Home Layout with Mom's Attic compartment and loading ramp.",
    dimensions: {
      lengthInches: 180,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "15'0\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 33,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 764,
      usableVolumeCuFt: 626,
      maxPayloadLbs: 6385,
      hasAttic: true,
      atticDims: "36″L × 76″W × 30″H (48 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '1 to 2-Bedroom Apartment or Home',
      roomsLabel: 'Living Room, Dining, Master Bed, Patio',
      boxKitRecommendation: '55-Piece 2-Bedroom Box Kit',
      boxCountTotal: 55,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "15' Truck",
        volumeCuFt: 764,
        usableCuFt: 626,
        interiorDims: "15'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 6385,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'7\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '12ft-truck', label: "12' Box Truck" },
      next: { slug: '16ft-truck', label: "16' Box Truck" },
    },
    inContentNotes: [
      "Features a specialized over-cab storage space ('Mom's Attic') that provides 48 cubic feet of protected headroom for fragile parcels.",
      'Includes a low-profile aluminum loading ramp that extends 9 feet to reduce ramp incline.',
    ],
  },

  '16ft-truck': {
    slug: '16ft-truck',
    canonicalSlug: '16ft-truck',
    isBrandFlanking: false,
    title: "16-Ft Box Truck Dimensions & Specs Guide | TruckSizer",
    h1: "16' Box Truck Dimensions, Floor Space & Load Capacity",
    metaDescription:
      "Complete 16-foot box truck dimensions: 192″ length, 92″ width, 86″ height, 800 cu ft volume. Compare Budget & Penske 16ft specs with 2.5D visual load model.",
    primaryKeyword: '16 foot box truck',
    monthlyVolume: 1600,
    keywordDifficulty: 27,
    truckId: '15ft',
    targetDwelling: '1-2_bed',
    visualHook: '2 Bedroom Apartment Layout with full living room set and dining table.',
    dimensions: {
      lengthInches: 192,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "16'0\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 33,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 800,
      usableVolumeCuFt: 656,
      maxPayloadLbs: 4300,
      hasAttic: false,
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '2-Bedroom Apartment / Condo',
      roomsLabel: '2 Bedrooms, Living Room, Dining Room',
      boxKitRecommendation: '60-Piece 2-Bedroom Moving Kit',
      boxCountTotal: 60,
    },
    brandComparisons: [
      {
        brand: 'Budget',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'7\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'U-Haul',
        sizeName: "15' Truck (Closest)",
        volumeCuFt: 764,
        usableCuFt: 626,
        interiorDims: "15'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 6385,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '15ft-truck', label: "15' Box Truck" },
      next: { slug: '20ft-truck', label: "20' Box Truck" },
    },
    inContentNotes: [
      'The 16-foot box truck is the core medium-duty workhorse of both the Budget and Penske commercial fleets.',
      'Features flat cargo floor without over-cab attic, providing continuous ceiling clearance from cab to roll-up door.',
    ],
  },

  '20ft-truck': {
    slug: '20ft-truck',
    canonicalSlug: '20ft-truck',
    isBrandFlanking: false,
    title: "20-Ft Box Truck Dimensions & Payload Specs | TruckSizer",
    h1: "20' Box Truck Dimensions, Interior Specs & Load Capacity",
    metaDescription:
      "Exact 20-ft moving truck dimensions: 240″ length, 92″ width, 86″ height, 1,016 cu ft interior volume. View 2.5D visual load plan for 2-3 bedroom homes.",
    primaryKeyword: '20 f truck',
    monthlyVolume: 2100,
    keywordDifficulty: 25,
    truckId: '20ft',
    targetDwelling: '3+_bed',
    visualHook: '2-3 Bedroom House load plan with King Bed, Queen Bed, 2 Sofas, and 75+ boxes.',
    dimensions: {
      lengthInches: 240,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "20'0\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 35,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 1016,
      usableVolumeCuFt: 833,
      maxPayloadLbs: 5700,
      hasAttic: true,
      atticDims: "36″L × 76″W × 30″H (48 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '2 to 3-Bedroom Single Family Home',
      roomsLabel: '3 Bedrooms, Formal Dining, Living, Patio',
      boxKitRecommendation: '85-Piece 3-Bedroom Moving Box Kit',
      boxCountTotal: 85,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "20' Truck",
        volumeCuFt: 1016,
        usableCuFt: 833,
        interiorDims: "19'6\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 5700,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "26' Truck (Budget skips 20')",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'0\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '8-10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "22' Truck (Closest)",
        volumeCuFt: 1200,
        usableCuFt: 984,
        interiorDims: "21'11\" × 8'0\" × 7'8\"",
        maxPayloadLbs: 6500,
        deckHeightInches: 36,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '16ft-truck', label: "16' Box Truck" },
      next: { slug: '26ft-truck', label: "26' Box Truck" },
    },
    inContentNotes: [
      "The 20-foot truck is a critical missing tier in Budget's fleet, making U-Haul the primary provider of this intermediate size class.",
      'Equipped with heavy-duty disc brakes and dual rear wheels for highway stability when fully loaded to 5,700 lbs payload.',
    ],
  },

  '26ft-truck': {
    slug: '26ft-truck',
    canonicalSlug: '26ft-truck',
    isBrandFlanking: false,
    title: "26-Ft Box Truck Dimensions & Super Mover Specs | TruckSizer",
    h1: "26' Box Truck Dimensions, Floor Space & Payload Specs",
    metaDescription:
      "Exact 26-foot commercial box truck interior dimensions: 312″ length, 98″ width, 99″ height, 1,682 cu ft volume. View 2.5D visual load plan for 3-5 bedroom homes.",
    primaryKeyword: '26 f truck',
    monthlyVolume: 1900,
    keywordDifficulty: 25,
    truckId: '26ft',
    targetDwelling: '3+_bed',
    visualHook: '3-5 Bedroom Full Family Residence with 100+ boxes, appliances, and patio sets.',
    dimensions: {
      lengthInches: 312,
      widthInches: 98,
      heightInches: 99,
      lengthFeet: "26'0\"",
      widthFeet: "8'2\"",
      heightFeet: "8'3\"",
      deckHeightInches: 38,
      doorRollupWidthInches: 82,
      doorRollupHeightInches: 81,
      grossVolumeCuFt: 1682,
      usableVolumeCuFt: 1379,
      maxPayloadLbs: 9010,
      hasAttic: true,
      atticDims: "36″L × 82″W × 32″H (55 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '3 to 5-Bedroom Full Family Residence',
      roomsLabel: '4-5 Bedrooms, Living, Den, Garage, Patio',
      boxKitRecommendation: '120-Piece Mega Home Moving Box Kit',
      boxCountTotal: 120,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "26' Super Mover",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'5\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 9010,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "26' Truck",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'0\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '8-10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "26' Truck",
        volumeCuFt: 1700,
        usableCuFt: 1394,
        interiorDims: "25'11\" × 8'0\" × 8'2\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '20ft-truck', label: "20' Box Truck" },
    },
    inContentNotes: [
      'The largest moving vehicle operable with a standard Class D passenger driver license in all 50 US states.',
      'Features a wide 2.5-foot aluminum ramp capable of supporting 1,000 lbs rolling load for heavy hand-trucks and piano dollies.',
    ],
  },

  // -------------------------------------------------------------------------
  // CLUSTER B: High-Reward Brand Flanking Pages (U-Haul Fleet Specs)
  // -------------------------------------------------------------------------
  '10ft-uhaul-specs': {
    slug: '10ft-uhaul-specs',
    canonicalSlug: '10ft-uhaul-specs',
    isBrandFlanking: true,
    brand: 'u-haul',
    title: "U-Haul 10-Foot Truck Dimensions & Loading Capacity | TruckSizer",
    h1: "U-Haul 10' Moving Truck Interior Dimensions & Specs",
    metaDescription:
      "Exact U-Haul 10ft truck dimensions: 119″L × 76″W × 74″H (402 cu ft). Compare with cargo vans, view 2.5D visual fit simulation, and check competitor rates.",
    primaryKeyword: 'uhaul 10 foot truck',
    monthlyVolume: 2400,
    keywordDifficulty: 35,
    truckId: '10ft',
    targetDwelling: 'studio',
    visualHook: "10' Truck specs + Cargo Van alternative comparison with Queen Bed fit verification.",
    dimensions: {
      lengthInches: 119,
      widthInches: 76,
      heightInches: 74,
      lengthFeet: "9'11\"",
      widthFeet: "6'4\"",
      heightFeet: "6'2\"",
      deckHeightInches: 29,
      doorRollupWidthInches: 67,
      doorRollupHeightInches: 71,
      grossVolumeCuFt: 402,
      usableVolumeCuFt: 330,
      maxPayloadLbs: 2810,
      hasAttic: false,
      loadingRamp: false,
    },
    recommendedInventory: {
      dwellingLabel: 'Studio / 1-Room Dormitory',
      roomsLabel: 'Queen Bed, Loveseat, TV Stand, Boxes',
      boxKitRecommendation: '27-Piece Studio Kit',
      boxCountTotal: 27,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "10' Truck",
        volumeCuFt: 402,
        usableCuFt: 330,
        interiorDims: "9'11\" × 6'4\" × 6'2\"",
        maxPayloadLbs: 2810,
        deckHeightInches: 29,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
      {
        brand: 'U-Haul',
        sizeName: 'Cargo Van (Alternative)',
        volumeCuFt: 246,
        usableCuFt: 201,
        interiorDims: "9'6\" × 5'7\" × 4'7\"",
        maxPayloadLbs: 3880,
        deckHeightInches: 28,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '18 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "12' Box Truck",
        volumeCuFt: 450,
        usableCuFt: 369,
        interiorDims: "11'6\" × 6'6\" × 6'2\"",
        maxPayloadLbs: 3100,
        deckHeightInches: 31,
        rampIncluded: false,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      next: { slug: '15ft-uhaul-specs', label: "U-Haul 15' Truck Specs" },
    },
    inContentNotes: [
      "The U-Haul 10ft truck does not have an over-cab Mom's Attic shelf or a loading ramp due to its ultra-low 29\" deck height.",
      'Compare carefully with the 9ft cargo van: the 10ft truck offers 63% more cubic volume and 19 more inches of vertical standing clearance.',
    ],
  },

  '15ft-uhaul-specs': {
    slug: '15ft-uhaul-specs',
    canonicalSlug: '15ft-uhaul-specs',
    isBrandFlanking: true,
    brand: 'u-haul',
    title: "U-Haul 15-Foot Truck Dimensions & Mom's Attic Specs | TruckSizer",
    h1: "U-Haul 15' Moving Truck Interior Dimensions & Specs",
    metaDescription:
      "Exact U-Haul 15ft truck dimensions: 180″L × 92″W × 86″H (764 cu ft). View Mom's Attic shelf simulation, 2.5D visual fit plan, and save 15-20% on competitor rates.",
    primaryKeyword: '15 f uhaul',
    monthlyVolume: 2180,
    keywordDifficulty: 26,
    truckId: '15ft',
    targetDwelling: '1-2_bed',
    visualHook: "15' Truck specs + Mom's Attic shelf simulation with fragile box packing tiers.",
    dimensions: {
      lengthInches: 180,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "15'0\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 33,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 764,
      usableVolumeCuFt: 626,
      maxPayloadLbs: 6385,
      hasAttic: true,
      atticDims: "36″L × 76″W × 30″H (48 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '1 to 2-Bedroom Apartment',
      roomsLabel: 'Queen Bed, Sofa, Dining, 50+ Boxes',
      boxKitRecommendation: '55-Piece 2-Bedroom Kit',
      boxCountTotal: 55,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "15' Truck",
        volumeCuFt: 764,
        usableCuFt: 626,
        interiorDims: "15'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 6385,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 33,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "16' Truck",
        volumeCuFt: 800,
        usableCuFt: 656,
        interiorDims: "16'0\" × 7'7\" × 7'2\"",
        maxPayloadLbs: 4300,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '12 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '10ft-uhaul-specs', label: "U-Haul 10' Specs" },
      next: { slug: '20ft-uhaul-specs', label: "U-Haul 20' Specs" },
    },
    inContentNotes: [
      "The U-Haul 15-foot truck includes Mom's Attic (36″ deep × 76″ wide × 30″ high), specifically engineered for lightweight fragile boxes and wardrobe cartons.",
      'Budget and Penske 16-foot trucks provide 36 more cubic feet of continuous flat deck space without an attic compartment.',
    ],
  },

  '20ft-uhaul-specs': {
    slug: '20ft-uhaul-specs',
    canonicalSlug: '20ft-uhaul-specs',
    isBrandFlanking: true,
    brand: 'u-haul',
    title: "U-Haul 20-Foot Truck Dimensions & Capacity Guide | TruckSizer",
    h1: "U-Haul 20' Moving Truck Interior Dimensions & Specs",
    metaDescription:
      "Exact U-Haul 20ft truck specs: 240″ length, 92″ width, 86″ height, 1,016 cu ft volume. View 2-3 bedroom 2.5D visual load model and compare rental rates.",
    primaryKeyword: 'uhaul 20 foot truck',
    monthlyVolume: 1300,
    keywordDifficulty: 37,
    truckId: '20ft',
    targetDwelling: '3+_bed',
    visualHook: "20' Truck specs + 2-3 Bedroom furniture load with King Bed & sectional sofa.",
    dimensions: {
      lengthInches: 240,
      widthInches: 92,
      heightInches: 86,
      lengthFeet: "19'6\"",
      widthFeet: "7'8\"",
      heightFeet: "7'2\"",
      deckHeightInches: 35,
      doorRollupWidthInches: 73,
      doorRollupHeightInches: 75,
      grossVolumeCuFt: 1016,
      usableVolumeCuFt: 833,
      maxPayloadLbs: 5700,
      hasAttic: true,
      atticDims: "36″L × 76″W × 30″H (48 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '2 to 3-Bedroom Home',
      roomsLabel: '3 Bedrooms, Living Room, Dining, Patio',
      boxKitRecommendation: '85-Piece 3-Bedroom Moving Box Kit',
      boxCountTotal: 85,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "20' Truck",
        volumeCuFt: 1016,
        usableCuFt: 833,
        interiorDims: "19'6\" × 7'8\" × 7'2\"",
        maxPayloadLbs: 5700,
        deckHeightInches: 35,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "22' Truck",
        volumeCuFt: 1200,
        usableCuFt: 984,
        interiorDims: "21'11\" × 8'0\" × 7'8\"",
        maxPayloadLbs: 6500,
        deckHeightInches: 36,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "26' Truck",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'0\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '8-10 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '15ft-uhaul-specs', label: "U-Haul 15' Specs" },
      next: { slug: '26ft-uhaul-specs', label: "U-Haul 26' Specs" },
    },
    inContentNotes: [
      'The 20ft U-Haul features dual mirrors with convex spotters, low-deck suspension, and a patented wide loading ramp.',
      'Gross vehicle weight rating (GVWR) is under 26,000 lbs, allowing cross-country interstate operation without commercial permits.',
    ],
  },

  '26ft-uhaul-specs': {
    slug: '26ft-uhaul-specs',
    canonicalSlug: '26ft-uhaul-specs',
    isBrandFlanking: true,
    brand: 'u-haul',
    title: "U-Haul 26-Foot Truck Dimensions & Super Mover Specs | TruckSizer",
    h1: "U-Haul 26' Super Mover Interior Dimensions & Specs",
    metaDescription:
      "Exact U-Haul 26ft truck specs: 312″ length, 98″ width, 99″ height, 1,682 cu ft volume. View 2.5D visual ramp loading simulation and compare rental prices.",
    primaryKeyword: '26 f uhaul',
    monthlyVolume: 1760,
    keywordDifficulty: 32,
    truckId: '26ft',
    targetDwelling: '3+_bed',
    visualHook: "26' Super Mover specs + Ramp loading simulation with full family home inventory.",
    dimensions: {
      lengthInches: 312,
      widthInches: 98,
      heightInches: 99,
      lengthFeet: "26'5\"",
      widthFeet: "8'2\"",
      heightFeet: "8'3\"",
      deckHeightInches: 38,
      doorRollupWidthInches: 82,
      doorRollupHeightInches: 81,
      grossVolumeCuFt: 1682,
      usableVolumeCuFt: 1379,
      maxPayloadLbs: 9010,
      hasAttic: true,
      atticDims: "36″L × 82″W × 32″H (55 cu ft)",
      loadingRamp: true,
    },
    recommendedInventory: {
      dwellingLabel: '4 to 5-Bedroom Large Residence',
      roomsLabel: '4-5 Bedrooms, Formal Dining, Living, Patio',
      boxKitRecommendation: '120-Piece Mega Home Moving Box Kit',
      boxCountTotal: 120,
    },
    brandComparisons: [
      {
        brand: 'U-Haul',
        sizeName: "26' Super Mover",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'5\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 9010,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: true,
        estFuelEconomyMpg: '10 mpg',
      },
      {
        brand: 'Budget',
        sizeName: "26' Truck",
        volumeCuFt: 1682,
        usableCuFt: 1379,
        interiorDims: "26'0\" × 8'2\" × 8'3\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '8-10 mpg',
      },
      {
        brand: 'Penske',
        sizeName: "26' Truck",
        volumeCuFt: 1700,
        usableCuFt: 1394,
        interiorDims: "25'11\" × 8'0\" × 8'2\"",
        maxPayloadLbs: 10000,
        deckHeightInches: 38,
        rampIncluded: true,
        momsAtticIncluded: false,
        estFuelEconomyMpg: '10 mpg',
      },
    ],
    adjacentSizes: {
      previous: { slug: '20ft-uhaul-specs', label: "U-Haul 20' Specs" },
    },
    inContentNotes: [
      'The largest moving vehicle in the U-Haul fleet. Holds up to 500 medium boxes or 4-5 rooms of large furniture.',
      'Features high-capacity towing hitch compatible with auto transports and trailers up to 7,500 lbs.',
    ],
  },
};

// Aliases for keyword variations matching manifest typos (e.g. 10f-truck -> 10ft-truck)
export const DIMENSION_ALIASES: Record<string, string> = {
  '10f-truck': '10ft-truck',
  '12f-truck': '12ft-truck',
  '15f-truck': '15ft-truck',
  '16f-truck': '16ft-truck',
  '20f-truck': '20ft-truck',
  '26f-truck': '26ft-truck',
  '10f-uhaul-specs': '10ft-uhaul-specs',
  '15f-uhaul-specs': '15ft-uhaul-specs',
  '20f-uhaul-specs': '20ft-uhaul-specs',
  '26f-uhaul-specs': '26ft-uhaul-specs',
};

export function getDimensionSpec(rawSlug: string): DimensionSpec | null {
  const normalized = rawSlug.toLowerCase().trim();
  const canonical = DIMENSION_ALIASES[normalized] || normalized;
  const spec = DIMENSION_SPECS[canonical];
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

export function getAllDimensionSlugs(): string[] {
  const canonicals = Object.keys(DIMENSION_SPECS);
  const aliases = Object.keys(DIMENSION_ALIASES);
  return Array.from(new Set([...canonicals, ...aliases]));
}

export function getCanonicalDimensionSlugs(): string[] {
  return Object.keys(DIMENSION_SPECS);
}
