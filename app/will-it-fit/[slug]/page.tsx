import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TRUCKS, TruckId } from '@/lib/constants/trucks';
import { ITEMS, ItemDefinition } from '@/lib/constants/items';
import { packTruck } from '@/lib/engine/packEngine';
import { TruckCanvas } from '@/components/visualizer/TruckCanvas';
import { FooterDirectory } from '@/components/layout/FooterDirectory';
import { CheckCircle2, XCircle, ArrowRight, Truck, ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

interface FitAnalysis {
  item: ItemDefinition;
  truckId: TruckId;
  fits: boolean;
  verdict: string;
  explanation: string;
  orientationText: string;
}

const KNOWN_SLUGS: Record<string, { itemId: string; truckId: TruckId }> = {
  'king-mattress-in-10ft-truck': { itemId: 'king_bed', truckId: '10ft' },
  'queen-bed-in-10ft-truck': { itemId: 'queen_bed', truckId: '10ft' },
  'sectional-sofa-in-15ft-truck': { itemId: 'sofa_3seat', truckId: '15ft' },
  '3-seat-sofa-in-10ft-truck': { itemId: 'sofa_3seat', truckId: '10ft' },
  'dining-table-in-10ft-truck': { itemId: 'dining_table', truckId: '10ft' },
  'dresser-in-10ft-truck': { itemId: 'dresser_6drawer', truckId: '10ft' },
  'wardrobe-box-in-10ft-truck': { itemId: 'box_wardrobe', truckId: '10ft' },
  'king-mattress-in-15ft-truck': { itemId: 'king_bed', truckId: '15ft' },
  'queen-bed-in-15ft-truck': { itemId: 'queen_bed', truckId: '15ft' },
  'sofa-in-20ft-truck': { itemId: 'sofa_3seat', truckId: '20ft' },
};

function parseSlug(slug: string): FitAnalysis | null {
  const match = KNOWN_SLUGS[slug];
  if (!match) return null;

  const item = ITEMS[match.itemId];
  const truck = TRUCKS[match.truckId];
  if (!item || !truck) return null;

  const { length, width, height } = item.dimensions;

  const fitsLength = length <= truck.length;
  const fitsWidth = width <= truck.width;
  const diagonalRoom = Math.sqrt(truck.width * truck.width + truck.height * truck.height);
  const fitsHeight = height <= truck.height || height <= diagonalRoom * 0.95;

  const fits = fitsLength && fitsWidth && fitsHeight;

  let orientationText = 'stood on edge along the side wall';
  if (item.zone === 'bulkhead') {
    orientationText = 'stood vertically against the front bulkhead';
  } else if (item.zone === 'floor') {
    orientationText = 'placed flat on the floor deck';
  } else if (item.zone === 'attic') {
    orientationText = "placed securely in Mom's Attic";
  }

  const verdict = fits
    ? `YES: A ${item.name} fits in a ${truck.name} ${orientationText}`
    : `NO: A ${item.name} exceeds the interior clearance of a ${truck.name}`;

  const explanation = fits
    ? `The ${item.name} requires ${length}″ length, ${width}″ width, and ${height}″ height. The ${truck.name} provides ${truck.length}″ × ${truck.width}″ × ${truck.height}″ interior space, providing ample clearance when loaded professionally.`
    : `The ${item.name} dimensions (${length}″L × ${width}″W × ${height}″H) exceed the safe interior clearances of the ${truck.name}. We recommend upgrading to a larger vehicle.`;

  return {
    item,
    truckId: match.truckId,
    fits,
    verdict,
    explanation,
    orientationText,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const analysis = parseSlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  if (!analysis) {
    return { title: 'Will It Fit? | TruckSizer' };
  }

  const title = `Will a ${analysis.item.name} Fit in a ${TRUCKS[analysis.truckId].name}? (Visual Check)`;
  const description = analysis.explanation;
  const canonicalUrl = `${baseUrl}/will-it-fit/${slug}`;

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
  return Object.keys(KNOWN_SLUGS).map((slug) => ({ slug }));
}

export default async function WillItFitPage({ params }: Props) {
  const { slug } = await params;
  const analysis = parseSlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  if (!analysis) {
    notFound();
  }

  const { item, truckId, fits, verdict, explanation, orientationText } = analysis;
  const truck = TRUCKS[truckId];

  // Pack the single item into the truck for visualizer
  const inventory: Record<string, number> = { [item.id]: 1 };
  const packResult = packTruck(truck, inventory, []);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Will a ${item.name} fit in a ${truck.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: verdict,
        },
      },
      {
        '@type': 'Question',
        name: `How should a ${item.name} be loaded into a ${truck.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Professional commercial movers recommend loading the ${item.name} ${orientationText}. Always secure with heavy-duty ratchet tie-down straps against side wall rails or the front bulkhead.`,
        },
      },
      {
        '@type': 'Question',
        name: `What are the interior dimensions of a ${truck.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A ${truck.name} features interior dimensions of ${truck.length}″ length × ${truck.width}″ width × ${truck.height}″ height, offering ${truck.volumeCuFt} gross cubic feet (${Math.round(truck.volumeCuFt * 0.82)} cu ft usable volume with 18% safety buffer) and up to ${truck.maxPayloadLbs.toLocaleString()} lbs payload capacity.`,
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
        name: 'Will It Fit?',
        item: `${baseUrl}/will-it-fit/${slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${item.name} in ${truck.name}`,
        item: `${baseUrl}/will-it-fit/${slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* Header */}
      <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-base hover:opacity-90">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>TRUCK<span className="text-[#FF5500]">SIZER</span></span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold transition-colors"
        >
          <span>Calculate Full Move</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-5">
        {/* Bold Verdict Hero Badge */}
        <div
          className={`p-4 rounded-md border ${
            fits
              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-emerald-300'
              : 'bg-[#EF4444]/10 border-[#EF4444]/40 text-red-300'
          } space-y-2`}
        >
          <div className="flex items-center gap-2.5">
            {fits ? (
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" strokeWidth={1.75} />
            ) : (
              <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" strokeWidth={1.75} />
            )}
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {verdict}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 pl-7 leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* 2.5D Interactive Truck Cross-Section */}
        <div className="rounded-md border border-[#1F242F] bg-[#111318] overflow-hidden">
          <div className="p-3 bg-[#090A0C] border-b border-[#1F242F] flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#0066FF]" strokeWidth={1.5} />
              2.5D Load Orientation: {item.name} inside {truck.name}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">30° Isometric Cutaway</span>
          </div>

          <div className="h-[420px] w-full">
            <TruckCanvas
              truck={truck}
              blocks={packResult.blocks}
            />
          </div>
        </div>

        {/* Dimension & Spatial Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Item Specs */}
          <div className="p-3.5 rounded-md bg-[#111318] border border-[#1F242F] space-y-3">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-zinc-400">
              {item.name} Dimensions
            </div>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Packed Length:</span>
                <span className="text-white tabular-nums">{item.dimensions.length}″</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Packed Width:</span>
                <span className="text-white tabular-nums">{item.dimensions.width}″</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Packed Height:</span>
                <span className="text-white tabular-nums">{item.dimensions.height}″</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Item Volume:</span>
                <span className="text-[#0066FF] font-semibold tabular-nums">{item.volumeCuFt} cu ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-sans">Estimated Weight:</span>
                <span className="text-white tabular-nums">~{item.weightLbs} lbs</span>
              </div>
            </div>
          </div>

          {/* Truck Clearance Specs */}
          <div className="p-3.5 rounded-md bg-[#111318] border border-[#1F242F] space-y-3">
            <div className="font-semibold text-white uppercase text-[11px] tracking-wider text-zinc-400">
              {truck.name} Interior Clearances
            </div>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Interior Length:</span>
                <span className="text-white tabular-nums">{truck.length}″ ({(truck.length / 12).toFixed(1)}′)</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Interior Width:</span>
                <span className="text-white tabular-nums">{truck.width}″</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Interior Height:</span>
                <span className="text-white tabular-nums">{truck.height}″</span>
              </div>
              <div className="flex justify-between border-b border-[#1F242F] pb-1.5">
                <span className="text-zinc-500 font-sans">Usable Volume (18% buffer):</span>
                <span className="text-[#10B981] font-semibold tabular-nums">
                  {Math.round(truck.volumeCuFt * 0.82)} cu ft
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-sans">Max Payload:</span>
                <span className="text-white tabular-nums">{truck.maxPayloadLbs.toLocaleString()} lbs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Planning a full household move?</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Input your complete furniture and box inventory into the interactive 2.5D visualizer to calculate vehicle fit.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 px-3.5 py-2 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold tracking-wide uppercase transition-colors"
          >
            Launch Sizing Workspace
          </Link>
        </div>

        {/* Crawlable Internal Link Directory */}
        <FooterDirectory />
      </main>
    </div>
  );
}
