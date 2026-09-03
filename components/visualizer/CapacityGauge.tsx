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

  // Status-specific color configurations
  const statusConfig = {
    optimal: {
      barColor: 'bg-[#10B981]',
      textColor: 'text-[#10B981]',
      borderColor: 'border-[#10B981]/30',
      badgeBg: 'bg-[#10B981]/15',
      label: 'OPTIMAL FIT',
      icon: CheckCircle2,
    },
    caution: {
      barColor: 'bg-[#F59E0B]',
      textColor: 'text-[#F59E0B]',
      borderColor: 'border-[#F59E0B]/30',
      badgeBg: 'bg-[#F59E0B]/15',
      label: 'TIGHT FIT',
      icon: AlertTriangle,
    },
    critical: {
      barColor: 'bg-[#EF4444]',
      textColor: 'text-[#EF4444]',
      borderColor: 'border-[#EF4444]/30',
      badgeBg: 'bg-[#EF4444]/15',
      label: 'CRITICAL CAPACITY',
      icon: AlertTriangle,
    },
  }[status];

  const StatusIcon = statusConfig.icon;
  const clampedProgress = Math.min(100, Math.max(0, fillPercentage));

  return (
    <div className={`w-full space-y-3 bg-[#111318] border border-[#1F242F] p-4 rounded-xl ${className}`}>
      {/* Top Header Row: Fill % and Monospace Cu Ft Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${statusConfig.badgeBg} ${statusConfig.textColor} border ${statusConfig.borderColor} tracking-wider`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {totalVolumeCuFt} / {interiorVolumeCuFt} Gross Cu Ft
          </span>
        </div>

        <div className="font-mono text-sm font-semibold text-white tracking-wide">
          <span className={`${statusConfig.textColor} font-bold`}>{fillPercentage}% Full</span>
          <span className="text-gray-400 font-normal ml-2">
            ({totalVolumeCuFt} / {usableCapacityCuFt} cu ft)
          </span>
        </div>
      </div>

      {/* Horizontal Progress Bar */}
      <div className="relative w-full h-3.5 bg-[#090A0C] border border-[#1F242F] rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${statusConfig.barColor} shadow-sm`}
          style={{ width: `${clampedProgress}%` }}
        />
        {/* Subtle threshold marker lines (70% and 85%) */}
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

      {/* Sub-bar Metadata: Buffer badge & Payload Estimator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
        {/* Persistent 18% Safety Buffer Micro-badge */}
        <div className="flex items-center gap-1.5 text-gray-300 bg-[#090A0C] px-2.5 py-1 rounded-md border border-[#1F242F]">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>18% Real-World Packing Buffer Included</span>
        </div>

        {/* Payload Weight Estimator */}
        <div className="flex items-center gap-2">
          <Scale className={`w-4 h-4 ${isOverweight ? 'text-[#EF4444]' : 'text-gray-400'}`} />
          <span className="text-gray-400">
            Est. Cargo Weight:{' '}
            <span className={isOverweight ? 'text-[#EF4444] font-bold' : 'text-gray-200 font-medium'}>
              {totalWeightLbs.toLocaleString()} lbs
            </span>{' '}
            /{' '}
            <span className="text-gray-400">
              Max Payload: {maxPayloadLbs.toLocaleString()} lbs
            </span>
          </span>
          {isOverweight && (
            <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444] font-bold text-[10px]">
              OVERWEIGHT
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Size-Up CTA Banner (triggers at 71%+ or when overweight) */}
      {needsUpgrade && nextTruck && onUpgradeTruck && (
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-gradient-to-r from-[#FF5500]/20 via-[#FF5500]/10 to-transparent border border-[#FF5500]/50 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#FF5500] shrink-0" />
            <p className="text-xs sm:text-sm text-gray-100 font-medium">
              Space is tight. Upgrade to <strong className="text-white font-display text-base uppercase tracking-wider">{nextTruck.name}</strong> to prevent moving-day overflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpgradeTruck(nextTruck.id)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-lg shadow-[#FF5500]/20"
          >
            <span>Upgrade to {nextTruck.id}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
