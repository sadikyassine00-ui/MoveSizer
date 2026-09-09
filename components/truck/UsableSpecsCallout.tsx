'use client';

import React from 'react';
import { Ruler, ShieldCheck, Box, AlertCircle, CheckCircle2, Truck, ArrowRight } from 'lucide-react';

export interface UsableSpecsProps {
  truckClass: string;
  deckLength: string;
  interiorWidth: string;
  interiorHeight: string;
  wheelWellWidth?: string;
  wheelWellNote?: string;
  momsAttic?: {
    hasAttic: boolean;
    dims?: string;
    weightRating?: string;
  };
  doorClearance: {
    width: string;
    height: string;
  };
  usableCuFt?: number;
  grossCuFt?: number;
  className?: string;
  subtitle?: string;
}

export function UsableSpecsCallout({
  truckClass,
  deckLength,
  interiorWidth,
  interiorHeight,
  wheelWellWidth = "4' 1\" (49″)",
  wheelWellNote = 'Stand mattresses on edge',
  momsAttic,
  doorClearance,
  usableCuFt,
  grossCuFt,
  className = '',
  subtitle,
}: UsableSpecsProps) {
  const hasAttic = momsAttic?.hasAttic ?? false;
  const atticDims = momsAttic?.dims || "36″L × 76″W × 30″H";
  const atticWeight = momsAttic?.weightRating || '500 lbs max';

  return (
    <section
      aria-labelledby="usable-specs-heading"
      className={`rounded-2xl border border-[#1F242F] bg-gradient-to-b from-[#111318] to-[#0D0F14] p-5 sm:p-6 shadow-xl relative overflow-hidden ${className}`}
    >
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-[#0066FF]/5 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1F242F]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-3 h-3" />
              <span>Real Inside Measurements</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Verified Fleet Laser-Scanned Specs
            </span>
          </div>
          <h2
            id="usable-specs-heading"
            className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2"
          >
            <span>{truckClass} Usable Interior Clearance Callout</span>
          </h2>
          <p className="text-xs text-zinc-400">
            {subtitle ||
              'Standard rental sites report misleading exterior bumper-to-bumper lengths. Here are the exact inside cargo clearances.'}
          </p>
        </div>

        {(usableCuFt || grossCuFt) && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#181B22] border border-[#272D3B] px-3 py-1.5 rounded-lg shrink-0">
            <Box className="w-4 h-4 text-[#10B981]" />
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-white">
                {usableCuFt ? `${usableCuFt} cu ft` : ''}
                {usableCuFt && grossCuFt ? ' / ' : ''}
                {grossCuFt ? <span className="text-zinc-400">{grossCuFt} gross</span> : null}
              </div>
              <div className="text-[10px] text-[#10B981]">18% Safety Buffer Included</div>
            </div>
          </div>
        )}
      </div>

      {/* 7-Point High-Contrast Spec Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-5">
        {/* 1. Advertised Class */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#1F242F] flex flex-col justify-between hover:border-[#2D3546] transition-colors">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Advertised Class
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
              {truckClass}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 leading-tight">
            Nominal fleet size designation
          </div>
        </div>

        {/* 2. Usable Deck Length */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#10B981]/30 flex flex-col justify-between hover:border-[#10B981]/50 transition-colors">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-semibold flex items-center gap-1">
              <span>Usable Floor Deck</span>
            </div>
            <div className="text-base sm:text-lg font-black text-[#10B981] font-mono mt-1">
              {deckLength}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-400 leading-tight">
            Bulkhead to roll-up door
          </div>
        </div>

        {/* 3. Interior Width */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#1F242F] flex flex-col justify-between hover:border-[#2D3546] transition-colors">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Interior Width
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
              {interiorWidth}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 leading-tight">
            Wall-to-wall cargo rails
          </div>
        </div>

        {/* 4. Interior Height */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#1F242F] flex flex-col justify-between hover:border-[#2D3546] transition-colors">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Clearance Height
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
              {interiorHeight}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 leading-tight">
            Floor to ceiling roof ribs
          </div>
        </div>

        {/* 5. Between Wheel Wells */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#FF5500]/30 flex flex-col justify-between hover:border-[#FF5500]/50 transition-colors">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#FF5500] font-semibold">
              Between Wheel Wells
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
              {wheelWellWidth}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[#FF5500]/90 leading-tight font-medium">
            {wheelWellNote}
          </div>
        </div>

        {/* 6. Mom's Attic Shelf */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-colors ${
            hasAttic
              ? 'bg-[#0066FF]/10 border-[#0066FF]/40 hover:border-[#0066FF]'
              : 'bg-[#141720] border-[#1F242F] hover:border-zinc-700'
          }`}
        >
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
              <span className={hasAttic ? 'text-[#0066FF] font-semibold' : 'text-zinc-400'}>
                Mom&apos;s Attic Shelf
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black font-mono mt-1 text-white">
              {hasAttic ? atticDims : 'None / Flat Wall'}
            </div>
          </div>
          <div className="mt-2">
            {hasAttic ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0066FF] font-bold">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>{atticWeight}</span>
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 leading-tight">
                Continuous ceiling height
              </span>
            )}
          </div>
        </div>

        {/* 7. Door Opening Clearance */}
        <div className="p-3.5 rounded-xl bg-[#141720] border border-[#1F242F] flex flex-col justify-between hover:border-[#2D3546] transition-colors col-span-2 sm:col-span-1">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Roll-Up Door Opening
            </div>
            <div className="text-base sm:text-lg font-black text-white font-mono mt-1">
              {doorClearance.width} &times; {doorClearance.height}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 leading-tight">
            Maximum entry dimensions
          </div>
        </div>
      </div>
    </section>
  );
}

export default UsableSpecsCallout;
