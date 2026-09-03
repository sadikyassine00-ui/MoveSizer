import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDwellingConfig, getAllDwellingSlugs } from '@/lib/seo/dwellings';
import { TRUCKS } from '@/lib/constants/trucks';
import { AppShell } from '@/components/layout/AppShell';
import StructuredData from '@/components/seo/StructuredData';
import {
  Truck,
  Box,
  HelpCircle,
  Home,
  ChevronRight,
  Layers,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface Props {
  params: Promise<{ dwelling: string }>;
}

export async function generateStaticParams() {
  return getAllDwellingSlugs().map((dwelling) => ({
    dwelling,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dwelling } = await params;
  const config = getDwellingConfig(dwelling);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!config) {
    return {
      title: 'Truck Size Guide | TruckSizer',
    };
  }

  const canonicalUrl = `${baseUrl}/truck-size/${dwelling}`;

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'TruckSizer',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
    },
  };
}

export default async function DwellingPage({ params }: Props) {
  const { dwelling } = await params;
  const config = getDwellingConfig(dwelling);
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  if (!config) {
    notFound();
  }

  const truck = TRUCKS[config.truckId];
  const usableCuFt = Math.round(truck.volumeCuFt * 0.82);
  const allSlugs = getAllDwellingSlugs();

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Pack a Moving Truck for a ${config.name}`,
    description: `Professional commercial loading sequence to fit a ${config.name} into a ${truck.name}.`,
    step: config.loadingTips.map((tip, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: `Step ${idx + 1}: ${tip.split('.')[0]}`,
      text: tip,
    })),
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      {/* 1. Schema.org Structured Data */}
      <StructuredData
        breadcrumbs={[
          { name: 'Home', url: baseUrl },
          { name: 'Truck Sizing', url: `${baseUrl}/truck-size/${dwelling}` },
          { name: config.name, url: `${baseUrl}/truck-size/${dwelling}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      {/* 2. Server-Rendered Semantic Hero Header */}
      <header className="border-b border-[#1F242F] bg-[#111318] px-4 sm:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-300">Truck Sizing</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-[#FF5500] font-medium">{config.name}</span>
          </nav>

          {/* Primary Query-Matched H1 */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* Quick Sizing Metric Pill */}
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <div className="px-3 py-1.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-semibold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Recommended: {config.recommendedTruck}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Interactive 2.5D Cargo Workspace (Pre-loaded with preset) */}
      <main className="flex-1">
        <AppShell
          initialPreset={config.presetId}
          initialTruckId={config.truckId}
        />
      </main>

      {/* 4. Deep Server-Rendered Editorial Section for pSEO */}
      <section className="border-t border-[#1F242F] bg-[#0E1015] py-12 px-4 sm:px-8 text-zinc-300 text-xs">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Section 1: Specifications & Breakdown */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0066FF]" />
              <span>{config.name} Cargo Sizing & Volume Profile</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed text-xs">
              {config.recommendationReason}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Typical Layout</div>
                <div className="text-white font-bold text-sm">{config.typicalRooms}</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Recommended Vehicle</div>
                <div className="text-[#FF5500] font-bold text-sm">{config.recommendedTruck}</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Est. Cargo Volume</div>
                <div className="text-[#0066FF] font-bold text-sm">~{config.estimatedCuFt} cu ft</div>
              </div>
              <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                <div className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">Estimated Box Range</div>
                <div className="text-[#10B981] font-bold text-sm">{config.boxRange}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Key Furniture Included */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Box className="w-5 h-5 text-[#FF5500]" />
              <span>Standard Furniture Inventory Modeled for {config.name}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {config.keyFurniture.map((item, idx) => (
                <div key={idx} className="p-3 rounded-md bg-[#111318] border border-[#1F242F] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
                  <span className="text-white text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Loading Sequence Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <span>Professional Loading Strategy for a {config.name}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.loadingTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
                  <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <h3 className="text-white font-semibold text-sm">Phase {idx + 1}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Specific FAQ Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#0066FF]" />
              <span>Frequently Asked Questions: {config.name} Truck Sizing</span>
            </h2>
            <div className="space-y-3">
              {config.faq.map((faqItem, idx) => (
                <div key={idx} className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-1.5">
                  <h3 className="text-white font-semibold text-sm">{faqItem.question}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{faqItem.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Crawlable Internal Links Mesh */}
          <div className="space-y-4 pt-4 border-t border-[#1F242F]">
            <h2 className="text-base font-bold text-white tracking-tight">
              Compare Other Dwelling Sizing Guides
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allSlugs.map((slug) => {
                const item = getDwellingConfig(slug);
                if (!item) return null;
                const isCurrent = slug === dwelling;
                return (
                  <Link
                    key={slug}
                    href={`/truck-size/${slug}`}
                    className={`p-3 rounded-md border text-xs transition-colors block ${
                      isCurrent
                        ? 'bg-[#FF5500]/15 border-[#FF5500]/40 text-white font-semibold'
                        : 'bg-[#111318] border-[#1F242F] text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    <div className="truncate">{item.name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {item.recommendedTruck}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
