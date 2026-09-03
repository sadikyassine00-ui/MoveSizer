'use client';

import React, { useState } from 'react';
import { PresetId, PRESETS } from '@/lib/constants/presets';
import { DensityLevel } from '@/lib/engine/boxCalculator';
import { ITEMS, ItemCategory } from '@/lib/constants/items';
import { CustomItemInput } from '@/lib/engine/packEngine';
import {
  BedDouble,
  Sofa,
  Utensils,
  Package,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Home,
  Sliders,
  Maximize2,
  Shirt,
  Tv,
  MonitorPlay,
  Armchair,
  Briefcase,
  Layers,
} from 'lucide-react';

interface InventoryDrawerProps {
  selectedPreset: PresetId | null;
  onSelectPreset: (presetId: PresetId) => void;
  bedrooms: number;
  onBedroomsChange: (val: number) => void;
  occupants: number;
  onOccupantsChange: (val: number) => void;
  density: DensityLevel;
  onDensityChange: (val: DensityLevel) => void;
  inventory: Record<string, number>;
  onItemQuantityChange: (itemId: string, newQuantity: number) => void;
  customItems: CustomItemInput[];
  onAddCustomItem: (item: CustomItemInput) => void;
  onRemoveCustomItem: (id: string) => void;
  className?: string;
}

function getItemIcon(itemId: string) {
  switch (itemId) {
    case 'queen_bed':
    case 'king_bed':
      return BedDouble;
    case 'dresser_6drawer':
    case 'nightstand':
      return Layers;
    case 'sofa_3seat':
    case 'loveseat':
      return Sofa;
    case 'coffee_table':
      return Tv;
    case 'tv_stand':
      return MonitorPlay;
    case 'dining_table':
      return Utensils;
    case 'chair':
      return Armchair;
    case 'desk':
      return Briefcase;
    case 'box_wardrobe':
      return Shirt;
    case 'box_small':
    case 'box_medium':
    case 'box_large':
    default:
      return Package;
  }
}

