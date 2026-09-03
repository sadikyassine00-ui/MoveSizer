import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';
import { TRUCKS } from '@/lib/constants/trucks';
import { AppShell } from '@/components/layout/AppShell';
import { FooterDirectory } from '@/components/layout/FooterDirectory';
import { Truck, Box, ShieldCheck, ArrowRight, Home, ChevronRight, Layers, CheckCircle2 } from 'lucide-react';

interface Props {
  params: Promise<{ dwelling: string }>;
}

interface DwellingDetail {
  typicalRooms: string;
  boxRange: string;
  keyFurniture: string[];
  recommendationReason: string;
  loadingTips: string[];
}

const DWELLING_DETAILS: Record<string, DwellingDetail> = {
  'studio-apartment': {
    typicalRooms: 'Studio / 1 Room (1 Occupant)',
    boxRange: '25 – 40 Boxes',
    keyFurniture: ['Queen or Full Bed', 'Loveseat or Futon', 'Coffee Table & TV Stand', 'Small Dining Set / Desk'],
    recommendationReason:
      'A 10-foot truck provides 402 gross cu ft (329 cu ft usable at an 18% buffer), sufficient for small apartment furniture without paying for unused cargo volume.',
    loadingTips: [
      'Stand mattress and foundation upright along the left wall to leave the floor deck completely open.',
      'Place loveseat and TV console flat or vertically against the front bulkhead.',
      'Stack medium and small boxes in uniform 4-high tiers from the back wall forward.',
    ],
  },
  '1-bedroom-apartment': {
    typicalRooms: '1 Bedroom + Living & Kitchen (1–2 Occupants)',
    boxRange: '45 – 65 Boxes',
    keyFurniture: ['Queen Bed & Frame', '3-Seat Sofa', '6-Drawer Dresser & 2 Nightstands', 'Dining Table & 4 Chairs'],
    recommendationReason:
      "A 15-foot truck provides 764 cu ft (626 cu ft usable) plus Mom's Attic shelf for wardrobe boxes and fragile cartons, preventing awkward single-layer overloading.",
    loadingTips: [
      'Mattress and bed frames stand on edge along the left side rail.',
      '3-seat sofa stands vertically on end against the cab wall to optimize floor footprint.',
      "Utilize Mom's Attic shelf exclusively for wardrobe hanging boxes and fragile cartons.",
      'Build tight vertical box tiers directly in front of bulkhead furniture.',
    ],
  },
  '2-bedroom-apartment': {
    typicalRooms: '2 Bedrooms + Living & Dining (2–3 Occupants)',
    boxRange: '65 – 90 Boxes',
    keyFurniture: ['1 King Bed & 1 Queen Bed', '3-Seat Sofa & Recliner', '2 Dressers & Nightstands', 'Dining Suite & Coffee Table'],
    recommendationReason:
      'A 15-ft to 20-ft truck accommodates two full bedroom sets plus full living and dining suites without requiring second trips or compressed box damage.',
    loadingTips: [
      'Both mattresses stand on edge along the side wall in order of size (King first, then Queen).',
      'Sofas and armchairs stand vertically against the bulkhead.',
      'Dressers sit flat on the floor with medium boxes stacked strictly on top of solid timber surfaces.',
    ],
  },
  '3-bedroom-home': {
    typicalRooms: '3 Bedrooms + Living, Dining & Office (3–4 Occupants)',
    boxRange: '90 – 125 Boxes',
    keyFurniture: ['1 King Bed & 2 Queen/Twin Beds', 'Sectional / 3-Seat Sofa + Loveseat', '3 Dressers & Desks', 'Full Dining Room Suite'],
    recommendationReason:
      'A 20-foot truck offers 1,016 gross cu ft (833 cu ft usable) with up to 5,700 lbs payload capacity, accommodating multiple heavy timber suites and high box counts.',
    loadingTips: [
      'Distribute heavy bedroom dressers and desks flat along the floor centerline for balanced weight distribution.',
      'Stand all beds and large table tops on edge along the side walls secured with ratchet straps.',
      'Use vertical box tiers floor-to-ceiling (up to 5 boxes high) to maximize cubic volume.',
    ],
  },
  '4-bedroom-house': {
    typicalRooms: '4+ Bedrooms + Whole Home & Garage (4–6 Occupants)',
    boxRange: '130 – 180 Boxes',
    keyFurniture: ['2 King/Queen Beds + Twin Beds', 'Sectional Sofa & Living Room Set', '4 Dressers, Desks & Patio Furniture', 'Large Dining Suite & Appliances'],
    recommendationReason:
      'A 26-foot commercial truck provides 1,682 gross cu ft (1,379 cu ft usable) and 9,010 lbs payload capacity, standard for multi-bedroom single-family residences.',
    loadingTips: [
      'Group cargo into distinct loading zones: heavy appliances/bulkhead first, furniture mid-truck, box tiers rear.',
      "Fill Mom's Attic completely with wardrobe hanging boxes and light decorative cartons.",
      'Check axle weight limits and keep heaviest items forward of the rear dual wheels.',
    ],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dwelling } = await params;
  const config = DWELLING_SLUG_MAP[dwelling];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  if (!config) {
    return {
      title: 'Truck Size Guide | TruckSizer',
    };
  }

  const title = `What Size Moving Truck for a ${config.title}? (Visual Fit Guide)`;
  const description = `Find the right moving truck size for a ${config.title}. Compare usable cubic feet, box counts, payload limits, and 2.5D visual load plans.`;
  const canonicalUrl = `${baseUrl}/truck-size/${dwelling}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'TruckSizer',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(DWELLING_SLUG_MAP).map((dwelling) => ({
    dwelling,
  }));
}

export default async function DwellingPage({ params }: Props) {
  const { dwelling } = await params;
  const config = DWELLING_SLUG_MAP[dwelling];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  if (!config) {
    notFound();
  }

  const truck = TRUCKS[config.defaultTruck];
  const details = DWELLING_DETAILS[dwelling] || DWELLING_DETAILS['1-bedroom-apartment'];
  const usableCuFt = Math.round(truck.volumeCuFt * 0.82);

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TruckSizer — Moving Truck Size for ${config.title}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description: `2.5D visual load planner and cargo calculator for ${config.title}. Recommended truck: ${truck.name}.`,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What size moving truck do I need for a ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `For a ${config.title}, commercial moving truck providers recommend a ${truck.name}. It provides ${truck.volumeCuFt} gross cubic feet (${usableCuFt} cu ft usable with 18% safety buffer) and up to ${truck.maxPayloadLbs.toLocaleString()} lbs payload capacity.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many boxes do I need for a ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A standard ${config.title} typically requires between ${details.boxRange}, distributed into 30% small boxes (1.5 cu ft), 45% medium boxes (3.0 cu ft), 15% large boxes (4.5 cu ft), and wardrobe boxes for hanging clothes.`,
        },
      },
      {
        '@type': 'Question',
        name: `Why does TruckSizer include an 18% packing safety buffer?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Advertised moving truck volume represents raw liquid interior capacity. In real moves, irregular furniture shapes, wheel well intrusions, and packing voids prevent 100% utilization. The 18% buffer ensures your cargo fits without moving-day overflow.`,
        },
      },
    ],
  };

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Dwelling Sizing Guides',
        item: `${baseUrl}/truck-size/${dwelling}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: config.title,
        item: `${baseUrl}/truck-size/${dwelling}`,
      },
    ],
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Pack a Moving Truck for a ${config.title}`,
    description: `Professional commercial loading sequence to fit a ${config.title} into a ${truck.name}.`,
    step: details.loadingTips.map((tip, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: `Step ${idx + 1}: ${tip.split('.')[0]}`,
      text: tip,
    })),
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* 1. Server-Rendered Semantic Hero Header */}
      <header className="border-b border-[#1F242F] bg-[#111318] px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-300">Dwelling Sizing Guides</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-[#FF5500] font-medium">{config.title}</span>
          </nav>

          {/* Primary Query-Matched H1 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                What Size Moving Truck for a {config.title}?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                Comprehensive 2.5D visual load guide, interior dimensions, and estimated box count for a {config.title}.
              </p>
            </div>

            {/* Quick Sizing Metric Pill */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <div className="px-3 py-1.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Recommended: {truck.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Interactive 2.5D Cargo Workspace */}
      <main className="flex-1">
        <AppShell
          initialPreset={config.presetId}
          initialTruckId={config.defaultTruck}
        />
      </main>

      {/* 3. Deep Server-Rendered Editorial Section for pSEO */}
      <section className="border-t border-[#1F242F] bg-[#0E1015] py-12 px-4 sm:px-8 text-zinc-300 text-xs">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Section 1: Specifications & Breakdown */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0066FF]" />
              <span>{config.title} Cargo Sizing & Volume Profile</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed text-xs">
              {details.recommendationReason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Typical Layout</div>
                <div className="text-white font-bold text-sm">{details.typicalRooms}</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Recommended Vehicle</div>
                <div className="text-[#FF5500] font-bold text-sm">{truck.name}</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Usable Volume (82%)</div>
                <div className="text-[#10B981] font-bold text-sm">{usableCuFt} cu ft</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Estimated Box Range</div>
                <div className="text-white font-bold text-sm">{details.boxRange}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Loading Sequence Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span>Professional Loading Strategy for a {config.title}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {details.loadingTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
                  <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <h3 className="text-white font-semibold text-sm">Step {idx + 1}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Crawlable Cross-Links */}
          <div className="space-y-4 pt-4 border-t border-[#1F242F]">
            <h2 className="text-base font-bold text-white tracking-tight">
              Compare Other Dwelling Sizes & Vehicle Clearance Checks
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(DWELLING_SLUG_MAP).map(([slug, mapItem]) => (
                <Link
                  key={slug}
                  href={`/truck-size/${slug}`}
                  className={`p-3 rounded-md border text-xs transition-colors block ${
                    slug === dwelling
                      ? 'bg-[#FF5500]/15 border-[#FF5500]/40 text-white font-semibold'
                      : 'bg-[#111318] border-[#1F242F] text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="truncate">{mapItem.title}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {TRUCKS[mapItem.defaultTruck].name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
