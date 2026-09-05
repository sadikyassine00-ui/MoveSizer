import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getDimensionSpec,
  getAllDimensionSlugs,
} from '@/lib/seo/dimensions';
import { TRUCKS } from '@/lib/constants/trucks';
import ProgrammaticVisualizer from '@/components/visualizer/ProgrammaticVisualizer';
import {
  TrademarkDisclaimerBanner,
  MovingLaborBookingBox,
  RentalSavingsBanner,
  DynamicBoxKitCard,
} from '@/components/cro';
import { StructuredData, VehicleSpecMatrix } from '@/components/seo';
import {
  Truck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Home,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllDimensionSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spec = getDimensionSpec(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!spec) {
    return {
      title: 'Truck Dimensions & Specs Guide | TruckSizer',
    };
  }

  const canonicalUrl = `${baseUrl}/dimensions/${spec.canonicalSlug}`;

  return {
    title: spec.title,
    description: spec.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: spec.title,
      description: spec.metaDescription,
      url: canonicalUrl,
      type: 'article',
      siteName: 'TruckSizer',
    },
    twitter: {
      card: 'summary_large_image',
      title: spec.title,
      description: spec.metaDescription,
    },
  };
}

export default async function DimensionPage({ params }: Props) {
  const { slug } = await params;
  const spec = getDimensionSpec(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!spec) {
    notFound();
  }

  const dims = spec.dimensions;
  const truckSpec = TRUCKS[spec.truckId] || TRUCKS['15ft'];

  // SoftwareApplication structured data (Tier 3)
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TruckSizer - ${spec.h1}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All modern web browsers',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas',
    url: `${baseUrl}/dimensions/${spec.canonicalSlug}`,
    description: spec.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      `${spec.h1} dimensional calculation`,
      '2.5D interactive isometric cargo packing simulation',
      'Dynamic real-world 18% packing buffer calculation',
      'Instant brand fleet comparison (U-Haul, Budget, Penske)',
    ],
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      {/* Tier 3: Schema.org Structured Data */}
      <StructuredData
        breadcrumbs={[
          { name: 'Home', url: baseUrl },
          { name: 'Dimensions', url: `${baseUrl}/dimensions/box-truck` },
          { name: spec.h1, url: `${baseUrl}/dimensions/${spec.canonicalSlug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />

      {/* Brand Defense Guardrail (un-closable banner on branded routes) */}
      {spec.isBrandFlanking && <TrademarkDisclaimerBanner />}

      {/* Hero Header */}
      <header className="border-b border-[#1F242F] bg-[#111318] px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <Link href="/dimensions/box-truck" className="hover:text-white transition-colors">
              Fleet Dimensions
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-[#FF5500] font-medium">{spec.primaryKeyword}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/25 text-[#0066FF] text-xs font-semibold uppercase tracking-wider mb-2">
                <Truck className="w-3.5 h-3.5" />
                <span>Verified Spec Data Matrix</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {spec.h1}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
                {spec.metaDescription}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/?truck=${spec.truckId}&preset=${spec.targetDwelling}`}
                className="px-4 py-2 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#FF5500]/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pack In 2.5D Tool</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
        {/* Tier 1: Above-the-Fold Specs Data Matrix (High-Converting Real-World Fit Cheat Sheet) */}
        <VehicleSpecMatrix spec={spec} />

        {/* Competitor Rental Arbitrage Banner on U-Haul Pages */}
        {spec.isBrandFlanking && (
          <RentalSavingsBanner truckSize={spec.primaryKeyword} />
        )}

        {/* Tier 2: Embedded Props-Driven 2.5D Canvas Component */}
        <section aria-labelledby="visualizer-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="visualizer-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#0066FF]" />
              <span>2.5D Interactive Cargo Layout for {dims.lengthFeet} Truck</span>
            </h2>
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Loaded with {spec.recommendedInventory.dwellingLabel} Preset</span>
            </div>
          </div>

          <ProgrammaticVisualizer
            truckId={spec.truckId}
            presetId={spec.targetDwelling}
            badgeLabel={spec.visualHook}
          />
        </section>

        {/* CRO Monetization Layer: Hourly Moving Labor Booking Box */}
        <MovingLaborBookingBox truckLabel={`${dims.lengthFeet} moving truck`} />

        {/* CRO Monetization Layer: Dynamic Box Kit Shopping Card */}
        <DynamicBoxKitCard
          boxCountTotal={spec.recommendedInventory.boxCountTotal}
          dwellingLabel={spec.recommendedInventory.dwellingLabel}
        />

        {/* Tier 4: In-Content Multi-Brand Fleet Comparison Table */}
        <section aria-labelledby="fleet-comparison-heading" className="space-y-4 pt-4 border-t border-[#1F242F]">
          <div>
            <h2 id="fleet-comparison-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Fleet Comparison: {dims.lengthFeet} Class Across Top Rental Brands</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Factual cross-fleet comparison between U-Haul, Budget, and Penske for this size tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F242F] bg-[#111318]">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#181B22] border-b border-[#1F242F] text-[#9CA3AF] text-xs font-mono uppercase">
                  <th className="py-3 px-4 font-semibold">Rental Carrier</th>
                  <th className="py-3 px-4 font-semibold">Size Tier</th>
                  <th className="py-3 px-4 font-semibold">Interior Dims (L &times; W &times; H)</th>
                  <th className="py-3 px-4 font-semibold">Gross / Usable Cu Ft</th>
                  <th className="py-3 px-4 font-semibold">Max Payload</th>
                  <th className="py-3 px-4 font-semibold">Ramp &amp; Attic</th>
                  <th className="py-3 px-4 font-semibold">Avg Fuel Economy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F242F] text-zinc-200 font-mono">
                {spec.brandComparisons.map((row) => (
                  <tr key={row.brand} className="hover:bg-[#16181F] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{row.brand}</td>
                    <td className="py-3 px-4 text-[#FF5500]">{row.sizeName}</td>
                    <td className="py-3 px-4">{row.interiorDims}</td>
                    <td className="py-3 px-4">
                      {row.volumeCuFt} / <span className="text-[#10B981]">{row.usableCuFt} cu ft</span>
                    </td>
                    <td className="py-3 px-4">{row.maxPayloadLbs.toLocaleString()} lbs</td>
                    <td className="py-3 px-4 text-xs font-sans">
                      {row.rampIncluded ? 'Ramp: Yes' : 'Ramp: No'} &bull; {row.momsAtticIncluded ? 'Attic: Yes' : 'Attic: No'}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400">{row.estFuelEconomyMpg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Editorial Notes & Practical Loading Advice */}
        <section className="space-y-4 rounded-xl border border-[#1F242F] bg-[#111318] p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0066FF]" />
            <span>Expert Loading Advice for {dims.lengthFeet} Moving Trucks</span>
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
            {spec.inContentNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Adjacent Size Navigation Cross-Links */}
        <nav aria-label="Adjacent truck sizes" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1F242F]">
          {spec.adjacentSizes.previous ? (
            <Link
              href={`/dimensions/${spec.adjacentSizes.previous.slug}`}
              className="p-4 rounded-xl border border-[#1F242F] bg-[#111318] hover:border-[#FF5500]/50 transition-all flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#181B22] border border-[#2D3342] flex items-center justify-center shrink-0 group-hover:bg-[#FF5500]/10 group-hover:border-[#FF5500]/30 transition-colors">
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-[#FF5500]" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-400">Smaller Alternative</div>
                <div className="text-sm font-bold text-white group-hover:text-[#FF5500] transition-colors">
                  {spec.adjacentSizes.previous.label}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {spec.adjacentSizes.next && (
            <Link
              href={`/dimensions/${spec.adjacentSizes.next.slug}`}
              className="p-4 rounded-xl border border-[#1F242F] bg-[#111318] hover:border-[#FF5500]/50 transition-all flex items-center justify-end text-right gap-3 group sm:ml-auto w-full"
            >
              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-400">Need More Clearance?</div>
                <div className="text-sm font-bold text-white group-hover:text-[#FF5500] transition-colors">
                  {spec.adjacentSizes.next.label}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#181B22] border border-[#2D3342] flex items-center justify-center shrink-0 group-hover:bg-[#FF5500]/10 group-hover:border-[#FF5500]/30 transition-colors">
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#FF5500]" />
              </div>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
