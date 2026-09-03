import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

export const metadata: Metadata = {
  title: 'Privacy Policy | TruckSizer',
  description: 'Privacy Policy and CPL lead data handling standards for TruckSizer users.',
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | TruckSizer',
    description: 'Privacy Policy and CPL lead data handling standards for TruckSizer users.',
    url: `${baseUrl}/privacy`,
    type: 'website',
    siteName: 'TruckSizer',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-base hover:opacity-90">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>TRUCK<span className="text-[#FF5500]">SIZER</span></span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-6 text-zinc-300 text-xs sm:text-sm leading-relaxed">
        <div className="space-y-1 border-b border-[#1F242F] pb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#0066FF] font-semibold uppercase">
            <Shield className="w-4 h-4" />
            <span>Legal & Privacy</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          <p className="text-xs text-zinc-500">Effective Date: September 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">1. Information We Collect</h2>
          <p>
            When you request moving estimates or lock in verified mover rates, we collect the details you provide: Origin ZIP code, Destination ZIP code, planned Move Date, and Email Address. We also store the estimated cubic footage of your cargo load to calculate accurate pricing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">2. How We Use Your Data</h2>
          <p>
            Your lead information is transmitted securely to licensed moving companies and verified broker networks matching your route and truck capacity. We never sell your personal contact information to unrelated third-party marketers or spam lists.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">3. Security & Retention</h2>
          <p>
            All lead payloads are encrypted in transit using industry-standard TLS protocols. You may request deletion of your stored quote requests at any time by contacting privacy@trucksizer.com.
          </p>
        </section>
      </main>
    </div>
  );
}