export function InventoryDrawer({
  selectedPreset,
  onSelectPreset,
  bedrooms,
  onBedroomsChange,
  occupants,
  onOccupantsChange,
  density,
  onDensityChange,
  inventory,
  onItemQuantityChange,
  customItems,
  onAddCustomItem,
  onRemoveCustomItem,
  className = '',
}: InventoryDrawerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    living_room: true,
    bedroom: true,
    dining_office: false,
    boxes: true,
    custom: false,
  });

  const [customName, setCustomName] = useState('');
  const [customLength, setCustomLength] = useState<string>('');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [customQuantity, setCustomQuantity] = useState<number>(1);
  const [customError, setCustomError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const l = parseFloat(customLength);
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);

    if (!customName.trim()) {
      setCustomError('Item name is required');
      return;
    }
    if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) {
      setCustomError('Enter valid dimensions in inches');
      return;
    }

    const newItem: CustomItemInput = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      length: l,
      width: w,
      height: h,
      quantity: Math.max(1, customQuantity),
      color: '#0066FF',
      category: 'custom',
    };

    onAddCustomItem(newItem);
    setCustomName('');
    setCustomLength('');
    setCustomWidth('');
    setCustomHeight('');
    setCustomQuantity(1);
    setCustomError(null);
  };

  const categories: Array<{ id: ItemCategory; title: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'living_room', title: 'Living Room', icon: Sofa },
    { id: 'bedroom', title: 'Bedrooms', icon: BedDouble },
    { id: 'dining_office', title: 'Dining & Office', icon: Utensils },
    { id: 'boxes', title: 'Boxes', icon: Package },
  ];

  return (
    <div className={`flex flex-col h-full bg-[#111318] border-r border-[#1F242F] text-gray-200 overflow-y-auto ${className}`}>
      {/* 1. Header & One-Click Preset Selectors */}
      <div className="p-4 border-b border-[#1F242F] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
            FLEET INVENTORY PRESETS
          </span>
          <span className="text-[10px] font-mono text-gray-500">1-CLICK</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['studio', '1-2_bed', '3+_bed'] as PresetId[]).map((pid) => {
            const preset = PRESETS[pid];
            const isActive = selectedPreset === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => onSelectPreset(pid)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-[#FF5500]/15 border-[#FF5500] text-white shadow-md shadow-[#FF5500]/10'
                    : 'bg-[#090A0C] border-[#1F242F] text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <span className="font-display uppercase text-sm font-bold tracking-wide">{preset.label}</span>
                <span className="text-[10px] font-mono opacity-70 mt-0.5">{preset.defaultTruck}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Baseline Room Controls */}
      <div className="p-4 border-b border-[#1F242F] space-y-3 bg-[#0D0F14] shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#0066FF]" />
            ROOM BASELINE & BOX DENSITY
          </span>
          <span className="text-[10px] font-mono text-[#0066FF]">AUTO-CALC</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Bedrooms Stepper */}
          <div className="space-y-1 bg-[#111318] p-2.5 rounded-lg border border-[#1F242F]">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <Home className="w-3 h-3" /> Bedrooms
              </span>
              <span className="font-bold text-white">{bedrooms}</span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1">
              <button
                type="button"
                onClick={() => onBedroomsChange(Math.max(1, bedrooms - 1))}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#090A0C] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                disabled={bedrooms <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-gray-200">{bedrooms}</span>
              <button
                type="button"
                onClick={() => onBedroomsChange(Math.min(5, bedrooms + 1))}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#090A0C] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                disabled={bedrooms >= 5}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Occupants Stepper */}
          <div className="space-y-1 bg-[#111318] p-2.5 rounded-lg border border-[#1F242F]">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> Occupants
              </span>
              <span className="font-bold text-white">{occupants}</span>
            </div>
            <div className="flex items-center justify-between gap-1 pt-1">
              <button
                type="button"
                onClick={() => onOccupantsChange(Math.max(1, occupants - 1))}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#090A0C] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                disabled={occupants <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-gray-200">{occupants}</span>
              <button
                type="button"
                onClick={() => onOccupantsChange(Math.min(6, occupants + 1))}
                className="w-7 h-7 flex items-center justify-center rounded bg-[#090A0C] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                disabled={occupants >= 6}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Density Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
            <span>Packing Density Multiplier</span>
          </label>
          <select
            value={density}
            onChange={(e) => onDensityChange(e.target.value as DensityLevel)}
            className="w-full bg-[#090A0C] border border-[#1F242F] rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-200 focus:outline-none focus:border-[#0066FF]"
          >
            <option value="minimalist">Minimalist (0.8x)</option>
            <option value="standard">Standard (1.0x)</option>
            <option value="packrat">Packrat (1.35x)</option>
          </select>
        </div>
      </div>

      {/* 3. Categorized Inventory Accordions */}
      <div className="flex-1 divide-y divide-[#1F242F]">
        {categories.map((cat) => {
          const isOpen = !!openSections[cat.id];
          const CategoryIcon = cat.icon;
          const catItems = Object.values(ITEMS).filter((item) => item.category === cat.id);

          const itemCountInCategory = catItems.reduce(
            (sum, item) => sum + (inventory[item.id] || 0),
            0
          );

          return (
            <div key={cat.id} className="border-b border-[#1F242F]">
              <button
                type="button"
                onClick={() => toggleSection(cat.id)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#090A0C]/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-display font-bold uppercase tracking-wider text-gray-200">
                    {cat.title}
                  </span>
                  {itemCountInCategory > 0 && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-[#1F242F] text-[#0066FF] font-bold">
                      {itemCountInCategory}
                    </span>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isOpen && (
                <div className="p-3 pt-0 space-y-2">
                  {catItems.map((item) => {
                    const count = inventory[item.id] || 0;
                    const ItemIcon = getItemIcon(item.id);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#090A0C] border border-[#1F242F] hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <ItemIcon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                              <span className="text-[#0066FF] font-semibold">{item.volumeCuFt} cu ft</span>
                              <span>•</span>
                              <span>~{item.weightLbs} lbs</span>
                            </div>
                          </div>
                        </div>

                        {/* Count Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onItemQuantityChange(item.id, Math.max(0, count - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#111318] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                            disabled={count <= 0}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-bold text-white">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => onItemQuantityChange(item.id, count + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-[#111318] border border-[#1F242F] hover:border-gray-500 text-gray-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Custom Dimensions Module */}
        <div className="border-b border-[#1F242F]">
          <button
            type="button"
            onClick={() => toggleSection('custom')}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-[#090A0C]/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[#0066FF]" />
              <span className="text-sm font-display font-bold text-[#0066FF] uppercase tracking-wider">
                + ADD CUSTOM SPEC ITEM
              </span>
              {customItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0066FF]/20 text-[#0066FF]">
                  {customItems.length}
                </span>
              )}
            </div>
            {openSections.custom ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {openSections.custom && (
            <div className="p-3 pt-0 space-y-3">
              <form onSubmit={handleAddCustom} className="space-y-2.5 bg-[#090A0C] p-3 rounded-lg border border-[#1F242F]">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 block mb-1 uppercase tracking-wide">
                    Cargo Description / Tag
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Industrial Safe, Piano"
                    className="w-full bg-[#111318] border border-[#1F242F] rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF] font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">
                      Length (in)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="60"
                      className="w-full bg-[#111318] border border-[#1F242F] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="24"
                      className="w-full bg-[#111318] border border-[#1F242F] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="48"
                      className="w-full bg-[#111318] border border-[#1F242F] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#0066FF] font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-gray-400">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customQuantity}
                      onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                      className="w-14 bg-[#111318] border border-[#1F242F] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#0066FF] font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pack Item</span>
                  </button>
                </div>

                {customError && (
                  <p className="text-[10px] font-mono text-[#EF4444]">{customError}</p>
                )}
              </form>

              {customItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-gray-400 uppercase">
                    Custom Items ({customItems.length})
                  </div>
                  {customItems.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded bg-[#090A0C] border border-[#1F242F] text-xs font-mono"
                    >
                      <div>
                        <div className="text-white font-medium">{c.name} ({c.quantity}x)</div>
                        <div className="text-[10px] text-gray-400">
                          {c.length}″L × {c.width}″W × {c.height}″H
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveCustomItem(c.id)}
                        className="p-1 rounded text-gray-500 hover:text-[#EF4444] transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
