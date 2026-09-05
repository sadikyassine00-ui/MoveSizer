'use client';

import React, { useEffect, useRef } from 'react';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { TruckId } from '@/lib/constants/trucks';
import { ShieldCheck, AlertTriangle, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';
import { trackCapacityThresholdCrossed, trackSizeUpClicked } from '@/lib/analytics/events';

interface CapacityGaugeProps {
  capacityResult: CapacityCalculationResult;
  unpackedCount?: number;
  onUpgradeTruck?: (nextTruckId: TruckId) => void;
  className?: string;
}

export function CapacityGauge({
  capacityResult,
  unpackedCount = 0,
  onUpgradeTruck,
  className = '',
}: CapacityGaugeProps) {
  const {
    fillPercentage,
    status,
    totalVolumeCuFt,
    usableCapacityCuFt,
    interiorVolumeCuFt,
    totalWeightLbs,
    maxPayloadLbs,
    isOverweight,
    nextTruck,
    needsUpgrade,
  } = capacityResult;

  const volumeUtilization = capacityResult.volumeUtilization ?? (
    usableCapacityCuFt > 0 ? totalVolumeCuFt / usableCapacityCuFt : 0
  );
  const isVolumetricFit = volumeUtilization <= 1.0;

  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status !== 'optimal' && status !== prevStatusRef.current) {
      trackCapacityThresholdCrossed(status, fillPercentage, capacityResult.truck.id);
    }
    prevStatusRef.current = status;
  }, [status, fillPercentage, capacityResult.truck.id]);

  // Status strictly adheres to capacity spec and physical reality:
  // - Critical (>85% fill, or unpacked items when tight/overfilled, or overweight)
  // - Caution (71% - 85% fill, or any unpacked items)
  // - Optimal (0% - 70% fill AND all items packed)
  // Strict Warning Suppression (<75% Capacity):
  // If the truck is under 75% full (and no physical unpacked items and not overweight),
  // maintain a confident green badge: 'Comfortable Fit • Extra Clearance Available'
  // and completely suppress upgrade messages.
  const isComfortableFit = fillPercentage < 75 && unpackedCount === 0 && !isOverweight;

  const effectiveStatus: 'optimal' | 'caution' | 'critical' =
    isOverweight || fillPercentage > 85 || (unpackedCount > 0 && fillPercentage >= 75)
      ? 'critical'
      : !isComfortableFit
      ? 'caution'
      : 'optimal';

  const statusConfig = {
    optimal: {
      barColor: 'bg-[#10B981]',
      textColor: 'text-[#10B981]',
      borderColor: 'border-[#10B981]/30',
      badgeBg: 'bg-[#10B981]/15',
      label: 'Comfortable Fit • Extra Clearance Available',
      icon: CheckCircle2,
    },
    caution: {
      barColor: 'bg-[#F59E0B]',
      textColor: 'text-[#F59E0B]',
      borderColor: 'border-[#F59E0B]/30',
      badgeBg: 'bg-[#F59E0B]/15',
      label: unpackedCount > 0 ? `Tight Fit • ${unpackedCount} Exceeded` : `Tight Fit • ${fillPercentage}% Full`,
      icon: AlertTriangle,
    },
    critical: {
      barColor: 'bg-[#EF4444]',
      textColor: 'text-[#EF4444]',
      borderColor: 'border-[#EF4444]/30',
      badgeBg: 'bg-[#EF4444]/15',
      label: unpackedCount > 0 ? `Exceeds Capacity • ${unpackedCount} Exceeded` : `Over Capacity • ${fillPercentage}% Full`,
      icon: AlertTriangle,
    },
  }[effectiveStatus];

  const StatusIcon = statusConfig.icon;
  const clampedProgress = Math.min(100, Math.max(0, fillPercentage));

  return (
    <div className={`w-full space-y-2.5 bg-[#111318] border border-[#1F242F] p-3.5 rounded-md ${className}`}>
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.badgeBg} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
          >
            <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {statusConfig.label}
          </span>
          <span className="text-xs text-zinc-400 font-mono tabular-nums">
            {totalVolumeCuFt} / {interiorVolumeCuFt} Gross Cu Ft
          </span>
        </div>

        <div className="text-xs font-medium text-white tracking-tight tabular-nums">
          <span className={`${statusConfig.textColor} font-semibold font-mono`}>{fillPercentage}% Full</span>
          <span className="text-zinc-400 font-normal ml-2 font-mono">
            ({totalVolumeCuFt} / {usableCapacityCuFt} cu ft)
          </span>
        </div>
      </div>

      {/* Horizontal Progress Bar with 18% Safety Buffer Section */}
      <div className="relative w-full h-3.5 bg-[#090A0C] border border-[#1F242F] rounded-full overflow-hidden p-0.5">
        {/* Active Fill Bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${statusConfig.barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, (totalVolumeCuFt / interiorVolumeCuFt) * 100))}%` }}
        />

        {/* 18% Safety Buffer Cross-Hatched Section (from 82% to 100%) */}
        <div
          className="absolute top-0 bottom-0 right-0 w-[18%] border-l border-amber-500/40 bg-[#1F242F]/70 flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.15) 3px, transparent 3px, transparent 6px)',
          }}
          title="18% Real-World Safety Buffer (Packing voids, wheel wells, and irregular cargo)"
        >
          <span className="text-[8px] font-mono font-bold text-amber-400/90 tracking-tighter uppercase select-none px-1">
            Buffer
          </span>
        </div>

        {/* 82% Usable Limit Marker */}
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-amber-400/60 z-10"
          style={{ left: '82%' }}
          title="100% Usable Capacity Limit (Safety buffer begins)"
        />
      </div>

      {/* Sub-bar Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
        {/* Contextual Micro-Popover for 18% Safety Buffer */}
        <div className="relative group cursor-help">
          <div
            className="flex items-center gap-1.5 text-zinc-300 bg-[#090A0C] px-2.5 py-1 rounded-md border border-[#1F242F] group-hover:border-zinc-500 transition-colors"
            title="Accounts for loose-pack voids, non-square cargo, and wheel-well intrusion."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" strokeWidth={1.5} />
            <span className="border-b border-dotted border-zinc-400 font-medium text-xs">
              Includes 18% Packing Buffer
            </span>
          </div>

          {/* Single-Sentence Native Micro-Popover */}
          <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex items-center z-30 pointer-events-none transition-all duration-150">
            <div className="px-3 py-1.5 rounded-md bg-[#181B22] border border-[#2D3545] shadow-xl text-[11px] text-zinc-200 whitespace-nowrap">
              Accounts for loose-pack voids, non-square cargo, and wheel-well intrusion.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 tabular-nums">
          <Scale className={`w-3.5 h-3.5 ${isOverweight ? 'text-[#EF4444]' : 'text-zinc-400'}`} strokeWidth={1.5} />
          <span className="text-zinc-400">
            Est. Cargo Weight:{' '}
            <span className={isOverweight ? 'text-[#EF4444] font-semibold font-mono' : 'text-zinc-200 font-mono'}>
              {totalWeightLbs.toLocaleString()} lbs
            </span>{' '}
            /{' '}
            <span className="text-zinc-400 font-mono">
              Max Payload: {maxPayloadLbs.toLocaleString()} lbs
            </span>
          </span>
          {isOverweight && (
            <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-semibold text-[10px] tracking-wide uppercase">
              Overweight
            </span>
          )}
        </div>
      </div>

      {/* Physical packing notice when items cannot fit into the truck */}
      {unpackedCount > 0 && (
        <div className="mt-1 flex items-center gap-2 p-2.5 rounded-md bg-[#16100C] border border-amber-500/40 text-xs text-zinc-300">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" strokeWidth={1.75} />
          <p className="text-[11px] text-zinc-300 leading-snug">
            <strong className="text-amber-400 font-semibold">{unpackedCount} item{unpackedCount > 1 ? 's' : ''} cannot fit</strong> in this vehicle&apos;s physical cargo dimensions. Upgrade recommended.
          </p>
        </div>
      )}

      {/* Dynamic Size-Up CTA Banner: Trigger when tight/critical (>= 71%) or unpacked items or overweight */}
      {(effectiveStatus !== 'optimal' || isOverweight || unpackedCount > 0) && nextTruck && onUpgradeTruck && (
        <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-md bg-[#16100C] border border-[#FF5500]/40">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FF5500] shrink-0" strokeWidth={1.5} />
            <p className="text-xs text-zinc-200">
              {unpackedCount > 0 ? (
                <>
                  Cargo exceeds usable space (<strong className="text-white font-semibold">{unpackedCount} item{unpackedCount > 1 ? 's' : ''} unpacked</strong>). Upgrade to <strong className="text-white font-semibold">{nextTruck.name}</strong> to fit your entire move.
                </>
              ) : effectiveStatus === 'critical' ? (
                <>
                  Cargo exceeds safe capacity threshold ({fillPercentage}% full). Upgrade to <strong className="text-white font-semibold">{nextTruck.name}</strong> to prevent moving-day overflow.
                </>
              ) : (
                <>
                  Space is tight ({fillPercentage}% full). Upgrade to <strong className="text-white font-semibold">{nextTruck.name}</strong> to prevent moving-day overflow.
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              trackSizeUpClicked(capacityResult.truck.id, nextTruck.id, fillPercentage);
              onUpgradeTruck(nextTruck.id);
            }}
            aria-label={`Upgrade to ${nextTruck.name}`}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-black font-bold text-xs tracking-wide transition-colors duration-150 shadow-sm"
          >
            <span>Upgrade to {nextTruck.id}</span>
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
