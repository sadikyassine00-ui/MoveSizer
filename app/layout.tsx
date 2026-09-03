import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TruckSizer — Moving Truck Cargo Fit & Sizing Engine',
    template: '%s | TruckSizer',
  },
  description:
    'Architectural 2.5D visual load planner, spatial volume calculator, and commercial rate verification for US rental moving trucks.',
  keywords: [
    'moving truck sizing',
    'what size moving truck',
    'moving truck calculator',
    'cargo volume visualizer',
    'will it fit moving truck',
    'u-haul size calculator',
    'moving box estimator',
  ],
  authors: [{ name: 'TruckSizer Engineering Team' }],
  creator: 'TruckSizer',
  publisher: 'TruckSizer',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TruckSizer — Moving Truck Cargo Fit & Sizing Engine',
    description:
      'Interactive 2.5D isometric load visualizer and volumetric sizing calculator for moving trucks.',
    url: siteUrl,
    siteName: 'TruckSizer',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TruckSizer — Moving Truck Cargo Fit & Sizing Engine',
    description:
      'Interactive 2.5D isometric load visualizer and volumetric sizing calculator for moving trucks.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const rootJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'TruckSizer',
  url: siteUrl,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript and HTML5 Canvas support.',
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'USD',
  },
  featureList: [
    '2.5D isometric cutaway moving truck visualizer',
    '18% real-world packing inefficiency buffer modeling',
    'Dynamic household box count estimation',
    'US rental truck specs (10ft, 15ft, 20ft, 26ft)',
    'Heuristic 3D Cartesian item packing engine',
    'Printable certified load manifest PDF export',
  ],
  description:
    'High-performance 2.5D visual load planner and volumetric sizing calculator for commercial moving trucks.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#090A0C] text-[#F8F9FA] font-sans antialiased selection:bg-[#FF5500] selection:text-white">
        {children}
      </body>
    </html>
  );
}
