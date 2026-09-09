'use client';

import React, { useState } from 'react';
import { ComparisonVehicle } from '@/lib/data/truckComparisons';
import { UsableSpecsCallout } from '@/components/truck/UsableSpecsCallout';
import {
  Ruler,
  Maximize2,
  ArrowUpDown,
  Box,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface UsableSpecsCompareSectionProps {
  vehicleA: ComparisonVehicle;
  vehicleB: ComparisonVehicle;
}

export function UsableSpecsCompareSection({
  vehicleA,
  vehicleB,
}: UsableSpecsCompareSectionProps) {
  const [viewMode, setViewMode] = useState<'compare' | 'vehicleA' | 'vehicleB'>('compare');

  // Computed deltas
  const lengthDiffInches = vehicleB.interiorLengthIn - vehicleA.interiorLengthIn;
  const widthDiffInches = vehicleB.interiorWidthIn - vehicleA.interiorWidthIn;
  const heightDiffInches = vehicleB.interiorHeightIn - vehicleA.interiorHeightIn;
  const volumeDiffCuFt = vehicleB.usableCuFt - vehicleA.usableCuFt;
  const volumeDiffPercent = Math.round((volumeDiffCuFt / vehicleA.usableCuFt) * 100);

  const specRows = [
    {
      label: 'Usable Floor Deck Length',
      description: 'Front bulkhead to rear roll-up door (actual flat cargo floor)',
      icon: Ruler,
      valA: `${vehicleA.lengthFt} (${vehicleA.interiorLengthIn}″)`,
      valB: `${vehicleB.lengthFt} (${vehicleB.interiorLengthIn}″)`,
      impact:
        lengthDiffInches > 0
          ? `+${Math.round(lengthDiffInches / 12)}' ${lengthDiffInches % 12}″ (+${lengthDiffInches}″) extra floor deck on ${vehicleB.name}`
          : 'Identical floor length',
      isAdvantageB: lengthDiffInches > 0,
    },
    {
      label: 'Interior Usable Width',
      description: 'Wall-to-wall clearance inside cargo tie-down rails',
      icon: Maximize2,
      valA: `${vehicleA.widthFt} (${vehicleA.interiorWidthIn}″)`,
      valB: `${vehicleB.widthFt} (${vehicleB.interiorWidthIn}″)`,
      impact:
        widthDiffInches > 0
          ? `+${widthDiffInches}″ wider cargo deck on ${vehicleB.name}`
          : 'Identical usable width',
      isAdvantageB: widthDiffInches > 0,
    },
    {
      label: 'Interior Clearance Height',
      description: 'Floor deck to ceiling roof bows (vertical headroom)',
      icon: ArrowUpDown,
      valA: `${vehicleA.heightFt} (${vehicleA.interiorHeightIn}″)`,
      valB: `${vehicleB.heightFt} (${vehicleB.interiorHeightIn}″)`,
      impact:
        heightDiffInches > 0
          ? `+${heightDiffInches}″ taller ceiling height on ${vehicleB.name}`
          : 'Equal vertical clearance',
      isAdvantageB: heightDiffInches > 0,
    },
    {
      label: 'Width Between Wheel Wells',
      description: 'Choke-point width between interior wheel arches',
      icon: Truck,
      valA: vehicleA.interiorWidthIn >= 90 ? "4' 1\" (49″)" : "Flush / 4' 2\" (50″)",
      valB: vehicleB.interiorWidthIn >= 90 ? "4' 1\" (49″)" : "Flush / 4' 2\" (50″)",
      impact: 'Queen mattresses stand on edge; King mattress requires clearance above wells',
      isAdvantageB: false,
    },
    {
      label: "Mom's Attic Cabover Shelf",
      description: 'Dedicated elevated storage shelf extending over vehicle cab',
      icon: Box,
      valA: vehicleA.hasMomsAttic
        ? vehicleA.atticDims || '36″L × 76″W × 30″H (48 cu ft)'
        : 'None (Flat Bulkhead Wall)',
      valB: vehicleB.hasMomsAttic
        ? vehicleB.atticDims || '36″L × 76″W × 30″H (48 cu ft)'
        : 'None (Flat Bulkhead Wall)',
      impact:
        vehicleB.hasMomsAttic && !vehicleA.hasMomsAttic
          ? `Dedicated 500-lb rated shelf on ${vehicleB.name} protects fragile boxes`
          : vehicleA.hasMomsAttic && !vehicleB.hasMomsAttic
          ? `Dedicated 500-lb rated shelf on ${vehicleA.name}`
          : 'Both models share cabover configuration',
      isAdvantageB: vehicleB.hasMomsAttic && !vehicleA.hasMomsAttic,
    },
    {
      label: 'Roll-Up Door Clearance',
      description: 'Clear pass-through dimensions when roll-up door is fully raised',
      icon: Layers,
      valA: `${vehicleA.doorRollupWidthIn}″ W × ${vehicleA.doorRollupHeightIn}″ H`,
      valB: `${vehicleB.doorRollupWidthIn}″ W × ${vehicleB.doorRollupHeightIn}″ H`,
      impact: `${vehicleB.doorRollupWidthIn}″ doorway accommodates large pre-assembled dressers`,
      isAdvantageB: vehicleB.doorRollupWidthIn >= vehicleA.doorRollupWidthIn,
    },
    {
      label: 'Usable Cargo Volume',
      description: 'Realistic packing capacity with standard 18% void buffer included',
      icon: ShieldCheck,
      valA: `${vehicleA.usableCuFt} cu ft (${vehicleA.volumeCuFt} gross)`,
      valB: `${vehicleB.usableCuFt} cu ft (${vehicleB.volumeCuFt} gross)`,
      impact: `+${volumeDiffCuFt} cu ft (+${volumeDiffPercent}%) more usable storage space on ${vehicleB.name}`,
      isAdvantageB: volumeDiffCuFt > 0,
    },
  ];

  return (
    <section
      aria-labelledby="usable-specs-comparison-heading"
      className="space-y-4 rounded-2xl border border-[#1F242F] bg-gradient-to-b from-[#111318] to-[#0D0F14] p-5 sm:p-7 shadow-xl"
    >
      {/* Top Header & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1F242F]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-3 h-3" />
              <span>Direct Head-to-Head Clearances</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Verified Laser-Measured Interior Specs
            </span>
          </div>
          <h2
            id="usable-specs-comparison-heading"
            className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1.5"
          >
            Verified Usable Interior Specs: Side-by-Side Comparison
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Real floor-to-ceiling and wall-to-wall measurements compared head-to-head. Don&apos;t get misled by exterior bumper lengths.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#090A0C] border border-[#1F242F] self-start md:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'compare'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Direct Comparison</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('vehicleA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'vehicleA'
                ? 'bg-[#0066FF] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{vehicleA.name}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('vehicleB')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'vehicleB'
                ? 'bg-[#10B981] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>{vehicleB.name}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Direct Head-to-Head Comparison Matrix (Spacious & Natural on the Eye) */}
      {viewMode === 'compare' && (
        <div className="space-y-4 pt-2">
          {/* Column Header Summary Bar (Desktop) */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-3 rounded-xl bg-[#151821] border border-[#1F242F] text-xs font-mono uppercase tracking-wider text-zinc-400 items-center">
            <div className="col-span-4 font-semibold text-zinc-300">Dimension / Clearance</div>
            <div className="col-span-3 font-bold text-[#0066FF] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
              <span>{vehicleA.name}</span>
            </div>
            <div className="col-span-3 font-bold text-[#10B981] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>{vehicleB.name} (Recommended)</span>
            </div>
            <div className="col-span-2 text-right font-semibold text-zinc-300">Impact &amp; Delta</div>
          </div>

          {/* Metric Rows */}
          <div className="space-y-3">
            {specRows.map((row, idx) => {
              const Icon = row.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#1F242F] bg-[#12151D] p-4 sm:p-5 hover:border-[#2D3546] transition-all flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center shadow-md"
                >
                  {/* Metric Title & Description */}
                  <div className="col-span-4 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#181B24] border border-[#272D3B] flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#FF5500]" />
                      </div>
                      <span className="text-sm font-bold text-white tracking-tight">
                        {row.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-9 leading-relaxed">
                      {row.description}
                    </p>
                  </div>

                  {/* Vehicle A Value Card */}
                  <div className="col-span-3 w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 bg-[#090A0C] lg:bg-transparent px-3 py-2 lg:p-0 rounded-lg border border-[#1F242F] lg:border-0">
                    <span className="text-[11px] font-mono text-zinc-400 lg:hidden">
                      {vehicleA.name}:
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono text-[#38BDF8]">
                      {row.valA}
                    </span>
                  </div>

                  {/* Vehicle B Value Card */}
                  <div className="col-span-3 w-full lg:w-auto flex items-center justify-between lg:justify-start gap-2 bg-[#090A0C] lg:bg-transparent px-3 py-2 lg:p-0 rounded-lg border border-[#1F242F] lg:border-0">
                    <span className="text-[11px] font-mono text-zinc-400 lg:hidden">
                      {vehicleB.name}:
                    </span>
                    <span className="text-sm sm:text-base font-black font-mono text-[#10B981]">
                      {row.valB}
                    </span>
                  </div>

                  {/* Impact & Advantage Pill */}
                  <div className="col-span-2 w-full lg:w-auto lg:text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium leading-tight ${
                        row.isAdvantageB
                          ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold'
                          : 'bg-[#181B22] text-zinc-300 border border-[#272D3B]'
                      }`}
                    >
                      {row.impact}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Full-Width Card for Vehicle A */}
      {viewMode === 'vehicleA' && (
        <div className="pt-2">
          <UsableSpecsCallout
            truckClass={vehicleA.name}
            deckLength={`${vehicleA.lengthFt} (${vehicleA.interiorLengthIn}″)`}
            interiorWidth={`${vehicleA.widthFt} (${vehicleA.interiorWidthIn}″)`}
            interiorHeight={`${vehicleA.heightFt} (${vehicleA.interiorHeightIn}″)`}
            wheelWellWidth={vehicleA.interiorWidthIn >= 90 ? "4' 1\" (49″)" : "Flush / 4' 2\" (50″)"}
            wheelWellNote={
              vehicleA.interiorWidthIn >= 90 ? 'Stand mattresses on edge' : 'Flat floor / No intrusion'
            }
            momsAttic={{
              hasAttic: vehicleA.hasMomsAttic,
              dims: vehicleA.atticDims,
              weightRating: '500 lbs max',
            }}
            doorClearance={{
              width: `${vehicleA.doorRollupWidthIn}″`,
              height: `${vehicleA.doorRollupHeightIn}″`,
            }}
            usableCuFt={vehicleA.usableCuFt}
            grossCuFt={vehicleA.volumeCuFt}
            subtitle={`Complete verified interior clearances and doorway dimensions for the ${vehicleA.name}.`}
          />
        </div>
      )}

      {/* VIEW 3: Full-Width Card for Vehicle B */}
      {viewMode === 'vehicleB' && (
        <div className="pt-2">
          <UsableSpecsCallout
            truckClass={vehicleB.name}
            deckLength={`${vehicleB.lengthFt} (${vehicleB.interiorLengthIn}″)`}
            interiorWidth={`${vehicleB.widthFt} (${vehicleB.interiorWidthIn}″)`}
            interiorHeight={`${vehicleB.heightFt} (${vehicleB.interiorHeightIn}″)`}
            wheelWellWidth={vehicleB.interiorWidthIn >= 90 ? "4' 1\" (49″)" : "Flush / 4' 2\" (50″)"}
            wheelWellNote={
              vehicleB.interiorWidthIn >= 90 ? 'Stand mattresses on edge' : 'Flat floor / No intrusion'
            }
            momsAttic={{
              hasAttic: vehicleB.hasMomsAttic,
              dims: vehicleB.atticDims,
              weightRating: '500 lbs max',
            }}
            doorClearance={{
              width: `${vehicleB.doorRollupWidthIn}″`,
              height: `${vehicleB.doorRollupHeightIn}″`,
            }}
            usableCuFt={vehicleB.usableCuFt}
            grossCuFt={vehicleB.volumeCuFt}
            subtitle={`Complete verified interior clearances and doorway dimensions for the ${vehicleB.name}.`}
          />
        </div>
      )}
    </section>
  );
}

export default UsableSpecsCompareSection;
