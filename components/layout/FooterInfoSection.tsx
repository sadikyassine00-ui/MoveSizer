'use client';

import React from 'react';
import Link from 'next/link';
import { TRUCKS, TRUCK_ORDER } from '@/lib/constants/trucks';
import { Truck, ShieldCheck, Scale, Compass, CheckCircle2 } from 'lucide-react';
import { FooterDirectory } from '@/components/layout/FooterDirectory';

export function FooterInfoSection() {
  return (
    <section className="border-t border-[#1F242F] bg-[#0B0D12] text-zinc-300 py-12 px-4 sm:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 1. Fleet Comparison Table */}
        <div id="fleet-specs" className="space-y-4 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FF5500]" />
                <span>US Rental Fleet Specifications & Usable Capacity</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Standard interior vehicle bounds reflecting U-Haul, Budget, and Penske commercial cargo boxes.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-medium">
              18% Real-World Packing Buffer Applied
            </span>
          </div>

          <div className="overflow-x-auto rounded-md border border-[#1F242F] bg-[#111318]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1F242F] bg-[#090A0C] text-zinc-400 uppercase text-[11px] tracking-wider">
                  <th className="p-3 font-semibold">Truck Size</th>
                  <th className="p-3 font-semibold">Interior Dimensions</th>
                  <th className="p-3 font-semibold">Gross Volume</th>
                  <th className="p-3 font-semibold">Usable Cap. (82%)</th>
                  <th className="p-3 font-semibold">Max Payload</th>
                  <th className="p-3 font-semibold">Mom&apos;s Attic Shelf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F242F] font-mono">
                {TRUCK_ORDER.map((tid) => {
                  const trk = TRUCKS[tid];
                  const usable = Math.round(trk.volumeCuFt * 0.82);
                  return (
                    <tr key={tid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-sans font-semibold text-white">
                        {trk.name}
                      </td>
                      <td className="p-3 text-zinc-300">
                        {trk.length}″L × {trk.width}″W × {trk.height}″H
                      </td>
                      <td className="p-3 text-zinc-400 tabular-nums">
                        {trk.volumeCuFt} cu ft
                      </td>
                      <td className="p-3 text-[#10B981] font-semibold tabular-nums">
                        {usable} cu ft
                      </td>
                      <td className="p-3 text-zinc-300 tabular-nums">
                        {trk.maxPayloadLbs.toLocaleString()} lbs
                      </td>
                      <td className="p-3 font-sans">
                        {trk.hasAttic && trk.attic ? (
                          <span className="text-[#FF5500] text-xs">
                            {trk.attic.length}″ × {trk.attic.width}″ × {trk.attic.height}″
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs font-mono">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Professional Loading Methodology Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#0066FF]" strokeWidth={1.5} />
            <span>Commercial Cargo Distribution Methodology</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
              <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-semibold text-white text-sm">Side Wall Rails</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Stand mattresses, box springs, and dining table surfaces on edge along side walls ($Z = 0$). Secure with ratchet straps to prevent horizontal tipping.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
              <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-semibold text-white text-sm">Bulkhead Foundation</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Stand sofas vertically on end against the cab wall ($X = 0$). Place solid timber dressers flat on the deck floor to establish a stable low center of gravity.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
              <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-semibold text-white text-sm">Vertical Box Tiers</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Construct dense, ceiling-height vertical columns of corrugated boxes. Stack large heavy boxes on the floor progressing to medium and lightweight small boxes on top.
              </p>
            </div>

            <div className="p-4 rounded-md bg-[#111318] border border-[#1F242F] space-y-2">
              <div className="w-6 h-6 rounded-md bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-semibold text-white text-sm">Mom&apos;s Attic</h3>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Distribute wardrobe hanging boxes, television cartons, and fragile china into the elevated cab shelf ($Y &gt; 50″$). Keep heavy steel and stone out of the attic.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Crawlable Site Directory Mesh */}
        <FooterDirectory />

        {/* 4. Statutory Legal Disclaimer & Compliance */}
        <div className="p-4 rounded-md bg-[#090A0C] border border-[#1F242F] space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Volumetric Modeling & Safety Buffer Compliance Notice
            </h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong>Notice:</strong> All calculations, spatial models, and box counts are mathematical estimates based on standard furniture dimensions and professional loading practices. Vehicle specifications reflect standard US rental fleets (U-Haul, Budget, Penske). When between truck sizes, rental providers always recommend reserving the larger vehicle.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#1F242F] text-xs text-zinc-400">
            <div className="flex items-center gap-4">
              <Link href="/how-we-calculate" className="text-zinc-300 hover:text-white transition-colors underline-offset-2 hover:underline">
                How We Calculate
              </Link>
              <Link href="/privacy" className="text-zinc-300 hover:text-white transition-colors underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-zinc-300 hover:text-white transition-colors underline-offset-2 hover:underline">
                Terms of Service
              </Link>
            </div>
            <div className="text-zinc-400">
              © {new Date().getFullYear()} TruckSizer. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
