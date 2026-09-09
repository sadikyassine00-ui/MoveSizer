'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ComparisonVehicle } from '@/lib/data/truckComparisons';
import ProgrammaticVisualizer from '@/components/visualizer/ProgrammaticVisualizer';
import { Sparkles, Truck, ArrowUpRight, Scale } from 'lucide-react';

interface CompareVisualizerToggleProps {
  vehicleA: ComparisonVehicle;
  vehicleB: ComparisonVehicle;
}

export function CompareVisualizerToggle({
  vehicleA,
  vehicleB,
}: CompareVisualizerToggleProps) {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('B');
  const activeVehicle = activeTab === 'A' ? vehicleA : vehicleB;

  return (
    <div className="space-y-4">
      {/* Interactive Switch Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#111318] border border-[#1F242F]">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#0066FF]" />
          <span className="text-xs font-bold uppercase font-mono text-zinc-300">
            2.5D Visual Fit Simulation:
          </span>
          <div className="flex items-center p-0.5 rounded-lg bg-[#090A0C] border border-[#272D3B]">
            <button
              type="button"
              onClick={() => setActiveTab('A')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'A'
                  ? 'bg-[#0066FF] text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{vehicleA.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('B')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'B'
                  ? 'bg-[#10B981] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{vehicleB.name} (Recommended)</span>
            </button>
          </div>
        </div>

        <Link
          href={`/?truck=${activeVehicle.truckId}&preset=${activeVehicle.defaultPreset}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#FF5500]/20 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Pre-load {activeVehicle.name} in Sizer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2.5D Visualizer Container */}
      <ProgrammaticVisualizer
        truckId={activeVehicle.truckId}
        presetId={activeVehicle.defaultPreset}
        badgeLabel={`Loaded: ${activeVehicle.name} (${activeVehicle.idealDwelling})`}
      />
    </div>
  );
}

export default CompareVisualizerToggle;
