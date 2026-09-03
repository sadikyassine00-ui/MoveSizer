import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';
import { AppShell } from '@/components/layout/AppShell';

interface Props {
  params: Promise<{ dwelling: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dwelling } = await params;
  const config = DWELLING_SLUG_MAP[dwelling];

  if (!config) {
    return {
      title: 'Truck Size Guide | TruckSizer',
    };
  }

  return {
    title: `What Size Moving Truck for a ${config.title}? (Visual Fit Guide)`,
    description: `Accurate sizing calculator and 2.5D visual load plan for a ${config.title}. Find box counts and compare verified moving quotes.`,
    alternates: {
      canonical: `/truck-size/${dwelling}`,
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

  if (!config) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TruckSizer — Moving Truck Size for ${config.title}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description: `2.5D visual load planner and cargo calculator for ${config.title}. Recommended truck: ${config.defaultTruck}.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppShell
        initialPreset={config.presetId}
        initialTruckId={config.defaultTruck}
      />
    </>
  );
}
