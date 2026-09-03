'use client';

import React from 'react';
import { TRUCKS, TRUCK_ORDER, TruckId } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { Truck, RotateCcw, FileText } from 'lucide-react';

interface HeaderProps {
  selectedTruckId: TruckId;
  onSelectTruckId: (id: TruckId) => void;
  selectedPreset: PresetId | null;
  onSelectPreset: (presetId: PresetId) => void;
  unitSystem: 'imperial' | 'metric';
  onToggleUnitSystem: () => void;
  onReset: () => void;
  onOpenManifest?: () => void;
}

export function Header({
  selectedTruckId,
  onSelectTruckId,
  selectedPreset,
  onSelectPreset,
  unitSystem,
  onToggleUnitSystem,
  onReset,
  onOpenManifest,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-semibold text-base tracking-tight text-white">
          <div className="p-1 rounded-md bg-[#FF5500] text-black">
            <Truck className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <span>
            TRUCK<span className="text-[#FF5500]">SIZER</span>
          </span>
        </div>
        <span className="hidden xl:inline-block text-xs text-zinc-500 border-l border-[#1F242F] pl-3">
          Commercial Cargo Volume & Vehicle Sizing Engine
        </span>
      </div>

      {/* Quick Presets (Desktop) */}
      <div className="hidden lg:flex items-center gap-1 bg-[#090A0C] px-1.5 py-1 rounded-md border border-[#1F242F]">
        <span className="text-[10px] uppercase font-semibold text-zinc-500 mr-1 px-1 font-mono">
          Profile:
        </span>
        {(['studio', '1-2_bed', '3+_bed'] as PresetId[]).map((pid) => {
          const p = PRESETS[pid];
          const isActive = selectedPreset === pid;
          return (
            <button
              key={pid}
              type="button"
              onClick={() => onSelectPreset(pid)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#FF5500] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Truck Selector Buttons */}
      <div className="flex items-center gap-1 bg-[#090A0C] p-1 rounded-md border border-[#1F242F]">
        {TRUCK_ORDER.map((tid) => {
          const trk = TRUCKS[tid];
          const isSelected = selectedTruckId === tid;
          return (
            <button
              key={tid}
              type="button"
              onClick={() => onSelectTruckId(tid)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors font-mono tabular-nums ${
                isSelected
                  ? 'bg-[#0066FF] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {trk.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Imperial / Metric Toggle */}
        <button
          type="button"
          onClick={onToggleUnitSystem}
          className="px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          title="Toggle Imperial / Metric Units"
        >
          {unitSystem === 'imperial' ? 'Inches / Cu Ft' : 'Meters / Cu M'}
        </button>

        {/* Load Manifest Shortcut */}
        {onOpenManifest && (
          <button
            type="button"
            onClick={onOpenManifest}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
            <span>Manifest</span>
          </button>
        )}

        {/* Reset Canvas Button */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          title="Reset canvas and inventory"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>
    </header>
  );
}
