'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { TRUCKS, TRUCK_ORDER, TruckId } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { calculateBoxRequirements, DensityLevel } from '@/lib/engine/boxCalculator';
import { calculateCapacity } from '@/lib/engine/capacityEngine';
import { packTruck, CustomItemInput, DrawableBlock } from '@/lib/engine/packEngine';
import { TruckCanvas } from '@/components/visualizer/TruckCanvas';
import { CapacityGauge } from '@/components/visualizer/CapacityGauge';
import { InventoryDrawer } from '@/components/ui/InventoryDrawer';
import { RotateCcw, Truck, Box, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export default function MoveSizerApp() {
  // Application State
  const [selectedTruckId, setSelectedTruckId] = useState<TruckId>('10ft');
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>('studio');
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [occupants, setOccupants] = useState<number>(1);
  const [density, setDensity] = useState<DensityLevel>('standard');
  const [inventory, setInventory] = useState<Record<string, number>>(() => ({
    ...PRESETS.studio.items,
  }));
  const [customItems, setCustomItems] = useState<CustomItemInput[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<DrawableBlock | null>(null);

  // Handle Preset Selection
  const handleSelectPreset = useCallback(
    (presetId: PresetId) => {
      const preset = PRESETS[presetId];
      if (!preset) return;

      setSelectedPreset(presetId);
      setSelectedTruckId(preset.defaultTruck);
      setBedrooms(preset.bedrooms);
      setOccupants(preset.occupants);

      // Calculate baseline boxes for preset
      const boxCalc = calculateBoxRequirements({
        bedrooms: preset.bedrooms,
        occupants: preset.occupants,
        density,
      });

      const newInventory = {
        ...preset.items,
        box_small: boxCalc.counts.small,
        box_medium: boxCalc.counts.medium,
        box_large: boxCalc.counts.large,
        box_wardrobe: boxCalc.counts.wardrobe,
      };

      setInventory(newInventory);
      setSelectedBlock(null);
    },
    [density]
  );

  // Handle Room Baseline / Density Changes
  const updateBoxEstimates = useCallback(
    (newBeds: number, newOccs: number, newDens: DensityLevel) => {
      const boxCalc = calculateBoxRequirements({
        bedrooms: newBeds,
        occupants: newOccs,
        density: newDens,
      });

      setInventory((prev) => ({
        ...prev,
        box_small: boxCalc.counts.small,
        box_medium: boxCalc.counts.medium,
        box_large: boxCalc.counts.large,
        box_wardrobe: boxCalc.counts.wardrobe,
      }));
    },
    []
  );

  const handleBedroomsChange = (newBeds: number) => {
    setBedrooms(newBeds);
    setSelectedPreset(null);
    updateBoxEstimates(newBeds, occupants, density);
  };

  const handleOccupantsChange = (newOccs: number) => {
    setOccupants(newOccs);
    setSelectedPreset(null);
    updateBoxEstimates(bedrooms, newOccs, density);
  };

  const handleDensityChange = (newDens: DensityLevel) => {
    setDensity(newDens);
    updateBoxEstimates(bedrooms, occupants, newDens);
  };

  const handleItemQuantityChange = (itemId: string, newQty: number) => {
    setSelectedPreset(null);
    setInventory((prev) => ({
      ...prev,
      [itemId]: newQty,
    }));
  };

  const handleAddCustomItem = (item: CustomItemInput) => {
    setCustomItems((prev) => [...prev, item]);
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleReset = () => {
    handleSelectPreset('studio');
    setCustomItems([]);
    setSelectedBlock(null);
  };

  const currentTruck = TRUCKS[selectedTruckId];

  // Run Packing Engine Heuristic
  const packResult = useMemo(() => {
    return packTruck(currentTruck, inventory, customItems);
  }, [currentTruck, inventory, customItems]);

  // Run Capacity Engine Calculation
  const capacityResult = useMemo(() => {
    return calculateCapacity(currentTruck, inventory);
  }, [currentTruck, inventory]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0C] text-[#F8F9FA] overflow-hidden font-sans">
      {/* Micro Global Header */}
      <header className="h-14 border-b border-[#1F242F] bg-[#111318] px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-display font-black text-2xl uppercase tracking-wider text-white">
            <div className="p-1.5 rounded-md bg-[#FF5500] text-black">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span>
              TRUCK<span className="text-[#FF5500]">SIZER</span>
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-wide text-gray-500 border-l border-[#1F242F] pl-3">
            LOGISTICS FIT SPECIFICATION SYSTEM
          </span>
        </div>

        {/* Truck Size Selector Switcher */}
        <div className="flex items-center gap-1.5 bg-[#090A0C] p-1 rounded-lg border border-[#1F242F]">
          {TRUCK_ORDER.map((tid) => {
            const trk = TRUCKS[tid];
            const isSelected = selectedTruckId === tid;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => setSelectedTruckId(tid)}
                className={`px-3.5 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#0066FF] text-white font-bold shadow-md shadow-[#0066FF]/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {trk.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090A0C] border border-[#1F242F] hover:border-gray-500 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: 2-Column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Inventory Drawer */}
        <div className="w-80 md:w-96 shrink-0 h-full flex flex-col z-10 shadow-2xl">
          <InventoryDrawer
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            bedrooms={bedrooms}
            onBedroomsChange={handleBedroomsChange}
            occupants={occupants}
            onOccupantsChange={handleOccupantsChange}
            density={density}
            onDensityChange={handleDensityChange}
            inventory={inventory}
            onItemQuantityChange={handleItemQuantityChange}
            customItems={customItems}
            onAddCustomItem={handleAddCustomItem}
            onRemoveCustomItem={handleRemoveCustomItem}
          />
        </div>

        {/* Center / Visualizer: Canvas + Capacity HUD */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#090A0C] relative">
          {/* 2.5D Isometric HTML5 Canvas */}
          <div className="flex-1 relative w-full h-full min-h-[380px]">
            <TruckCanvas
              truck={currentTruck}
              blocks={packResult.blocks}
              selectedBlockId={selectedBlock?.id}
              onSelectBlock={setSelectedBlock}
            />

            {/* Unpacked items warning if capacity exceeded */}
            {packResult.unpackedItems.length > 0 && (
              <div className="absolute bottom-4 left-4 z-20 max-w-sm p-3.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/50 backdrop-blur-md text-xs font-mono text-white shadow-xl">
                <div className="font-bold text-[#EF4444] mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                  <span>{packResult.unpackedItems.length} items exceed spatial envelope!</span>
                </div>
                <div className="text-[11px] text-gray-300">
                  Cargo exceeds interior boundaries. Upgrade truck size to accommodate remaining load.
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Capacity Gauge HUD */}
          <div className="p-4 bg-[#090A0C]/95 backdrop-blur border-t border-[#1F242F] shrink-0 z-10">
            <CapacityGauge
              capacityResult={capacityResult}
              onUpgradeTruck={(nextId) => setSelectedTruckId(nextId)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
