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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  if (!config) {
    return {
      title: 'Truck Size Guide | TruckSizer',
    };
  }

  const title = `What Size Moving Truck for a ${config.title}? (Visual Fit Guide)`;
  const description = `Accurate sizing calculator and 2.5D visual load plan for a ${config.title}. Find box counts, interior vehicle clearances, and compare verified moving quotes.`;
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
    description: `2.5D visual load planner and cargo calculator for ${config.title}. Recommended truck: ${config.defaultTruck}.`,
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
          text: `For a ${config.title}, commercial moving truck providers recommend a ${config.defaultTruck} vehicle. This provides sufficient usable volume and payload for standard bedroom furniture and household goods after applying an 18% packing inefficiency safety buffer.`,
        },
      },
      {
        '@type': 'Question',
        name: `How many boxes do I need for a ${config.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A standard ${config.title} with typical occupancy requires between 30 and 80 total corrugated boxes, distributed into 30% small boxes (1.5 cu ft), 45% medium boxes (3.0 cu ft), 15% large boxes (4.5 cu ft), and at least 2 to 6 wardrobe boxes for hanging garments.`,
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

  return (
    <>
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
      <AppShell
        initialPreset={config.presetId}
        initialTruckId={config.defaultTruck}
      />
    </>
  );
}
