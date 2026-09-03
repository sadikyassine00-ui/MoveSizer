import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calculator, ShieldCheck, Layers, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Calculate Moving Truck Volume & Fit | TruckSizer',
  description:
    'Engineering methodology behind TruckSizer volumetric calculations, box density multipliers, and 18% real-world packing inefficiency buffers.',
};

export default function HowWeCalculatePage() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F8F9FA] flex flex-col font-sans">
      <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-base hover:opacity-90">
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>TRUCK<span className="text-[#FF5500]">SIZER</span></span>
        </Link>
        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold transition-colors"
        >
          Open Visualizer
        </Link>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
        <div className="space-y-2 border-b border-[#1F242F] pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0066FF] uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Engineering Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            How We Calculate Moving Truck Sizing & Spatial Volume
          </h1>
          <p className="text-sm text-zinc-400">
            A transparent overview of our volumetric formulas, safety margins, and heuristic 3D load planning engine.
          </p>
        </div>

        {/* Section 1: The 18% Packing Buffer */}
        <section className="space-y-3 bg-[#111318] border border-[#1F242F] p-5 rounded-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" strokeWidth={1.5} />
            <span>The Mandatory 18% Real-World Packing Inefficiency Buffer</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Raw cubic volume advertised by truck rental companies represents total empty water-tight volume. In real moves, irregular furniture silhouettes, wheel wells, mattress tapers, and packing voids make 100% volumetric utilization physically impossible.
          </p>
          <div className="bg-[#090A0C] p-3.5 rounded-md border border-[#1F242F] font-mono text-xs text-zinc-300 space-y-1">
            <div>Usable Capacity = Interior Truck Volume (cu ft) × 0.82</div>
            <div>Fill Percentage = (∑ Item Volume / Usable Capacity) × 100</div>
          </div>
          <p className="text-xs text-zinc-400">
            Status thresholds: 0%–70% (Optimal fit), 71%–85% (Tight fit, requires professional ceiling-height stacking), &gt;85% (Critical capacity, upgrade recommended).
          </p>
        </section>

        {/* Section 2: Box Count Formulas */}
        <section className="space-y-3 bg-[#111318] border border-[#1F242F] p-5 rounded-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FF5500]" strokeWidth={1.5} />
            <span>Box Estimation Formulas & Density Multipliers</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Box counts are modeled dynamically based on bedroom counts, occupant totals, and personal packing density:
          </p>
          <div className="bg-[#090A0C] p-3.5 rounded-md border border-[#1F242F] font-mono text-xs text-zinc-300 space-y-1">
            <div>Total Boxes = ((Bedrooms × 20) + (Occupants × 10)) × Density Multiplier</div>
            <div className="text-zinc-500 pt-1">
              Multipliers: Minimalist (0.8x) • Standard (1.0x) • Packrat (1.35x)
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
            <div className="p-3 bg-[#090A0C] rounded-md border border-[#1F242F]">
              <div className="text-zinc-500">Small (1.5 cu ft)</div>
              <div className="font-bold text-white mt-0.5">30% of total</div>
            </div>
            <div className="p-3 bg-[#090A0C] rounded-md border border-[#1F242F]">
              <div className="text-zinc-500">Medium (3.0 cu ft)</div>
              <div className="font-bold text-white mt-0.5">45% of total</div>
            </div>
            <div className="p-3 bg-[#090A0C] rounded-md border border-[#1F242F]">
              <div className="text-zinc-500">Large (4.5 cu ft)</div>
              <div className="font-bold text-white mt-0.5">15% of total</div>
            </div>
            <div className="p-3 bg-[#090A0C] rounded-md border border-[#1F242F]">
              <div className="text-zinc-500">Wardrobe (16 cu ft)</div>
              <div className="font-bold text-white mt-0.5">Bedrooms × 2 (min 2)</div>
            </div>
          </div>
        </section>

        {/* Section 3: 4-Phase Heuristic Engine */}
        <section className="space-y-3 bg-[#111318] border border-[#1F242F] p-5 rounded-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#0066FF]" strokeWidth={1.5} />
            <span>5-Phase Isometric Auto-Pack Heuristic</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Our packing algorithm converts active inventories into exact 3D Cartesian coordinates [x, y, z] through a structured commercial loading sequence:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-300">
            <li><strong>Phase 1 (Left Wall):</strong> Snaps mattresses, foundations, and tabletops along Z = 0 on edge along the X axis.</li>
            <li><strong>Phase 2 (Front Bulkhead):</strong> Snaps sofas vertically and places heavy dressers flat on the deck floor ($Y = 0$).</li>
            <li><strong>Phase 3 (Floor Deck):</strong> Distributes remaining desks, nightstands, and heavy furniture into open floor deck coordinates.</li>
            <li><strong>Phase 4 (Mom&apos;s Attic):</strong> Routes wardrobe boxes, fragile parcels, and lightweight goods into the elevated cab shelf.</li>
            <li><strong>Phase 5 (Box Columns):</strong> Consolidates small, medium, and large boxes into dense, floor-to-ceiling vertical tiers.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
