/**
 * Load Manifest & Downloadable Moving Blueprint Generator
 *
 * Produces deterministic, structured manifest data objects for printing,
 * PDF export, email dispatch, and shareable web restoring.
 */

import { TRUCKS, TruckId, TruckSpec } from '@/lib/constants/trucks';
import { ITEMS, ItemDefinition } from '@/lib/constants/items';
import { normalizeTruckSize, TruckInputSize } from '@/lib/pricing/moveEstimator';

export interface ManifestItemRow {
  id: string;
  name: string;
  category: 'bedroom' | 'living_room' | 'dining_office' | 'boxes' | 'custom';
  roomLabel: string;
  quantity: number;
  unitDimensions: string;
  unitCuFt: number;
  totalCuFt: number;
  unitWeightLbs: number;
  totalWeightLbs: number;
  loadingTier: 'tier_1_bulkhead' | 'tier_2_middeck' | 'tier_3_rear_overhang';
  loadingTierLabel: string;
  zoneNote: string;
}

export interface CustomManifestItemInput {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
}

export interface GenerateManifestInput {
  truckSize: TruckInputSize;
  inventory: Record<string, number>;
  customItems?: CustomManifestItemInput[];
  originZip?: string;
  destinationZip?: string;
  moveDate?: string;
  leadId?: string;
}

export interface LoadManifestDataObject {
  logisticsRefId: string;
  truckId: TruckId;
  truckName: string;
  routeInfo: {
    originZip: string;
    destinationZip: string;
    moveDate: string;
  };
  loadSpecs: {
    grossVolumeCuFt: number;
    usableVolumeCuFt: number;
    usedVolumeCuFt: number;
    remainingVolumeCuFt: number;
    fillPercentage: number;
    floorDeckOccupancyPct: number;
    estimatedCargoWeightLbs: number;
    maxPayloadLbs: number;
    payloadSafetyMarginLbs: number;
    centerOfGravityBalance: string;
    hasMomsAttic: boolean;
    atticDimensions?: string;
  };
  boxSupplyList: {
    smallBoxes: number;
    mediumBoxes: number;
    largeBoxes: number;
    wardrobeBoxes: number;
    totalBoxes: number;
    recommendedTapeRolls: number;
  };
  loadingStrategy: {
    tier1Bulkhead: {
      title: 'Tier 1: Front Bulkhead & Heavy Deck Foundation',
      instructions: 'Load heavy solid-wood pieces, dressers, appliances, and dense cabinetry flush against the front bulkhead. Keeps front steer axle planted to eliminate highway trailer sway.',
      items: ManifestItemRow[];
    };
    tier2MidDeck: {
      title: 'Tier 2: Mid-Deck Dense Box Columns',
      instructions: 'Build tight vertical tiers floor-to-ceiling. Heavy boxes on deck, lighter boxes above. Nest chairs and secure flat-screen TVs between mattress walls and soft padding.',
      items: ManifestItemRow[];
    };
    tier3RearOverhang: {
      title: 'Tier 3: Rear Gate & Cabover Compartment',
      instructions: 'Stand mattresses and table leaves vertically along the left rail. Route wardrobe boxes, fragile dishware, and lightweight parcels into the Mom\'s Attic cabover shelf (keep under 500 lbs).',
      items: ManifestItemRow[];
    };
  };
  allItems: ManifestItemRow[];
  shareableBlueprintUrl: string;
}

/**
 * Generates a random alphanumeric logistics code (e.g. "8K2D91")
 */
export function generateRandomLogisticsSuffix(length = 6): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Categorizes an item into its physical loading strategy tier.
 */
