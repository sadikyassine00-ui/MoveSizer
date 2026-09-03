'use client';

import React from 'react';
import { TRUCKS, TRUCK_ORDER, TruckId } from '@/lib/constants/trucks';
import { Truck, RotateCcw, FileText, Menu, HelpCircle } from 'lucide-react';

interface HeaderProps {
  selectedTruckId: TruckId;
  onSelectTruckId: (id: TruckId) => void;
  unitSystem: 'imperial' | 'metric';
  onToggleUnitSystem: () => void;
  onReset: () => void;
  onOpenManifest?: () => void;
  onOpenNav?: () => void;
  onOpenHowItWorks?: () => void;
}

export function Header({
  selectedTruckId,
  onSelectTruckId,
  unitSystem,
  onToggleUnitSystem,
  onReset,
  onOpenManifest,
  onOpenNav,
  onOpenHowItWorks,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 select-none">
      {/* 1. Left: Brand Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 font-semibold text-sm sm:text-base tracking-tight text-white">
          <div className="p-1 rounded-md bg-[#FF5500] text-black shrink-0">
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={1.75} />
          </div>
          <span className="font-bold tracking-tight">
            TRUCK<span className="text-[#FF5500]">SIZER</span>
          </span>
        </div>
        <span className="hidden 2xl:inline-block text-[11px] text-zinc-500 border-l border-[#1F242F] pl-3 font-mono">
          Cargo Volume &amp; Fit Engine
        </span>
      </div>

      {/* 2. Center: Vehicle Size Selector */}
      <div className="flex items-center gap-1 bg-[#090A0C] p-1 rounded-lg border border-[#1F242F]">
        {TRUCK_ORDER.map((tid) => {
          const trk = TRUCKS[tid];
          const isSelected = selectedTruckId === tid;
          return (
            <button
              key={tid}
              type="button"
              onClick={() => onSelectTruckId(tid)}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all font-mono tabular-nums ${
                isSelected
                  ? 'bg-[#0066FF] text-white shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {trk.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* 3. Right: Utility Strip & Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Unit Toggle Pill */}
        <button
          type="button"
          onClick={onToggleUnitSystem}
          className="px-2 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
          title={`Switch to ${unitSystem === 'imperial' ? 'metric' : 'imperial'} units`}
        >
          {unitSystem === 'imperial' ? 'IN / CU FT' : 'M / CU M'}
        </button>

        {/* Load Manifest Shortcut */}
        {onOpenManifest && (
          <button
            type="button"
            onClick={onOpenManifest}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            title="View & Print Certified Load Manifest"
          >
            <FileText className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
            <span>Manifest</span>
          </button>
        )}

        {/* How It Works Modal Trigger */}
        {onOpenHowItWorks && (
          <button
            type="button"
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            title="Learn how packing heuristics and safety buffers work"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span className="hidden lg:inline">How It Works</span>
          </button>
        )}

        {/* Reset Canvas */}
        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors"
          title="Reset inventory and canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        {/* Site Directory Drawer Trigger */}
        {onOpenNav && (
          <button
            type="button"
            onClick={onOpenNav}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            title="Open Site Directory & Guides"
          >
            <Menu className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
            <span className="hidden sm:inline">Directory</span>
          </button>
        )}
      </div>
    </header>
  );
}
