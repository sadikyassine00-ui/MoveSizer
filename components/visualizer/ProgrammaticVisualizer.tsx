'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { TRUCKS, TruckId } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { calculateBoxRequirements } from '@/lib/engine/boxCalculator';
import { calculateCapacity } from '@/lib/engine/capacityEngine';
import { packTruck, DrawableBlock } from '@/lib/engine/packEngine';
import { TruckCanvas } from '@/components/visualizer/TruckCanvas';
import { CapacityGauge } from '@/components/visualizer/CapacityGauge';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface ProgrammaticVisualizerProps {
  truckId: TruckId;
  presetId?: PresetId;
  className?: string;
  badgeLabel?: string;
}

export default function ProgrammaticVisualizer({
  truckId,
  presetId = 'studio',
  className = '',
  badgeLabel,
}: ProgrammaticVisualizerProps) {
  const [selectedBlock, setSelectedBlock] = useState<DrawableBlock | null>(null);

  const truck = TRUCKS[truckId] || TRUCKS['15ft'];
  const preset = PRESETS[presetId] || PRESETS.studio;

  // Build inventory from preset
  const inventory = useMemo(() => {
    const boxCalc = calculateBoxRequirements({
      bedrooms: preset.bedrooms,
      occupants: preset.occupants,
      density: 'standard',
    });
    return {
      ...preset.items,
      box_small: boxCalc.counts.small,
      box_medium: boxCalc.counts.medium,
      box_large: boxCalc.counts.large,
      box_wardrobe: boxCalc.counts.wardrobe,
    };
  }, [preset]);

  // Pack the truck
  const { blocks: packedBlocks, unpackedItems } = useMemo(() => {
    return packTruck(truck, inventory);
  }, [inventory, truck]);

  // Calculate capacity
  const capacityResult = useMemo(() => {
    return calculateCapacity(truck, inventory);
  }, [inventory, truck]);

  const deepLinkUrl = `/?truck=${truckId}&preset=${presetId}`;

  return (
    <div
      className={`rounded-2xl border border-[#1F242F] bg-[#0E1015] overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* Header bar */}
      <div className="px-4 py-3 bg-[#13161F] border-b border-[#1F242F] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
            2.5D Isometric Cargo Simulation
          </span>
          {badgeLabel && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#0066FF]/15 border border-[#0066FF]/30 text-[#0066FF] font-mono">
              {badgeLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={deepLinkUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#FF5500]/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customize &amp; Pack In Sizer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2.5D Canvas Viewport */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-[#090A0C]">
        <TruckCanvas
          truck={truck}
          blocks={packedBlocks}
          selectedBlockId={selectedBlock?.id || null}
          onSelectBlock={setSelectedBlock}
          className="w-full h-full"
        />

        {/* Selected Item Floating HUD */}
        {selectedBlock && (
          <div className="absolute top-4 left-4 z-10 bg-[#111318]/90 backdrop-blur-md border border-[#0066FF] rounded-lg p-3 text-xs shadow-xl max-w-xs">
            <div className="font-bold text-white uppercase tracking-wide text-sm font-mono text-[#0066FF]">
              {selectedBlock.label}
            </div>
            <div className="text-[#9CA3AF] text-[11px] mt-1 space-y-0.5 font-mono">
              <div>Dimensions: {selectedBlock.length}&Prime;L &times; {selectedBlock.width}&Prime;W &times; {selectedBlock.height}&Prime;H</div>
              <div>Position: X:{Math.round(selectedBlock.x)}&Prime; Y:{Math.round(selectedBlock.y)}&Prime; Z:{Math.round(selectedBlock.z)}&Prime;</div>
              <div>Zone: <span className="text-white uppercase">{selectedBlock.category}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Capacity Gauge HUD */}
      <div className="p-4 bg-[#111318] border-t border-[#1F242F]">
        <CapacityGauge
          capacityResult={capacityResult}
          unpackedCount={unpackedItems.length}
        />
      </div>
    </div>
  );
}
