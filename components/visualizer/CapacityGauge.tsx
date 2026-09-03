'use client';

import React from 'react';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { TruckId } from '@/lib/constants/trucks';
import { ShieldCheck, AlertTriangle, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';

interface CapacityGaugeProps {
  capacityResult: CapacityCalculationResult;
  onUpgradeTruck?: (nextTruckId: TruckId) => void;
  className?: string;
}

export function CapacityGauge({
  capacityResult,
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

  const statusConfig = {
    optimal: {
      barColor: 'bg-[#10B981]',
      textColor: 'text-[#10B981]',
      borderColor: 'border-[#10B981]/30',
      badgeBg: 'bg-[#10B981]/15',
      label: 'Optimal Fit',
      icon: CheckCircle2,
    },
    caution: {
      barColor: 'bg-[#F59E0B]',
      textColor: 'text-[#F59E0B]',
      borderColor: 'border-[#F59E0B]/30',
      badgeBg: 'bg-[#F59E0B]/15',
      label: 'Tight Fit',
      icon: AlertTriangle,
    },
    critical: {
      barColor: 'bg-[#EF4444]',
      textColor: 'text-[#EF4444]',
      borderColor: 'border-[#EF4444]/30',
      badgeBg: 'bg-[#EF4444]/15',
      label: 'Critical Capacity',
      icon: AlertTriangle,
    },
  }[status];

  const StatusIcon = statusConfig.icon;
  const clampedProgress = Math.min(100, Math.max(0, fillPercentage));

  return (
    <div className={`w-full space-y-3 bg-[#111318] border border-[#1F242F] p-4 rounded-xl ${className}`}>
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.badgeBg} ${statusConfig.textColor} border ${statusConfig.borderColor}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-zinc-400 tabular-nums">
            {totalVolumeCuFt} / {interiorVolumeCuFt} Gross Cu Ft
          </span>
        </div>

        <div className="text-sm font-medium text-white tracking-tight tabular-nums">
          <span className={`${statusConfig.textColor} font-semibold`}>{fillPercentage}% Full</span>
          <span className="text-zinc-400 font-normal ml-2">
            ({totalVolumeCuFt} / {usableCapacityCuFt} cu ft)
          </span>
        </div>
      </div>

      {/* Horizontal Progress Bar */}
      <div className="relative w-full h-3 bg-[#090A0C] border border-[#1F242F] rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${statusConfig.barColor}`}
          style={{ width: `${clampedProgress}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-white/20 z-10"
          style={{ left: '70%' }}
          title="Caution threshold (70%)"
        />
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-white/30 z-10"
          style={{ left: '85%' }}
          title="Critical threshold (85%)"
        />
      </div>

      {/* Sub-bar Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300 bg-[#090A0C] px-2.5 py-1 rounded-md border border-[#1F242F]">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>18% Real-World Packing Buffer Included</span>
        </div>

        <div className="flex items-center gap-2 tabular-nums">
          <Scale className={`w-4 h-4 ${isOverweight ? 'text-[#EF4444]' : 'text-zinc-400'}`} />
          <span className="text-zinc-400">
            Est. Cargo Weight:{' '}
            <span className={isOverweight ? 'text-[#EF4444] font-semibold' : 'text-zinc-200'}>
              {totalWeightLbs.toLocaleString()} lbs
            </span>{' '}
            /{' '}
            <span className="text-zinc-400">
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

      {/* Dynamic Size-Up CTA Banner */}
      {needsUpgrade && nextTruck && onUpgradeTruck && (
        <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-[#FF5500]/15 via-[#FF5500]/10 to-transparent border border-[#FF5500]/40">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#FF5500] shrink-0" />
            <p className="text-xs sm:text-sm text-zinc-200">
              Space is tight. Upgrade to <strong className="text-white font-semibold">{nextTruck.name}</strong> to prevent moving-day overflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpgradeTruck(nextTruck.id)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold tracking-tight transition-colors shadow-md shadow-[#FF5500]/20"
          >
            <span>Upgrade to {nextTruck.id}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
