import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getComparisonSpec,
  getAllComparisonSlugs,
} from '@/lib/seo/comparisons';
import ProgrammaticVisualizer from '@/components/visualizer/ProgrammaticVisualizer';
import {
  MovingLaborBookingBox,
  RentalSavingsBanner,
  DynamicBoxKitCard,
} from '@/components/cro';
import StructuredData from '@/components/seo/StructuredData';
import {
  Scale,
  CheckCircle2,
  ChevronRight,
  Home,
  ShieldCheck,
  Check,
  X,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllComparisonSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spec = getComparisonSpec(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!spec) {
    return {
      title: 'Moving Truck Comparison Guide | TruckSizer',
    };
  }

  const canonicalUrl = `${baseUrl}/compare/${spec.canonicalSlug}`;

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

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const spec = getComparisonSpec(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!spec) {
    notFound();
  }

  const vA = spec.vehicleA;
  const vB = spec.vehicleB;

  // Schema.org SoftwareApplication (Tier 3)
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TruckSizer - ${spec.h1}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All modern web browsers',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas',
    url: `${baseUrl}/compare/${spec.canonicalSlug}`,
    description: spec.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      `Side-by-side comparative sizing: ${vA.name} vs ${vB.name}`,
      '2.5D visual cargo packing simulation',
      'Volumetric safety buffer and weight distribution analysis',
      'Instant brand discount and booking arbitrage links',
    ],
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      {/* Tier 3: Schema.org Structured Data */}
      <StructuredData
        breadcrumbs={[
          { name: 'Home', url: baseUrl },
          { name: 'Comparisons', url: `${baseUrl}/compare/10ft-vs-15ft` },
          { name: spec.h1, url: `${baseUrl}/compare/${spec.canonicalSlug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-[#1F242F] bg-[#111318] px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-3">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <Link href="/compare/10ft-vs-15ft" className="hover:text-white transition-colors">
              Fleet Comparisons
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-[#FF5500] font-medium">{spec.primaryKeyword}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] text-xs font-semibold uppercase tracking-wider mb-2">
                <Scale className="w-3.5 h-3.5" />
                <span>Side-by-Side Dimensional Head-to-Head</span>
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
                href={`/?truck=${vB.truckId}&preset=${vB.defaultPreset}`}
                className="px-4 py-2 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#FF5500]/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Fit in 2.5D Tool</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-10 flex-1">
        {/* Quick Verdict Box */}
        <section className="rounded-xl border border-[#10B981]/30 bg-gradient-to-r from-[#10B981]/10 via-[#111318] to-[#10B981]/10 p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#10B981] font-bold">
                The Bottom Line Verdict
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 mt-1 leading-relaxed font-medium">
                {spec.bottomLineVerdict}
              </p>
            </div>
          </div>
        </section>

        {/* Competitor Savings Banner */}
        <RentalSavingsBanner truckSize={vA.name} />

        {/* Tier 1: Side-by-Side Specs Matrix Table (Snippet Magnet) */}
        <section aria-labelledby="comparison-matrix-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="comparison-matrix-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#FF5500]" />
              <span>Side-by-Side Key Metrics Comparison</span>
            </h2>
            <span className="text-xs font-mono text-zinc-400">18% Buffer Included</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F242F] bg-[#111318] shadow-lg">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#181B22] border-b border-[#1F242F] text-[#9CA3AF] text-xs font-mono uppercase">
                  <th className="py-3 px-4 font-semibold">Key Metric</th>
                  <th className="py-3 px-4 font-semibold text-white">{vA.name}</th>
                  <th className="py-3 px-4 font-semibold text-white">{vB.name}</th>
                  <th className="py-3 px-4 font-semibold">Advantage &amp; Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F242F] text-zinc-200 font-mono">
                {spec.keyDifferences.map((diff, idx) => (
                  <tr key={idx} className="hover:bg-[#16181F] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{diff.metric}</td>
                    <td className={`py-3 px-4 ${diff.advantage === 'vehicleA' ? 'text-[#10B981] font-bold' : ''}`}>
                      {diff.vehicleAVal}
                    </td>
                    <td className={`py-3 px-4 ${diff.advantage === 'vehicleB' ? 'text-[#10B981] font-bold' : ''}`}>
                      {diff.vehicleBVal}
                    </td>
                    <td className="py-3 px-4 text-xs font-sans text-zinc-300 leading-relaxed">
                      {diff.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Multi-Brand Fleet Matrix (If Applicable) */}
        {spec.brandMatrix && (
          <section aria-labelledby="brand-matrix-heading" className="space-y-4">
            <h2 id="brand-matrix-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
              <span>Rental Carrier Brand Breakdown (U-Haul vs Budget vs Penske)</span>
            </h2>

            <div className="overflow-x-auto rounded-xl border border-[#1F242F] bg-[#111318]">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#181B22] border-b border-[#1F242F] text-[#9CA3AF] text-xs font-mono uppercase">
                    <th className="py-3 px-4 font-semibold">Brand</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Gross / Usable Cu Ft</th>
                    <th className="py-3 px-4 font-semibold">Interior Dims</th>
                    <th className="py-3 px-4 font-semibold">Deck Height</th>
                    <th className="py-3 px-4 font-semibold">Ramp &amp; Attic</th>
                    <th className="py-3 px-4 font-semibold">Standout Advantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F242F] text-zinc-200 font-mono">
                  {spec.brandMatrix.map((row) => (
                    <tr key={row.brand} className="hover:bg-[#16181F] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{row.brand}</td>
                      <td className="py-3 px-4 text-[#FF5500]">{row.truckClass}</td>
                      <td className="py-3 px-4">
                        {row.grossVolumeCuFt} / <span className="text-[#10B981]">{row.usableVolumeCuFt} cu ft</span>
                      </td>
                      <td className="py-3 px-4">{row.interiorDimensions}</td>
                      <td className="py-3 px-4">{row.deckHeightInches}&Prime;</td>
                      <td className="py-3 px-4 text-xs font-sans">
                        {row.rampIncluded ? 'Ramp: Yes' : 'Ramp: No'} &bull; {row.momsAttic ? 'Attic: Yes' : 'Attic: No'}
                      </td>
                      <td className="py-3 px-4 text-xs font-sans text-zinc-300">{row.standoutAdvantage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tier 2: Interactive Visualizer Simulation of Vehicle B */}
        <section aria-labelledby="visual-fit-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="visual-fit-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span>Interactive 2.5D Load Verification: {vB.name}</span>
            </h2>
            <div className="text-xs text-zinc-400 font-mono">
              Pre-packed with {vB.idealDwelling}
            </div>
          </div>

          <ProgrammaticVisualizer
            truckId={vB.truckId}
            presetId={vB.defaultPreset}
            badgeLabel={`Visual Proof: ${vB.name}`}
          />
        </section>

        {/* CRO Monetization: Moving Labor Helper Box */}
        <MovingLaborBookingBox truckLabel={`either ${vA.name} or ${vB.name}`} />

        {/* Decision Checklist: When to Choose A vs B */}
        <section aria-labelledby="decision-heading" className="space-y-4">
          <div>
            <h2 id="decision-heading" className="text-xl font-bold text-white">
              Decision Checklist: Which Vehicle Fits Your Move?
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select the option that matches your inventory profile and road conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Choose A */}
            <div className="rounded-xl border border-[#1F242F] bg-[#111318] p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0066FF]" />
                <h3 className="text-base font-bold text-white">
                  Reserve the {vA.name} If:
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {spec.decisionMatrix.chooseAWhen.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0066FF] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  href={`/?truck=${vA.truckId}&preset=${vA.defaultPreset}`}
                  className="w-full py-2 rounded-lg bg-[#181B22] hover:bg-[#222733] border border-[#2D3342] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Size {vA.name} in Visualizer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Choose B */}
            <div className="rounded-xl border border-[#10B981]/30 bg-gradient-to-b from-[#111318] to-[#10B981]/5 p-5 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
                <h3 className="text-base font-bold text-white">
                  Reserve the {vB.name} (Recommended) If:
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                {spec.decisionMatrix.chooseBWhen.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  href={`/?truck=${vB.truckId}&preset=${vB.defaultPreset}`}
                  className="w-full py-2 rounded-lg bg-[#10B981] hover:bg-[#0EA271] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-[#10B981]/20"
                >
                  <span>Size {vB.name} in Visualizer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Box Kit Card */}
        <DynamicBoxKitCard
          boxCountTotal={50}
          dwellingLabel="this move"
        />

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-4 pt-4 border-t border-[#1F242F]">
          <h2 id="faq-heading" className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#0066FF]" />
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-3">
            {spec.faqList.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-[#1F242F] bg-[#111318] p-4 space-y-1.5">
                <h3 className="text-sm font-semibold text-white">{faq.question}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
