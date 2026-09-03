import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | TruckSizer',
  description: 'Terms and Conditions for using the TruckSizer volumetric moving calculator.',
};

export default function TermsPage() {
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
          <div className="flex items-center gap-1.5 text-xs text-[#FF5500] font-semibold uppercase">
            <FileCheck className="w-4 h-4" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Terms of Use & Estimation Disclaimer</h1>
          <p className="text-xs text-zinc-500">Effective Date: September 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">1. Service Nature & Non-Binding Estimates</h2>
          <p>
            TruckSizer is a spatial modeling and estimating utility. All spatial models, vehicle interior clearances, cargo weight estimates, and box calculators are mathematical approximations based on typical commercial furniture sizes and professional loading standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">2. Vehicle Specifications</h2>
          <p>
            Vehicle specifications reflect standard US rental fleets (U-Haul, Budget, Penske). Real dimensions may vary slightly depending on manufacturing model year, rear roll-up door hardware, and cab configuration. When in doubt, rental companies and professional movers always recommend reserving the next vehicle size up.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-white">3. Limitation of Liability</h2>
          <p>
            TruckSizer and its operators shall not be liable for any physical moving-day cargo overflows, rental vehicle shortages, or damages arising from packing practices.
          </p>
        </section>
      </main>
    </div>
  );
}