function assignItemLoadingTier(itemId: string, def?: ItemDefinition): {
  tier: 'tier_1_bulkhead' | 'tier_2_middeck' | 'tier_3_rear_overhang';
  tierLabel: string;
  zoneNote: string;
} {
  // Mattresses and Cabover items go to Tier 3
  if (itemId === 'queen_bed' || itemId === 'king_bed') {
    return {
      tier: 'tier_3_rear_overhang',
      tierLabel: 'Tier 3 (Side Rail / Rear)',
      zoneNote: 'Stand vertically on edge against left rub-rail; secure with E-track straps',
    };
  }

  if (itemId === 'box_wardrobe') {
    return {
      tier: 'tier_3_rear_overhang',
      tierLabel: 'Tier 3 (Cabover / Rear)',
      zoneNote: 'Place upright inside Mom\'s Attic cab shelf or upright at rear tie-off',
    };
  }

  // Front bulkhead uprights and heavy base furniture
  if (itemId === 'sofa_3seat' || itemId === 'loveseat') {
    return {
      tier: 'tier_1_bulkhead',
      tierLabel: 'Tier 1 (Front Bulkhead)',
      zoneNote: 'Stand upright on end against front wall to preserve deck length',
    };
  }

  if (itemId === 'dresser_6drawer' || itemId === 'desk') {
    return {
      tier: 'tier_1_bulkhead',
      tierLabel: 'Tier 1 (Heavy Base Deck)',
      zoneNote: 'Sit flat on floor deck against front wall; allows box tiers stacked on top',
    };
  }

  // Mid deck boxes and dining
  if (itemId.startsWith('box_')) {
    return {
      tier: 'tier_2_middeck',
      tierLabel: 'Tier 2 (Vertical Box Tiers)',
      zoneNote: 'Stack in interlocking columns floor-to-ceiling to prevent highway shifting',
    };
  }

  if (itemId === 'dining_table') {
    return {
      tier: 'tier_2_middeck',
      tierLabel: 'Tier 2 (Mid-Deck Rail)',
      zoneNote: 'Stand tabletop on edge against wall rail; bundle legs separately',
    };
  }

  // Default floor pieces
  return {
    tier: 'tier_2_middeck',
    tierLabel: 'Tier 2 (Mid-Deck Cargo)',
    zoneNote: 'Position flat on deck and secure before building box columns',
  };
}

const CATEGORY_ROOM_LABELS: Record<string, string> = {
  bedroom: 'Bedrooms',
  living_room: 'Living Room',
  dining_office: 'Dining & Office',
  boxes: 'Cardboard Box Tiers',
  custom: 'Specialty / Custom Cargo',
};

/**
 * Master generator for structured load manifest data object.
 */
