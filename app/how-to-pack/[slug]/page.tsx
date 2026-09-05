import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getHowToPackGuide,
  getAllHowToPackSlugs,
} from '@/lib/seo/howToPack';
import ProgrammaticVisualizer from '@/components/visualizer/ProgrammaticVisualizer';
import { MovingLaborBookingBox, DynamicBoxKitCard } from '@/components/cro';
import StructuredData from '@/components/seo/StructuredData';
import {
  Layers,
  CheckCircle2,
  ChevronRight,
  Home,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllHowToPackSlugs().map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getHowToPackGuide(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!guide) {
    return {
      title: 'How to Pack a Moving Truck | TruckSizer',
    };
  }

  const canonicalUrl = `${baseUrl}/how-to-pack/${guide.canonicalSlug}`;

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      url: canonicalUrl,
      type: 'article',
      siteName: 'TruckSizer',
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.metaDescription,
    },
  };
}

export default async function HowToPackPage({ params }: Props) {
  const { slug } = await params;
  const guide = getHowToPackGuide(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!guide) {
    notFound();
  }

  // Schema.org SoftwareApplication (Tier 3)
  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TruckSizer - ${guide.h1}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All modern web browsers',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas',
    url: `${baseUrl}/how-to-pack/${guide.canonicalSlug}`,
    description: guide.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Interactive 2.5D visual loading simulation',
      'Step-by-step 4-phase packing sequence',
      '60/40 axle weight distribution calculation',
      'Essential moving equipment checklist',
    ],
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      {/* Tier 3: Schema.org Structured Data */}
      <StructuredData
        breadcrumbs={[
          { name: 'Home', url: baseUrl },
          { name: 'Loading Guides', url: `${baseUrl}/how-to-pack/moving-truck` },
          { name: guide.h1, url: `${baseUrl}/how-to-pack/${guide.canonicalSlug}` },
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
            <Link href="/how-to-pack/moving-truck" className="hover:text-white transition-colors">
              Loading Guides
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-[#FF5500] font-medium">{guide.primaryKeyword}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-xs font-semibold uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Commercial Loading Methodology</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {guide.h1}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-3xl leading-relaxed">
                {guide.overview}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/?truck=${guide.defaultTruckId}&preset=${guide.defaultPresetId}`}
                className="px-4 py-2 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#FF5500]/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Interactive Sizer</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-10 flex-1">
        {/* Weight Distribution Golden Rule Callout */}
        <section className="rounded-xl border border-[#0066FF]/30 bg-gradient-to-r from-[#0066FF]/10 via-[#111318] to-[#0066FF]/10 p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0066FF]/20 border border-[#0066FF]/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#0066FF]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                The Golden Rule: 60/40 Axle Weight Distribution
              </h2>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {guide.weightDistributionRule}
              </p>
            </div>
          </div>
        </section>

        {/* Tier 2: 2.5D Visualizer Simulation */}
        <section aria-labelledby="interactive-sim-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="interactive-sim-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF5500]" />
              <span>Interactive 2.5D Cargo Simulation</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Hover items to inspect dimensions &amp; zones
            </span>
          </div>

          <ProgrammaticVisualizer
            truckId={guide.defaultTruckId}
            presetId={guide.defaultPresetId}
            badgeLabel="Sequential 4-Phase Model"
          />
        </section>

        {/* CRO Monetization: Moving Labor Booking Box */}
        <MovingLaborBookingBox truckLabel="your moving truck" />

        {/* The 4 Sequential Loading Phases */}
        <section aria-labelledby="phases-heading" className="space-y-6">
          <div>
            <h2 id="phases-heading" className="text-xl font-bold text-white">
              The 4-Phase Step-by-Step Loading Sequence
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Follow this order strictly to maximize capacity and prevent shifting damage during transit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guide.phases.map((phase) => (
              <div
                key={phase.phaseNumber}
                className="rounded-xl border border-[#1F242F] bg-[#111318] p-5 space-y-4 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] text-xs font-mono font-bold">
                      Phase {phase.phaseNumber}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase">
                      Zone: {phase.zone}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {phase.title}
                  </h3>
                  <div className="text-xs text-[#0066FF] font-medium">
                    {phase.subtitle}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    {phase.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#1F242F]">
                  <div className="text-xs font-semibold text-zinc-200">Key Execution Rules:</div>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {phase.keyRules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>

                  {phase.safetyWarning && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[11px] text-[#EF4444]">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{phase.safetyWarning}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Equipment & Supplies Checklist */}
        <section aria-labelledby="equipment-heading" className="space-y-4">
          <div>
            <h2 id="equipment-heading" className="text-lg font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#F59E0B]" />
              <span>Essential Professional Moving Equipment Checklist</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Required tools to safely load heavy items without personal injury or furniture damage.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#1F242F] bg-[#111318]">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#181B22] border-b border-[#1F242F] text-[#9CA3AF] text-xs font-mono uppercase">
                  <th className="py-3 px-4 font-semibold">Equipment Tool</th>
                  <th className="py-3 px-4 font-semibold">Recommended Qty</th>
                  <th className="py-3 px-4 font-semibold">Primary Purpose &amp; Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F242F] text-zinc-200">
                {guide.equipmentChecklist.map((item) => (
                  <tr key={item.item} className="hover:bg-[#16181F] transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{item.item}</td>
                    <td className="py-3 px-4 font-mono text-[#FF5500]">{item.recommendedQty}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400">{item.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Box Kit CTA */}
        <DynamicBoxKitCard
          boxCountTotal={45}
          dwellingLabel="this loading plan"
        />

        {/* Pro Tips Grid */}
        <section className="rounded-xl border border-[#1F242F] bg-[#111318] p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Master Mover Pro Tips</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
            {guide.proTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-[#181B22] border border-[#262B38]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="space-y-4 pt-4 border-t border-[#1F242F]">
          <h2 id="faq-heading" className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#0066FF]" />
            <span>Frequently Asked Questions About Packing Moving Trucks</span>
          </h2>
          <div className="space-y-3">
            {guide.faqList.map((faq, idx) => (
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
