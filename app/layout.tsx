import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import StructuredData from '@/components/seo/StructuredData';
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
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className="min-h-screen bg-[#090A0C] text-[#F8F9FA] font-sans antialiased selection:bg-[#FF5500] selection:text-white">
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
