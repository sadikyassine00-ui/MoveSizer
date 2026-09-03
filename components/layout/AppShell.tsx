'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { TRUCKS, TRUCK_ORDER, TruckId } from '@/lib/constants/trucks';
import { PRESETS, PresetId } from '@/lib/constants/presets';
import { calculateBoxRequirements, DensityLevel } from '@/lib/engine/boxCalculator';
import { calculateCapacity } from '@/lib/engine/capacityEngine';
import { packTruck, CustomItemInput, DrawableBlock } from '@/lib/engine/packEngine';
import { Header } from '@/components/layout/Header';
import { TruckCanvas } from '@/components/visualizer/TruckCanvas';
import { CapacityGauge } from '@/components/visualizer/CapacityGauge';
import { InventoryDrawer } from '@/components/ui/InventoryDrawer';
import { ConversionCard } from '@/components/ui/ConversionCard';
import { LoadManifestModal } from '@/components/ui/LoadManifestModal';
import { Layers, FileText, ChevronUp, ChevronDown } from 'lucide-react';

interface AppShellProps {
  initialPreset?: PresetId;
  initialTruckId?: TruckId;
}

export function AppShell({
  initialPreset = 'studio',
  initialTruckId,
}: AppShellProps) {
  const [selectedTruckId, setSelectedTruckId] = useState<TruckId>(
    initialTruckId || PRESETS[initialPreset]?.defaultTruck || '10ft'
  );
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(initialPreset);
  const [bedrooms, setBedrooms] = useState<number>(PRESETS[initialPreset]?.bedrooms || 0);
  const [occupants, setOccupants] = useState<number>(PRESETS[initialPreset]?.occupants || 1);
  const [density, setDensity] = useState<DensityLevel>('standard');
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');

  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    const p = PRESETS[initialPreset] || PRESETS.studio;
    const boxCalc = calculateBoxRequirements({
      bedrooms: p.bedrooms,
      occupants: p.occupants,
      density: 'standard',
    });
    return {
      ...p.items,
      box_small: boxCalc.counts.small,
      box_medium: boxCalc.counts.medium,
      box_large: boxCalc.counts.large,
      box_wardrobe: boxCalc.counts.wardrobe,
    };
  });

  const [customItems, setCustomItems] = useState<CustomItemInput[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<DrawableBlock | null>(null);

  // Mobile Bottom Sheet state
  const [mobileTab, setMobileTab] = useState<'inventory' | 'quote'>('inventory');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(true);

  // Load Manifest Modal state
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [manifestData, setManifestData] = useState<{
    leadId: string;
    originZip: string;
    destinationZip: string;
    moveDate: string;
  }>({
    leadId: 'TS-INITIAL',
    originZip: '—',
    destinationZip: '—',
    moveDate: 'Pending',
  });

  const handleSelectPreset = useCallback(
    (presetId: PresetId) => {
      const preset = PRESETS[presetId];
      if (!preset) return;

      setSelectedPreset(presetId);
      setSelectedTruckId(preset.defaultTruck);
      setBedrooms(preset.bedrooms);
      setOccupants(preset.occupants);

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

  const packResult = useMemo(() => {
    return packTruck(currentTruck, inventory, customItems);
  }, [currentTruck, inventory, customItems]);

  const capacityResult = useMemo(() => {
    return calculateCapacity(currentTruck, inventory);
  }, [currentTruck, inventory]);

  const handleOpenManifestWithInfo = (info: {
    leadId: string;
    originZip: string;
    destinationZip: string;
    moveDate: string;
  }) => {
    setManifestData(info);
    setIsManifestOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0C] text-[#F8F9FA] overflow-hidden font-sans">
      {/* 1. Global Micro-Header */}
      <Header
        selectedTruckId={selectedTruckId}
        onSelectTruckId={setSelectedTruckId}
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        unitSystem={unitSystem}
        onToggleUnitSystem={() =>
          setUnitSystem((prev) => (prev === 'imperial' ? 'metric' : 'imperial'))
        }
        onReset={handleReset}
        onOpenManifest={() => setIsManifestOpen(true)}
      />

      {/* 2. Main Responsive Viewport */}
      {/* ================================================================= */}
      {/* DESKTOP VIEWPORT (≥ 1024px): Non-scrolling 3-Column Layout        */}
      {/* ================================================================= */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Column (320px): Inventory Drawer */}
        <div className="w-[320px] shrink-0 h-full overflow-hidden shadow-2xl z-10">
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

        {/* Center Column (Flex-1): Canvas + Capacity Gauge */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#090A0C] relative">
          <div className="flex-1 relative w-full h-full min-h-[360px]">
            <TruckCanvas
              truck={currentTruck}
              blocks={packResult.blocks}
              selectedBlockId={selectedBlock?.id}
              onSelectBlock={setSelectedBlock}
            />

            {packResult.unpackedItems.length > 0 && (
              <div className="absolute bottom-4 left-4 z-20 max-w-xs p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/50 backdrop-blur-md text-xs text-white shadow-xl">
                <div className="font-semibold text-[#EF4444] mb-1">
                  {packResult.unpackedItems.length} items exceed capacity
                </div>
                <p className="text-[11px] text-zinc-300">
                  Remaining items cannot fit inside interior boundaries. Upgrade truck size.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Capacity HUD */}
          <div className="p-4 bg-[#090A0C]/95 backdrop-blur border-t border-[#1F242F] shrink-0 z-10">
            <CapacityGauge
              capacityResult={capacityResult}
              onUpgradeTruck={(nextId) => setSelectedTruckId(nextId)}
            />
          </div>
        </main>

        {/* Right Column (340px): Conversion Card */}
        <div className="w-[340px] shrink-0 h-full overflow-hidden shadow-2xl z-10">
          <ConversionCard
            truck={currentTruck}
            capacityResult={capacityResult}
            inventory={inventory}
            customItems={customItems}
            onOpenManifest={handleOpenManifestWithInfo}
          />
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE VIEWPORT (< 1024px): Sticky Canvas + Bottom Sheet          */}
      {/* ================================================================= */}
      <div className="flex lg:hidden flex-col flex-1 overflow-hidden relative">
        {/* Top 45%: Sticky 2.5D Canvas */}
        <div className="h-[45%] w-full bg-[#090A0C] relative shrink-0 border-b border-[#1F242F]">
          <TruckCanvas
            truck={currentTruck}
            blocks={packResult.blocks}
            selectedBlockId={selectedBlock?.id}
            onSelectBlock={setSelectedBlock}
          />
        </div>

        {/* Bottom 55%: Swipeable/Tabbed Bottom Sheet */}
        <div
          className={`flex-1 flex flex-col bg-[#111318] overflow-hidden transition-all duration-300 ${
            isMobileSheetOpen ? 'h-[55%]' : 'h-14'
          }`}
        >
          {/* Bottom Sheet Header Bar with Tabs */}
          <div className="h-12 border-b border-[#1F242F] bg-[#090A0C] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMobileTab('inventory');
                  setIsMobileSheetOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mobileTab === 'inventory'
                    ? 'bg-[#1F242F] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Inventory & Presets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileTab('quote');
                  setIsMobileSheetOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  mobileTab === 'quote'
                    ? 'bg-[#FF5500] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Quote & Rates</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSheetOpen((prev) => !prev)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1F242F]"
            >
              {isMobileSheetOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Bottom Sheet Body */}
          {isMobileSheetOpen && (
            <div className="flex-1 overflow-y-auto">
              {mobileTab === 'inventory' ? (
                <div className="flex flex-col">
                  <div className="p-3 bg-[#090A0C] border-b border-[#1F242F]">
                    <CapacityGauge
                      capacityResult={capacityResult}
                      onUpgradeTruck={(nextId) => setSelectedTruckId(nextId)}
                    />
                  </div>
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
                    className="border-r-0"
                  />
                </div>
              ) : (
                <ConversionCard
                  truck={currentTruck}
                  capacityResult={capacityResult}
                  inventory={inventory}
                  customItems={customItems}
                  onOpenManifest={handleOpenManifestWithInfo}
                  className="border-l-0"
                />
              )}
            </div>
          )}

          {/* Persistent Mobile Bottom Pill */}
          <div
            onClick={() => {
              setMobileTab('quote');
              setIsMobileSheetOpen(true);
            }}
            className="p-2.5 bg-[#090A0C] border-t border-[#1F242F] flex items-center justify-between text-xs cursor-pointer hover:bg-[#111318] transition-colors shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#10B981] tabular-nums">
                {capacityResult.fillPercentage}% Capacity
              </span>
              <span className="text-zinc-400">• {currentTruck.name}</span>
            </div>
            <span className="text-[#FF5500] font-semibold text-xs flex items-center gap-1">
              Tap for Rates →
            </span>
          </div>
        </div>
      </div>

      {/* 3. Load Manifest Modal */}
      <LoadManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        truck={currentTruck}
        capacityResult={capacityResult}
        inventory={inventory}
        customItems={customItems}
        leadId={manifestData.leadId}
        originZip={manifestData.originZip}
        destinationZip={manifestData.destinationZip}
        moveDate={manifestData.moveDate}
      />
    </div>
  );
}
