'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { TruckCanvas as BaseTruckCanvas } from '@/components/visualizer/TruckCanvas';
import { TRUCKS, TruckId, TruckSpec } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { calculateBoxRequirements } from '@/lib/engine/boxCalculator';
import { packTruck, DrawableBlock } from '@/lib/engine/packEngine';

export interface InteractiveCanvasProps {
  truck?: TruckSpec;
  truckSize?: TruckId | string;
  presetType?: PresetId | string;
  preloadedItems?: Record<string, number>;
  blocks?: DrawableBlock[];
  selectedBlockId?: string | null;
  onSelectBlock?: (block: DrawableBlock | null) => void;
  className?: string;
  autoHydrateUrl?: boolean;
}

function normalizeTruckId(raw?: string): TruckId {
  if (!raw) return '15ft';
  const clean = raw.toLowerCase().replace(/['"\s]/g, '');
  if (clean.includes('10')) return '10ft';
  if (clean.includes('12')) return '10ft';
  if (clean.includes('15')) return '15ft';
  if (clean.includes('16')) return '15ft';
  if (clean.includes('20') || clean.includes('22')) return '20ft';
  if (clean.includes('26')) return '26ft';
  return '15ft';
}

function normalizePresetId(raw?: string): PresetId {
  if (!raw) return 'studio';
  const clean = raw.toLowerCase().replace(/[\s-]/g, '_');
  if (clean.includes('studio')) return 'studio';
  if (clean.includes('1') || clean.includes('2')) return '1-2_bed';
  if (clean.includes('3') || clean.includes('4') || clean.includes('house')) return '3+_bed';
  return '1-2_bed';
}

export function TruckCanvas({
  truck: propTruck,
  truckSize: propTruckSize,
  presetType: propPresetType,
  preloadedItems,
  blocks: propBlocks,
  selectedBlockId: propSelectedBlockId,
  onSelectBlock: propOnSelectBlock,
  className = '',
  autoHydrateUrl = true,
}: InteractiveCanvasProps) {
  const [urlState, setUrlState] = useState<{
    truckSize?: string;
    presetType?: string;
  }>({});

  useEffect(() => {
    if (!autoHydrateUrl || typeof window === 'undefined') return;
    try {
      const search = new URLSearchParams(window.location.search);
      const urlTruck = search.get('truck') || search.get('truckSize') || search.get('size');
      const urlPreset = search.get('preset') || search.get('presetType') || search.get('load');
      if (urlTruck || urlPreset) {
        setUrlState({
          truckSize: urlTruck || undefined,
          presetType: urlPreset || undefined,
        });
      }
    } catch {
      // safe fallback
    }
  }, [autoHydrateUrl]);

  const effectiveTruckId = normalizeTruckId(
    propTruckSize || urlState.truckSize || propTruck?.id || '15ft'
  );
  const effectiveTruck = propTruck || TRUCKS[effectiveTruckId] || TRUCKS['15ft'];

  const effectivePresetId = normalizePresetId(
    propPresetType || urlState.presetType || 'studio'
  );
  const preset = PRESETS[effectivePresetId] || PRESETS.studio;

  // Build packed items if blocks are not explicitly supplied
  const packedResult = useMemo(() => {
    if (propBlocks && propBlocks.length > 0) {
      return { blocks: propBlocks };
    }

    let inventory: Record<string, number> = {};
    if (preloadedItems && Object.keys(preloadedItems).length > 0) {
      inventory = { ...preloadedItems };
    } else {
      const boxCalc = calculateBoxRequirements({
        bedrooms: preset.bedrooms,
        occupants: preset.occupants,
        density: 'standard',
      });
      inventory = {
        ...preset.items,
        box_small: boxCalc.counts.small,
        box_medium: boxCalc.counts.medium,
        box_large: boxCalc.counts.large,
        box_wardrobe: boxCalc.counts.wardrobe,
      };
    }

    return packTruck(effectiveTruck, inventory);
  }, [propBlocks, preloadedItems, preset, effectiveTruck]);

  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string | null>(null);
  const activeSelectedBlockId =
    propSelectedBlockId !== undefined ? propSelectedBlockId : internalSelectedBlockId;
  const activeOnSelectBlock = propOnSelectBlock || ((b) => setInternalSelectedBlockId(b?.id || null));

  return (
    <BaseTruckCanvas
      truck={effectiveTruck}
      blocks={packedResult.blocks}
      selectedBlockId={activeSelectedBlockId}
      onSelectBlock={activeOnSelectBlock}
      className={className}
    />
  );
}

export default TruckCanvas;
