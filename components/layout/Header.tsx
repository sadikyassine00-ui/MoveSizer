'use client';

import React from 'react';
import { TRUCKS, TRUCK_ORDER, TruckId } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { Truck, RotateCcw, Menu } from 'lucide-react';

interface HeaderProps {
  selectedTruckId: TruckId;
  onSelectTruckId: (id: TruckId) => void;
  selectedPreset: PresetId | null;
  onSelectPreset: (presetId: PresetId) => void;
  unitSystem: 'imperial' | 'metric';
  onToggleUnitSystem: () => void;
  onReset: () => void;
  onOpenNav?: () => void;
}

export function Header({
  selectedTruckId,
  onSelectTruckId,
  selectedPreset,
  onSelectPreset,
  unitSystem,
  onToggleUnitSystem,
  onReset,
  onOpenNav,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 select-none">
      {/* 1. Brand Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="p-1 rounded-md bg-[#FF5500] text-black shrink-0">
          <Truck className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <span className="font-bold text-sm tracking-tight text-white">
          TRUCK<span className="text-[#FF5500]">SIZER</span>
        </span>
      </div>

      {/* 2. Core Functional Controls: Presets & Truck Sizing */}
      <div className="flex items-center gap-2">
        {/* Dwelling Presets: [Studio] [1-2 Bed] [3+ Bed] */}
        <div className="flex items-center gap-1 bg-[#090A0C] p-1 rounded-lg border border-[#1F242F]">
          {(['studio', '1-2_bed', '3+_bed'] as PresetId[]).map((pid) => {
            const p = PRESETS[pid];
            const isActive = selectedPreset === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => onSelectPreset(pid)}
                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#FF5500] text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Truck Fleet Size Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-[#090A0C] p-1 rounded-lg border border-[#1F242F]">
          {TRUCK_ORDER.map((tid) => {
            const trk = TRUCKS[tid];
            const isSelected = selectedTruckId === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onSelectTruckId(tid)}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium font-mono tabular-nums transition-all ${
                  isSelected
                    ? 'bg-[#0066FF] text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {trk.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Streamlined Utility Strip: Unit Toggle & Clear All */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Unit Toggle: [Imperial / Metric] */}
        <button
          type="button"
          onClick={onToggleUnitSystem}
          className="px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
          title={`Switch to ${unitSystem === 'imperial' ? 'metric' : 'imperial'} units`}
        >
          {unitSystem === 'imperial' ? 'Imperial' : 'Metric'}
        </button>

        {/* Reset Button: [Clear All] */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          title="Clear all inventory and reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Clear All</span>
        </button>

        {/* Site Directory Trigger */}
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            className="p-1.5 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors"
            title="Open Site Directory"
          >
            <Menu className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
