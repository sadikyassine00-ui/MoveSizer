'use client';

import React from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { ITEMS } from '@/lib/constants/items';
import { CustomItemInput } from '@/lib/engine/packEngine';
import { Printer, X, CheckSquare, ShieldCheck, Truck, ArrowDown, Package, Layers, Info } from 'lucide-react';

interface LoadManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  truck: TruckSpec;
  capacityResult: CapacityCalculationResult;
  inventory: Record<string, number>;
  customItems: CustomItemInput[];
  leadId?: string;
  originZip?: string;
  destinationZip?: string;
  moveDate?: string;
}

export function LoadManifestModal({
  isOpen,
  onClose,
  truck,
  capacityResult,
  inventory,
  customItems,
  leadId = 'TS-VERIFIED-01',
  originZip = '—',
  destinationZip = '—',
  moveDate = 'Pending',
}: LoadManifestModalProps) {
  if (!isOpen) return null;

  const smallBoxes = inventory['box_small'] || 0;
  const mediumBoxes = inventory['box_medium'] || 0;
  const largeBoxes = inventory['box_large'] || 0;
  const wardrobeBoxes = inventory['box_wardrobe'] || 0;
  const totalBoxes = smallBoxes + mediumBoxes + largeBoxes + wardrobeBoxes;
  const tapeRolls = Math.max(2, Math.ceil(totalBoxes / 15));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
      {/* Modal Card */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#111318] border border-[#1F242F] text-zinc-100 shadow-2xl p-6 sm:p-8 print:border-none print:shadow-none print:max-w-none print:max-h-none print:p-0 print:text-black print:bg-white">
        {/* Print Header Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1F242F] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Official Load Manifest
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-[#0066FF]/20 text-[#0066FF] font-mono">
              REF: {leadId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Document Title Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#1F242F] print:border-black">
            <div>
              <div className="text-xl font-bold tracking-tight text-white print:text-black">
                TRUCK<span className="text-[#FF5500]">SIZER</span> LOAD MANIFEST
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                Certified Cargo Volume Plan & Commercial Vehicle Packing Instructions
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="text-zinc-300 print:text-black font-semibold">REF: {leadId}</div>
              <div className="text-zinc-500 print:text-zinc-600 text-[11px]">
                Date: {moveDate} • Route: {originZip} → {destinationZip}
              </div>
            </div>
          </div>

          {/* 1. Volumetric Data Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#090A0C] p-4 rounded-lg border border-[#1F242F] print:bg-zinc-50 print:border-zinc-300 print:text-black">
            <div>
              <div className="text-[11px] text-zinc-500 uppercase font-medium">Assigned Vehicle</div>
              <div className="text-sm font-semibold text-white print:text-black mt-0.5">
                {truck.name}
              </div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                {truck.volumeCuFt} gross cu ft
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase font-medium">Cargo Volume</div>
              <div className="text-sm font-semibold text-[#0066FF] mt-0.5 tabular-nums">
                {capacityResult.totalVolumeCuFt} cu ft
              </div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                {capacityResult.fillPercentage}% Usable Cap.
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase font-medium">Safety Buffer</div>
              <div className="text-sm font-semibold text-[#10B981] mt-0.5">
                18% Included
              </div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                {capacityResult.usableCapacityCuFt} cu ft usable
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-500 uppercase font-medium">Cargo Weight</div>
              <div className={`text-sm font-semibold mt-0.5 tabular-nums ${capacityResult.isOverweight ? 'text-[#EF4444]' : 'text-white print:text-black'}`}>
                {capacityResult.totalWeightLbs.toLocaleString()} lbs
              </div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                Cap: {capacityResult.maxPayloadLbs.toLocaleString()} lbs
              </div>
            </div>
          </div>

          {/* 2. Itemized Box & Supply Shopping Checklist */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white print:text-black uppercase tracking-wider mb-2.5">
              <Package className="w-4 h-4 text-[#FF5500]" />
              <span>Recommended Box & Packaging Supply Checklist</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[11px]">Small (1.5 cu ft)</div>
                <div className="text-base font-bold text-white print:text-black mt-1 tabular-nums">{smallBoxes} Units</div>
                <div className="text-[10px] text-zinc-500">Books & canned food</div>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[11px]">Medium (3.0 cu ft)</div>
                <div className="text-base font-bold text-white print:text-black mt-1 tabular-nums">{mediumBoxes} Units</div>
                <div className="text-[10px] text-zinc-500">Pantry, toys, cookware</div>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[11px]">Large (4.5 cu ft)</div>
                <div className="text-base font-bold text-white print:text-black mt-1 tabular-nums">{largeBoxes} Units</div>
                <div className="text-[10px] text-zinc-500">Linens & bedding</div>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[11px]">Wardrobe (16 cu ft)</div>
                <div className="text-base font-bold text-white print:text-black mt-1 tabular-nums">{wardrobeBoxes} Units</div>
                <div className="text-[10px] text-zinc-500">Clothes on hangers</div>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[11px]">Packing Tape</div>
                <div className="text-base font-bold text-[#FF5500] mt-1 tabular-nums">{tapeRolls} Rolls</div>
                <div className="text-[10px] text-zinc-500">55-yard heavy duty</div>
              </div>
            </div>
          </div>

          {/* 3. 4-Phase Truck Loading Sequence Guide */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white print:text-black uppercase tracking-wider mb-2.5">
              <Layers className="w-4 h-4 text-[#0066FF]" />
              <span>4-Phase Commercial Loading Sequence</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 1 — Left Side Wall Rails (Standing on Edge)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[11px] mt-0.5">
                  Stand mattresses, box springs, dining tabletops, and mirrors vertically along the driver-side side rail ($Z = 0$). Secure firmly with ratchet straps to side wall tie-downs.
                </p>
              </div>

              <div className="p-3 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 2 — Front Bulkhead (Heavy Base Foundation)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[11px] mt-0.5">
                  Stand sofas vertically against the front bulkhead cab wall ($X = 0$). Place dressers, desks, nightstands, and heavy machinery flat on the floor deck.
                </p>
              </div>

              <div className="p-3 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 3 — Dense Box Columns (Floor to Ceiling)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[11px] mt-0.5">
                  Stack cardboard boxes in tight vertical tiers from the deck to the roof. Place heaviest large boxes on the bottom, progressing to medium and small boxes on top.
                </p>
              </div>

              <div className="p-3 bg-[#090A0C] border border-[#1F242F] rounded-lg print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 4 — Mom&apos;s Attic Cab Compartment (Fragiles & Parcels)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[11px] mt-0.5">
                  Load wardrobe boxes, flat-screen television boxes, fine china, and fragile parcels into the elevated cab-over compartment shelf. Never place heavy solid timber or steel in the attic.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-[10px] text-zinc-500 border-t border-[#1F242F] pt-3 leading-relaxed print:border-zinc-300">
            Notice: All volumetric calculations, spatial models, and box counts are mathematical estimates based on standard furniture dimensions and professional loading practices. Vehicle dimensions reflect standard US rental fleets (U-Haul, Budget, Penske). When between truck sizes, rental providers always recommend reserving the larger vehicle.
          </div>
        </div>
      </div>
    </div>
  );
}
