import { TruckId } from '../constants/trucks';
import { PresetId } from '../constants/presets';

export interface LoadingPhase {
  phaseNumber: number;
  title: string;
  subtitle: string;
  description: string;
  zone: 'bulkhead' | 'wall_left' | 'floor' | 'attic' | 'tailgate';
  keyRules: string[];
  recommendedItems: string[];
  visualCallout: string;
  safetyWarning?: string;
}

export interface HowToPackGuide {
  slug: string;
  canonicalSlug: string;
  title: string;
  h1: string;
  metaDescription: string;
  primaryKeyword: string;
  monthlyVolume: number;
  keywordDifficulty: number;
  defaultTruckId: TruckId;
  defaultPresetId: PresetId;
  overview: string;
  proTips: string[];
  equipmentChecklist: {
    item: string;
    recommendedQty: string;
    purpose: string;
  }[];
  phases: LoadingPhase[];
  weightDistributionRule: string;
  faqList: { question: string; answer: string }[];
}

export const HOW_TO_PACK_GUIDES: Record<string, HowToPackGuide> = {
  'moving-truck': {
    slug: 'moving-truck',
    canonicalSlug: 'moving-truck',
    title: 'How to Pack a Moving Truck Like a Pro (2.5D Step-by-Step Guide)',
    h1: 'How to Pack a Moving Truck: The 4-Phase Professional Guide',
    metaDescription: 'Step-by-step visual blueprint for loading a moving truck. Learn 60/40 weight distribution, tier packing, and how to maximize every cubic foot with our 2.5D visualizer.',
    primaryKeyword: 'how to pack a moving truck',
    monthlyVolume: 2170,
    keywordDifficulty: 24,
    defaultTruckId: '15ft',
    defaultPresetId: '1-2_bed',
    overview: 'Loading a moving truck correctly is the difference between an effortless move and shattered furniture or dangerous highway fishtailing. Professional van lines adhere to a strict 4-Phase tier-loading methodology: placing the heaviest items forward against the front bulkhead to achieve a 60/40 weight distribution, locking vertical items against side rails, and building uniform floor-to-ceiling box tiers that prevent cargo shifting.',
    weightDistributionRule: '60/40 Rule: 60% of total cargo weight must be positioned in the front half of the truck bed (closest to the cab), with the remaining 40% distributed evenly over the rear axle. Never load heavy appliances or solid oak furniture at the rear tailgate.',
    equipmentChecklist: [
      { item: 'Forearm Forklift / Shoulder Dolly Straps', recommendedQty: '1 pair', purpose: 'Lifting heavy appliances and 3-seat sofas upright without back strain.' },
      { item: 'Quilted Moving Blankets (Pads)', recommendedQty: '12-24 pads', purpose: 'Preventing rub friction and gouges between wooden furniture and aluminum walls.' },
      { item: 'Ratchet Tie-Down Straps (15ft+)', recommendedQty: '4-6 straps', purpose: 'Locking each completed tier into the truck bed E-track wooden tie rails.' },
      { item: 'Heavy-Duty Stretch Plastic Wrap (18" roll)', recommendedQty: '2 rolls', purpose: 'Securing dresser drawers shut and binding sofa cushions and blankets.' },
      { item: 'Appliance Hand Truck / 2-Wheel Dolly', recommendedQty: '1 dolly', purpose: 'Rolling refrigerators, washers, and stacked box columns smoothly up the loading ramp.' }
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Phase 1: The Front Bulkhead & Heavy Anchors',
        subtitle: 'Secure the forward wall with your heaviest, densest appliances and uprights',
        description: 'Begin loading directly against the front bulkhead wall behind the cab. Stand heavy appliances (refrigerators, washers, dryers) and 3-seat sofas upright on end. Standing sofas vertically utilizes 84 inches of vertical clearance while consuming only 35 inches of truck length.',
        zone: 'bulkhead',
        keyRules: [
          'Stand 3-seat sofas vertically on end with heavy blankets protecting armrests.',
          'Keep heavy appliances centered side-to-side to preserve highway vehicle balance.',
          'Rope or ratchet-strap Phase 1 completely to the front tie-rails before adding loose items.'
        ],
        recommendedItems: ['3-Seat Sofas (Vertical)', 'Refrigerators', 'Washing Machines', 'Heavy Armoires'],
        visualCallout: 'Visualized in deep navy and blue against the front bulkhead in the 2.5D visualizer.',
        safetyWarning: 'Never place appliances or upright sofas at the rear roll-up door; shifting weight causes high-speed trailer sway.'
      },
      {
        phaseNumber: 2,
        title: 'Phase 2: Side-Wall Rail Sandwiching',
        subtitle: 'Stand mattresses, box springs, and large tabletops on edge along the left wall',
        description: 'Flat, long items consume immense floor area if laid horizontal. Stand mattresses, box springs, headboards, dining tabletops, and large mirrors vertically on edge along the driver-side truck wall (Z = 0). They act as a smooth structural side wall.',
        zone: 'wall_left',
        keyRules: [
          'Encase mattresses in sealed plastic mattress bags before loading.',
          'Stand queen and king mattresses on edge lengthwise against the left wall.',
          'Sandwich delicate dining tabletops and glass mirrors between mattresses and box springs for natural shock absorption.'
        ],
        recommendedItems: ['King & Queen Mattresses', 'Box Springs', 'Dining Table Tops (Legs detached)', 'Full-Length Mirrors'],
        visualCallout: 'Represented by the purple vertical slabs locked along the left wall of the interactive canvas.'
      },
      {
        phaseNumber: 3,
        title: 'Phase 3: Base Furniture & Dense Box Tiers',
        subtitle: 'Build interlocking floor-to-ceiling tiers moving systematically from front to back',
        description: 'Pack in vertical slices (tiers) from the front of the truck toward the roll-up door. Lay sturdy dressers, credenzas, and desks flat on the floor deck (Y = 0). Then stack dense cardboard boxes directly on top of them up to the ceiling, placing heaviest small book boxes at the bottom and lighter pillows/linens near the roof.',
        zone: 'floor',
        keyRules: [
          'Never leave hollow voids beneath furniture; fill underneath tables and chair gaps with small boxes.',
          'Stack box columns bricklayer-style or in matched size columns to prevent tipping.',
          'Rachet strap each completed vertical tier every 3 to 4 feet along the truck rails.'
        ],
        recommendedItems: ['6-Drawer Dressers', 'Desks & Credenzas', 'Small Heavy Book Boxes', 'Medium Kitchen Boxes', 'Large Lightweight Boxes'],
        visualCallout: 'See how dressers anchor the deck while box columns stack neatly 3 to 4 high in the canvas view.'
      },
      {
        phaseNumber: 4,
        title: 'Phase 4: Mom\'s Attic & Fragile Tailgate Loading',
        subtitle: 'Elevated cab shelf storage and essential first-night tailgate parcels',
        description: 'Utilize the elevated cab-over compartment (Mom\'s Attic) on 15ft, 20ft, and 26ft trucks for fragile items, electronics, and wardrobe boxes that cannot withstand heavy cargo pressure. Load your "Day One" essentials box and vacuum cleaner last at the rear roll-up door.',
        zone: 'attic',
        keyRules: [
          'Place wardrobe boxes, fragile dishware, and flat-screen TVs (boxed) in Mom\'s Attic.',
          'Never place heavy cast iron, toolboxes, or solid weights in Mom\'s Attic as it raises the vehicle center of gravity.',
          'Load moving blankets and ratchet straps last so they are immediately accessible.'
        ],
        recommendedItems: ['Wardrobe Boxes (Hanging clothes)', 'Fragile Stereo/Electronics', 'Bedding & Pillows', 'Day-1 Open First Box'],
        visualCallout: 'Inspect the gold elevated platform above the truck cab in the 2.5D visualizer for dedicated attic storage.'
      }
    ],
    proTips: [
      'Roll rugs tightly, wrap in plastic, and slide them into the floor perimeter crevices alongside mattress foundations.',
      'Take photos of electronic wire setups before unplugging, and pack remote controls in labelled zip-top bags taped to the back of each device.',
      'Disassemble bed frames completely; tape the frame rails together and seal hardware bolts in a marked ziplock bag taped directly to the headboard.',
      'Always keep a 4-foot clear path down the center aisle while loading until the final box tiers are placed.'
    ],
    faqList: [
      {
        question: 'What should be loaded first into a moving truck?',
        answer: 'The heaviest and tallest items should always be loaded first directly against the front bulkhead wall behind the truck cab. This includes refrigerators, washers, dryers, and 3-seat sofas stood vertically on end.'
      },
      {
        question: 'How do you prevent items from shifting during transit?',
        answer: 'Pack the truck in tight vertical tiers from floor to ceiling, filling every void with soft bags or small boxes. Secure each tier to the wooden side E-track rails with heavy-duty ratchet straps before building the next tier.'
      },
      {
        question: 'What belongs in the Mom\'s Attic shelf above the cab?',
        answer: 'Mom\'s Attic is designed for fragile items, electronics, wardrobe boxes, linens, and delicate keepsakes. Never place heavy metal tools or cast iron in Mom\'s Attic, as excessive overhead weight compromises vehicle highway stability.'
      }
    ]
  },
  'furniture-loading': {
    slug: 'furniture-loading',
    canonicalSlug: 'furniture-loading',
    title: 'How to Load Furniture Onto a Moving Truck (Damage-Free Pro Blueprint)',
    h1: 'How to Load Heavy Furniture Onto a Moving Truck',
    metaDescription: 'Master the physics of loading furniture without scratches or gouges. Pro guide on standing sofas upright, mattress wall-rail sandwiching, and deck anchoring.',
    primaryKeyword: 'how to load furniture onto truck',
    monthlyVolume: 260,
    keywordDifficulty: 25,
    defaultTruckId: '15ft',
    defaultPresetId: '1-2_bed',
    overview: 'Furniture represents 70% of cargo volume and 90% of in-transit damage claims. Moving furniture safely requires understanding spatial geometry: disassembling modular components, standing long seating upright on end, locking wide flat panels against vertical rub-rails, and wrapping all finished surfaces in heavy quilted moving pads.',
    weightDistributionRule: 'Low Center of Gravity: Always anchor bulky wooden furniture (dressers, credenzas, sideboards) flat on the truck deck with heavy bases touching the floor. Never stack heavy wooden furniture on top of cardboard boxes.',
    equipmentChecklist: [
      { item: 'Quilted Furniture Pads (72" x 80")', recommendedQty: '24 pads', purpose: 'Fully encasing wood veneers, leather, and fabric upholstery from friction rub.' },
      { item: 'High-Tension Shrink Wrap', recommendedQty: '2 rolls', purpose: 'Binding furniture pads tightly around dressers and keeping drawers locked shut.' },
      { item: 'Furniture Sliders', recommendedQty: '8 sliders', purpose: 'Gliding heavy desks and credenzas effortlessly across hardwood floors onto ramps.' },
      { item: 'Heavy-Duty Ratchet Straps', recommendedQty: '4 straps', purpose: 'Tying furniture securely to the truck interior wooden rub rails.' }
    ],
    phases: [
      {
        phaseNumber: 1,
        title: 'Step 1: Upright Sofa & Couch Orientation',
        subtitle: 'Save up to 40 square feet of floor space by standing sofas on end',
        description: 'Standard 3-seat couches (84" long) consume massive floor space when laid flat. By standing them vertically on end against the front bulkhead or side wall, the couch consumes just 35" x 33" of floor footprint, utilizing vertical headroom up to 84 inches.',
        zone: 'bulkhead',
        keyRules: [
          'Remove all loose seat cushions and back pillows; pack cushions in clean wardrobe boxes.',
          'Unscrew sofa wooden/metal feet to prevent them from snapping or snagging truck rails.',
          'Wrap the entire couch in 2 to 3 quilted pads, securing firmly with plastic stretch wrap before standing.'
        ],
        recommendedItems: ['3-Seat Sofas', 'Sectional Wedge Pieces', 'Loveseats (Upright)', 'Recliners'],
        visualCallout: 'See upright sofa placement against the front wall in the 2.5D visualizer.'
      },
      {
        phaseNumber: 2,
        title: 'Step 2: Mattress & Tabletop Wall-Rail Sandwiching',
        subtitle: 'Lock flat panels into smooth, shock-absorbing perimeter walls',
        description: 'Dining tables, desks with removable legs, and bed foundations should be disassembled. Stand the flat wooden tabletops vertically along the side rail (Z = 0), and sandwich them securely between two padded mattresses or box springs.',
        zone: 'wall_left',
        keyRules: [
          'Unbolt dining table legs, wrap legs in bubble wrap, and stow underneath chairs.',
          'Place mattress on edge against the side wall rail first, then the tabletop, then the box spring.',
          'Tie the entire sandwich assembly directly to the truck tie rail using ratchet straps.'
        ],
        recommendedItems: ['Dining Table Tops', 'Queen/King Mattresses', 'Box Springs', 'Desks (Flat-packed)'],
        visualCallout: 'Visualized as structural wall barriers in the visualizer left boundary.'
      },
      {
        phaseNumber: 3,
        title: 'Step 3: Dressers, Credenzas & Heavy Floor Deck Anchoring',
        subtitle: 'Create rigid base platforms for cardboard box tiers',
        description: 'Large wooden dressers and credenzas are extremely sturdy when resting on their base. Place them flat on the floor deck (Y = 0) facing forward or facing walls. You can safely stack 2 to 3 tiers of medium cardboard boxes directly on top of heavy solid wood dressers.',
        zone: 'floor',
        keyRules: [
          'Leave clothing inside dresser drawers if the drawers are lightweight and taped shut.',
          'Remove heavy books or ceramics from drawers to prevent drawer glides from bending under transit vibration.',
          'Cover dresser tops with a moving pad before stacking cardboard boxes overhead.'
        ],
        recommendedItems: ['6-Drawer Dressers', 'Nightstands', 'Buffet Credenzas', 'Solid Wood Desks'],
        visualCallout: 'Shows floor items supporting vertical box tiers in the 2.5D interactive model.'
      },
      {
        phaseNumber: 4,
        title: 'Step 4: Dining Chairs Interlocking & Void Fill',
        subtitle: 'Interlock chairs seat-to-seat to eliminate wasted dead space',
        description: 'Dining chairs take up awkward volume if scattered. Interlock pairs of dining chairs "seat-to-seat" with one inverted, placing moving pads between their finished wooden seats. Secure the pair with stretch film and tuck them into corners or on top of credenzas.',
        zone: 'tailgate',
        keyRules: [
          'Place one chair upright, invert the second chair upside down so seats meet face-to-face.',
          'Pad the contact area with a small towel or moving pad to prevent lacquer scratching.',
          'Slide small rolled carpets or light parcels into the void between chair legs.'
        ],
        recommendedItems: ['Dining Room Chairs', 'Armchairs', 'Barstools', 'Floor Lamps'],
        visualCallout: 'Interlocking configurations reduce dead space by up to 45%.'
      }
    ],
    proTips: [
      'Always carry heavy wooden furniture by its structural frame or legs, never by decorative drawer pulls or glued molding.',
      'When loading through the roll-up door, have one person on the ground pushing and one inside the truck pulling to maintain smooth continuous momentum up the ramp.',
      'Place cardboard padding under sofa ends touching the aluminum truck bed to protect upholstery from oil or road dirt.',
      'Use high-visibility colored tape on boxes containing fragile glass table inserts or furniture hardware.'
    ],
    faqList: [
      {
        question: 'Can you stand a couch on end in a moving truck?',
        answer: 'Yes, standing a couch on end is standard professional moving practice. It saves up to 40 square feet of floor space. Ensure the couch feet are unscrewed, wrap it entirely in moving blankets, and secure it with a tie-down strap against the bulkhead or side wall.'
      },
      {
        question: 'Should you empty dresser drawers before moving?',
        answer: 'Clothing and soft linens can remain in dresser drawers if the total weight remains manageable. However, remove all heavy items, books, breakables, and valuables, and wrap the entire dresser in shrink film to prevent drawers from sliding open.'
      },
      {
        question: 'How do you protect wooden table surfaces from scratches?',
        answer: 'Disassemble table legs, cover the top entirely in thick quilted moving pads, and secure the pads with plastic stretch film. Stand the tabletop vertically on edge and sandwich it between two padded mattresses along the truck side rail.'
      }
    ]
  }
};

export function getHowToPackGuide(rawSlug: string): HowToPackGuide | null {
  const normalized = rawSlug.toLowerCase().trim();
  return HOW_TO_PACK_GUIDES[normalized] || null;
}

export function getAllHowToPackSlugs(): string[] {
  return Object.keys(HOW_TO_PACK_GUIDES);
}