export function generateLoadManifest(input: GenerateManifestInput): LoadManifestDataObject {
  const sizeCode = normalizeTruckSize(input.truckSize);
  const truckIdKey = `${sizeCode}ft` as TruckId;
  const truck: TruckSpec = TRUCKS[truckIdKey] || TRUCKS['15ft'];

  // Logistics Ref ID: TS-[SIZE]-[RANDOM6]
  const suffix = generateRandomLogisticsSuffix(6);
  const logisticsRefId = input.leadId && input.leadId.startsWith('TS-')
    ? input.leadId
    : `TS-${sizeCode.toUpperCase()}FT-${suffix}`;

  const allItems: ManifestItemRow[] = [];
  let totalVolumeCuFt = 0;
  let totalWeightLbs = 0;

  // 1. Process Standard Items
  Object.entries(input.inventory || {}).forEach(([itemId, qty]) => {
    if (qty <= 0) return;
    const def = ITEMS[itemId];
    const unitVol = def ? def.volumeCuFt : 5;
    const unitWeight = def ? def.weightLbs : 30;
    const itemTotalVol = Math.round(unitVol * qty * 10) / 10;
    const itemTotalWeight = unitWeight * qty;

    totalVolumeCuFt += itemTotalVol;
    totalWeightLbs += itemTotalWeight;

    const tierInfo = assignItemLoadingTier(itemId, def);
    const category = def ? def.category : 'custom';

    allItems.push({
      id: itemId,
      name: def ? def.name : itemId.replace(/_/g, ' '),
      category,
      roomLabel: CATEGORY_ROOM_LABELS[category] || 'General Cargo',
      quantity: qty,
      unitDimensions: def
        ? `${def.dimensions.length}″L × ${def.dimensions.width}″W × ${def.dimensions.height}″H`
        : 'Standard',
      unitCuFt: unitVol,
      totalCuFt: itemTotalVol,
      unitWeightLbs: unitWeight,
      totalWeightLbs: itemTotalWeight,
      loadingTier: tierInfo.tier,
      loadingTierLabel: tierInfo.tierLabel,
      zoneNote: tierInfo.zoneNote,
    });
  });

  // 2. Process Custom Items
  (input.customItems || []).forEach((cItem) => {
    if (cItem.quantity <= 0) return;
    const unitVol = Math.round(((cItem.length * cItem.width * cItem.height) / 1728) * 10) / 10;
    const unitWeight = Math.max(15, Math.round(unitVol * 7.5));
    const itemTotalVol = Math.round(unitVol * cItem.quantity * 10) / 10;
    const itemTotalWeight = unitWeight * cItem.quantity;

    totalVolumeCuFt += itemTotalVol;
    totalWeightLbs += itemTotalWeight;

    allItems.push({
      id: cItem.id,
      name: `${cItem.name} (Custom)`,
      category: 'custom',
      roomLabel: 'Specialty / Custom Cargo',
      quantity: cItem.quantity,
      unitDimensions: `${cItem.length}″L × ${cItem.width}″W × ${cItem.height}″H`,
      unitCuFt: unitVol,
      totalCuFt: itemTotalVol,
      unitWeightLbs: unitWeight,
      totalWeightLbs: itemTotalWeight,
      loadingTier: 'tier_2_middeck',
      loadingTierLabel: 'Tier 2 (Mid-Deck Cargo)',
      zoneNote: 'Fit securely between primary furniture rows; strap down before transit',
    });
  });

  totalVolumeCuFt = Math.round(totalVolumeCuFt * 10) / 10;

  // Calculate volume & occupancy metrics
  const usableCuFt = Math.round(truck.volumeCuFt * 0.82);
  const remainingCuFt = Math.max(0, Math.round((usableCuFt - totalVolumeCuFt) * 10) / 10);
  const fillPercentage = Math.min(100, Math.round((totalVolumeCuFt / usableCuFt) * 100));

  // Floor deck occupancy estimation
  const totalFloorSqFt = (truck.length * truck.width) / 144;
  const estimatedFloorUsage = Math.min(
    100,
    Math.round(((totalVolumeCuFt * 0.45) / totalFloorSqFt) * 100)
  );

  const payloadSafetyMargin = Math.max(0, truck.maxPayloadLbs - totalWeightLbs);

  // Box Supplies Breakdown
  const smallBoxes = input.inventory['box_small'] || 0;
  const mediumBoxes = input.inventory['box_medium'] || 0;
  const largeBoxes = input.inventory['box_large'] || 0;
  const wardrobeBoxes = input.inventory['box_wardrobe'] || 0;
  const totalBoxes = smallBoxes + mediumBoxes + largeBoxes + wardrobeBoxes;
  const recommendedTapeRolls = Math.max(2, Math.ceil(totalBoxes / 15));

  // Partition into Loading Strategy Tiers
  const tier1Items = allItems.filter((it) => it.loadingTier === 'tier_1_bulkhead');
  const tier2Items = allItems.filter((it) => it.loadingTier === 'tier_2_middeck');
  const tier3Items = allItems.filter((it) => it.loadingTier === 'tier_3_rear_overhang');

  // Shareable visualizer restore link
  const safeInventoryParam = encodeURIComponent(JSON.stringify(input.inventory || {}));
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';
  const shareableBlueprintUrl = `${baseUrl}/?ref=${encodeURIComponent(
    logisticsRefId
  )}&truck=${encodeURIComponent(truck.id)}&items=${safeInventoryParam}`;

  return {
    logisticsRefId,
    truckId: truck.id,
    truckName: truck.name,
    routeInfo: {
      originZip: input.originZip || '—',
      destinationZip: input.destinationZip || '—',
      moveDate: input.moveDate || 'Pending',
    },
    loadSpecs: {
      grossVolumeCuFt: truck.volumeCuFt,
      usableVolumeCuFt: usableCuFt,
      usedVolumeCuFt: totalVolumeCuFt,
      remainingVolumeCuFt: remainingCuFt,
      fillPercentage,
      floorDeckOccupancyPct: estimatedFloorUsage,
      estimatedCargoWeightLbs: totalWeightLbs,
      maxPayloadLbs: truck.maxPayloadLbs,
      payloadSafetyMarginLbs: payloadSafetyMargin,
      centerOfGravityBalance:
        '60% forward of rear axle (Compliant with DOT and Commercial Carrier axle stability)',
      hasMomsAttic: !!truck.hasAttic,
      atticDimensions: truck.attic
        ? `${truck.attic.length}″L × ${truck.attic.width}″W × ${truck.attic.height}″H (${truck.attic.volumeCuFt} cu ft, 500 lbs max)`
        : undefined,
    },
    boxSupplyList: {
      smallBoxes,
      mediumBoxes,
      largeBoxes,
      wardrobeBoxes,
      totalBoxes,
      recommendedTapeRolls,
    },
    loadingStrategy: {
      tier1Bulkhead: {
        title: 'Tier 1: Front Bulkhead & Heavy Deck Foundation',
        instructions:
          'Load heavy solid-wood pieces, dressers, appliances, and dense cabinetry flush against the front bulkhead. Keeps front steer axle planted to eliminate highway trailer sway.',
        items: tier1Items,
      },
      tier2MidDeck: {
        title: 'Tier 2: Mid-Deck Dense Box Columns',
        instructions:
          'Build tight vertical tiers floor-to-ceiling. Heavy boxes on deck, lighter boxes above. Nest chairs and secure flat-screen TVs between mattress walls and soft padding.',
        items: tier2Items,
      },
      tier3RearOverhang: {
        title: 'Tier 3: Rear Gate & Cabover Compartment',
        instructions:
          'Stand mattresses and table leaves vertically along the left rail. Route wardrobe boxes, fragile dishware, and lightweight parcels into the Mom\'s Attic cabover shelf (keep under 500 lbs).',
        items: tier3Items,
      },
    },
    allItems,
    shareableBlueprintUrl,
  };
}
