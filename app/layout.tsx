import type { Metadata } from 'next';
import { Barlow_Condensed, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-barlow-condensed',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TruckSizer - Industrial 2.5D Moving Truck Cargo Volume Visualizer',
  description:
    'Engineered moving truck sizing calculator with 2.5D isometric cargo load visualization and real-world packing heuristics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${barlowCondensed.variable} ${jakarta.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-screen bg-[#090A0C] text-[#F8F9FA] font-sans antialiased selection:bg-[#FF5500] selection:text-white">
        {children}
      </body>
    </html>
  );
}
