import React from 'react';
import {
  Ruler,
  ArrowLeftRight,
  ArrowUpDown,
  DoorClosed,
  Box,
  Scale,
  Footprints,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { DimensionSpec } from '@/lib/seo/dimensions';

interface VehicleSpecMatrixProps {
  spec: DimensionSpec;
  className?: string;
}

interface SpecRowData {
  id: string;
  metric: string;
  shortMetric?: string;
  icon: React.ComponentType<{ className?: string }>;
  clearance: string;
  clearanceSubtext?: string;
  whatActuallyFits: string;
  badge: {
    text: string;
    variant: 'emerald' | 'amber' | 'blue' | 'zinc';
  };
  isChokePoint?: boolean;
}

export default function VehicleSpecMatrix({
  spec,
  className = '',
}: VehicleSpecMatrixProps) {
  const dims = spec.dimensions;
  const is10ft = spec.truckId === '10ft';
  const is20ft = spec.truckId === '20ft';
  const is26ft = spec.truckId === '26ft';

  // Dynamic real-world fit copy tailored to truck class
  const lengthFitsText = is10ft
    ? 'Accommodates standard 80" Queen mattress on edge or 84" 3-seat sofa stood vertically'
    : is20ft
    ? 'Full 20-foot runway fits complete living room suites, long dining sets & L-shaped sectionals'
    : is26ft
    ? 'Massive 26-foot continuous runway fits 4–5 bedroom whole-home furniture loads'
    : 'Accommodates 84" couches & dining tables with room for multi-tier box stacks behind';

  const lengthBadge = is10ft
    ? 'Queen Bed & Upright Sofa'
    : is20ft
    ? 'Sectional & Dining Safe'
    : is26ft
    ? 'Full Household Runway'
    : 'Full-Size Sofa Safe';

  const widthFitsText = is10ft
    ? 'Fits standard 80" mattress on edge plus 2 parallel columns of medium moving boxes'
    : 'Allows Queen mattress (80" long) on edge with side clearance for multiple box tiers';

  const heightFitsText =
    dims.heightInches >= 86
      ? `${dims.heightInches}" ceiling supports standing Queen mattress (80") & 4–5 stacked box tiers`
      : `${dims.heightInches}" ceiling supports standing Queen mattress on edge with vertical clearance`;

  const rows: SpecRowData[] = [
    {
      id: 'length',
      metric: 'Interior Length',
      shortMetric: 'Length',
      icon: Ruler,
      clearance: `${dims.lengthFeet} (${dims.lengthInches}")`,
      whatActuallyFits: lengthFitsText,
      badge: {
        text: lengthBadge,
        variant: 'emerald',
      },
    },
    {
      id: 'width',
      metric: 'Interior Width',
      shortMetric: 'Width',
      icon: ArrowLeftRight,
      clearance: `${dims.widthFeet} (${dims.widthInches}")`,
      whatActuallyFits: widthFitsText,
      badge: {
        text: 'Edge Mattress Fit',
        variant: 'emerald',
      },
    },
    {
      id: 'height',
      metric: 'Interior Height (Ceiling)',
      shortMetric: 'Ceiling Height',
      icon: ArrowUpDown,
      clearance: `${dims.heightFeet} (${dims.heightInches}")`,
      whatActuallyFits: heightFitsText,
      badge: {
        text: 'Vertical Mattress Fit',
        variant: 'emerald',
      },
    },
    {
      id: 'door',
      metric: 'Door Opening (Choke Point)',
      shortMetric: 'Door Choke Point',
      icon: DoorClosed,
      clearance: `${dims.doorRollupWidthInches}"W × ${dims.doorRollupHeightInches}"H`,
      clearanceSubtext: 'Roll-Up Clearance',
      whatActuallyFits:
        'Entry threshold for standard double-door refrigerators, tall armoires & vertical sofas',
      badge: {
        text: 'Standard Fridge & Armoires',
        variant: 'amber',
      },
      isChokePoint: true,
    },
    {
      id: 'volume',
      metric: 'Usable Cargo Volume',
      shortMetric: 'Usable Volume',
      icon: Box,
      clearance: `${dims.usableVolumeCuFt} cu ft`,
      clearanceSubtext: `${dims.grossVolumeCuFt} cu ft gross`,
      whatActuallyFits:
        '82% net usable volume factoring in real-world furniture voids, wheel wells & irregular shapes',
      badge: {
        text: '18% Buffer Included',
        variant: 'blue',
      },
    },
    {
      id: 'deck',
      metric: 'Deck Height (Step-In)',
      shortMetric: 'Deck Height',
      icon: Footprints,
      clearance: `${dims.deckHeightInches}" (${Math.round((dims.deckHeightInches / 12) * 10) / 10}')`,
      whatActuallyFits:
        dims.deckHeightInches <= 30
          ? 'Low-deck lowered frame minimizes ramp incline angle for easy walk-in loading'
          : 'Commercial truck chassis height; requires momentum when wheeling heavy dollies',
      badge: {
        text: dims.deckHeightInches <= 30 ? 'Low-Deck Walk-In' : 'Commercial Chassis',
        variant: dims.deckHeightInches <= 30 ? 'emerald' : 'zinc',
      },
    },
    {
      id: 'ramp',
      metric: 'Loading Ramp',
      shortMetric: 'Loading Ramp',
      icon: TrendingUp,
      clearance: dims.loadingRamp ? 'Wide Aluminum Ramp' : 'No Ramp Included',
      whatActuallyFits: dims.loadingRamp
        ? 'Rolls 2-wheel appliance dollies & stacked box columns smoothly into bed'
        : 'Manual 25" lift off ground; 2 people strictly required for sofas & heavy appliances',
      badge: {
        text: dims.loadingRamp ? 'Dolly-Friendly Ramp' : 'Manual Lifting Required',
        variant: dims.loadingRamp ? 'emerald' : 'amber',
      },
      isChokePoint: !dims.loadingRamp,
    },
    {
      id: 'attic',
      metric: "Mom's Attic (Cab Shelf)",
      shortMetric: "Mom's Attic",
      icon: Warehouse,
      clearance: dims.hasAttic ? `${dims.atticDims || '36"L × 76"W × 30"H'}` : 'None (Flat Bulkhead)',
      clearanceSubtext: dims.hasAttic ? '48 cu ft shelf' : undefined,
      whatActuallyFits: dims.hasAttic
        ? 'Elevated cab compartment protects fragile boxes, electronics & wardrobe cartons from heavy cargo'
        : 'Direct vertical front bulkhead; wardrobe boxes must be anchored flat on deck',
      badge: {
        text: dims.hasAttic ? 'Fragiles & Wardrobe Boxes' : 'Flat Bulkhead',
        variant: dims.hasAttic ? 'emerald' : 'zinc',
      },
    },
    {
      id: 'payload',
      metric: 'Maximum Cargo Payload',
      shortMetric: 'Max Payload',
      icon: Scale,
      clearance: `${dims.maxPayloadLbs.toLocaleString()} lbs`,
      whatActuallyFits:
        'Maximum safe cargo weight limit before rear axle suspension compression occurs',
      badge: {
        text: 'Suspension Rated',
        variant: 'blue',
      },
    },
  ];

  const getBadgeStyle = (variant: 'emerald' | 'amber' | 'blue' | 'zinc') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'amber':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'blue':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'zinc':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <section
      aria-labelledby="specs-matrix-heading"
      className={`rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl ${className}`}
    >
      {/* Header Bar */}
      <div className="px-4 sm:px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2
              id="specs-matrix-heading"
              className="text-base sm:text-lg font-bold text-white tracking-tight"
            >
              {dims.lengthFeet} Truck Dimensions &amp; Real-World Clearance Guide
            </h2>
            <p className="text-xs text-slate-400">
              Dimensional Cheat Sheet &bull; Verified clearances for major household items
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>18% Void Buffer Included</span>
          </span>
        </div>
      </div>

      {/* Semantic 3-Column HTML Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-left border-collapse min-w-[620px] sm:min-w-full">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs font-mono uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6 font-semibold w-[28%]">
                Dimension &amp; Choke Point
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 font-semibold w-[24%]">
                Clear Clearance
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 font-semibold w-[48%]">
                &ldquo;What Actually Fits&rdquo; (The Anxiety-Killer)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm text-slate-200">
            {rows.map((row) => {
              const IconComponent = row.icon;
              const isChoke = row.isChokePoint;

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    isChoke
                      ? 'bg-amber-500/5 border-l-4 border-l-amber-500 hover:bg-amber-500/10'
                      : 'even:bg-slate-800/25 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Column 1: Dimension & Choke Point */}
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-white">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                          isChoke
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-white block">
                          {row.metric}
                        </span>
                        {isChoke && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            Critical Entry Check
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Clear Clearance (Consolidated, No Redundant Unit Columns) */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-white">
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base text-orange-400 tracking-tight">
                        {row.clearance}
                      </span>
                      {row.clearanceSubtext && (
                        <span className="text-[11px] font-normal text-slate-400">
                          {row.clearanceSubtext}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 3: What Actually Fits (The Anxiety-Killer) */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans pr-2">
                        {row.whatActuallyFits}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 self-start sm:self-center tracking-wide whitespace-nowrap ${getBadgeStyle(
                          row.badge.variant
                        )}`}
                      >
                        {row.badge.text}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile-Friendly Bottom Scroll Hint / Disclaimer */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="hidden sm:inline">
          Data verified against standard US rental fleets (U-Haul, Budget, Penske).
        </span>
        <span className="sm:hidden text-amber-400/90 font-mono">
          &larr; Swipe table horizontally for full fit breakdown &rarr;
        </span>
        <span className="font-mono text-emerald-400 font-medium">
          Zero False Over-Capacity Guarantees
        </span>
      </div>
    </section>
  );
}
