'use client';

import React, { useCallback } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { ITEMS } from '@/lib/constants/items';
import { CustomItemInput } from '@/lib/engine/packEngine';
import {
  Printer,
  Download,
  X,
  Package,
  Layers,
  CheckSquare,
  FileText,
  Truck,
  ShieldCheck,
} from 'lucide-react';

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

const ZONE_LABELS: Record<string, string> = {
  wall_left: 'Left Wall Rail (Vertical/Edge)',
  bulkhead: 'Front Bulkhead (Upright)',
  floor: 'Floor Deck (Heavy Base)',
  attic: "Mom's Attic (Cab Shelf)",
  tier: 'Box Tier Column',
  custom: 'Floor / Secure Zone',
};

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

  // Extract active furniture items
  const activeFurniture = Object.entries(inventory)
    .filter(([id, qty]) => qty > 0 && !id.startsWith('box_'))
    .map(([id, qty]) => {
      const def = ITEMS[id];
      return {
        id,
        name: def?.name || id,
        category: def?.category || 'general',
        dimensions: def ? `${def.dimensions.length}″ × ${def.dimensions.width}″ × ${def.dimensions.height}″` : '—',
        zone: def?.zone ? ZONE_LABELS[def.zone] || def.zone : 'Floor Deck',
        quantity: qty,
        unitVolume: def?.volumeCuFt || 0,
        totalVolume: Math.round(((def?.volumeCuFt || 0) * qty) * 10) / 10,
        weightLbs: (def?.weightLbs || 0) * qty,
      };
    });

  // Extract active custom items
  const activeCustom = customItems
    .filter((it) => it.quantity > 0)
    .map((it) => {
      const vol = Math.round(((it.length * it.width * it.height) / 1728) * it.quantity * 10) / 10;
      return {
        id: it.id,
        name: `${it.name} (Custom)`,
        category: 'custom',
        dimensions: `${it.length}″ × ${it.width}″ × ${it.height}″`,
        zone: 'Floor / Custom Stacking',
        quantity: it.quantity,
        unitVolume: Math.round(((it.length * it.width * it.height) / 1728) * 10) / 10,
        totalVolume: vol,
        weightLbs: Math.round(vol * 8),
      };
    });

  const allManifestItems = [...activeFurniture, ...activeCustom];

  /**
   * Generates pure standalone HTML for printing or saving as file.
   * Completely isolated from webpage canvas visuals and dark theme styles.
   */
  const generateStandaloneHTML = useCallback(() => {
    const furnitureRows = allManifestItems
      .map(
        (it) => `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-weight: 500;">${it.name}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-transform: capitalize; color: #4b5563;">${it.category}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-family: monospace; font-size: 11px;">${it.dimensions}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; font-size: 11px; color: #1d4ed8;">${it.zone}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center; font-family: monospace; font-weight: bold;">${it.quantity}</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: right; font-family: monospace;">${it.totalVolume} cu ft</td>
          <td style="padding: 6px 8px; border: 1px solid #d1d5db; text-align: center; width: 40px;"><span style="display: inline-block; width: 14px; height: 14px; border: 1px solid #9ca3af; border-radius: 2px;"></span></td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>TruckSizer Load Manifest - ${leadId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 20px 24px;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand span { color: #ff5500; }
    .subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .meta {
      text-align: right;
      font-family: monospace;
      font-size: 11px;
    }
    .grid-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 18px;
    }
    .summary-card div:first-child {
      font-size: 10px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    .summary-card div:nth-child(2) {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 2px 0;
    }
    .summary-card div:last-child {
      font-size: 11px;
      color: #4b5563;
    }
    h3 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 8px 0;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    th {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 6px 8px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      color: #374151;
      font-weight: 600;
    }
    .box-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }
    .box-card {
      border: 1px solid #e5e7eb;
      background: #ffffff;
      border-radius: 4px;
      padding: 8px 10px;
    }
    .box-card .box-title { font-size: 10px; color: #4b5563; }
    .box-card .box-qty { font-size: 15px; font-weight: 800; font-family: monospace; color: #111827; margin: 2px 0; }
    .box-card .box-sub { font-size: 9px; color: #9ca3af; }
    .phase-card {
      border: 1px solid #e5e7eb;
      background: #ffffff;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 6px;
    }
    .phase-title { font-weight: 700; font-size: 11px; color: #111827; }
    .phase-desc { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .notice {
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
      margin-top: 16px;
      font-size: 9px;
      color: #9ca3af;
      line-height: 1.35;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 14px; padding: 10px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
    <span style="color: #9a3412; font-weight: 600;">Print Ready Official Load Manifest</span>
    <button onclick="window.print()" style="padding: 6px 14px; background: #ff5500; color: #ffffff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">TRUCK<span>SIZER</span> LOAD MANIFEST</div>
      <div class="subtitle">Certified Cargo Volume Plan & Commercial Vehicle Packing Instructions</div>
    </div>
    <div class="meta">
      <div style="font-weight: bold; color: #111827;">REF: ${leadId}</div>
      <div style="color: #6b7280; font-size: 10px;">Date: ${moveDate}</div>
      <div style="color: #6b7280; font-size: 10px;">Route: ${originZip} → ${destinationZip}</div>
    </div>
  </div>

  <!-- Volumetric Summary -->
  <div class="grid-summary">
    <div class="summary-card">
      <div>Assigned Vehicle</div>
      <div>${truck.name}</div>
      <div>${truck.volumeCuFt} gross cu ft</div>
    </div>
    <div class="summary-card">
      <div>Cargo Volume</div>
      <div style="color: #0066ff;">${capacityResult.totalVolumeCuFt} cu ft</div>
      <div>${capacityResult.fillPercentage}% Usable Capacity</div>
    </div>
    <div class="summary-card">
      <div>Safety Buffer</div>
      <div style="color: #10b981;">18% Included</div>
      <div>${capacityResult.usableCapacityCuFt} cu ft usable</div>
    </div>
    <div class="summary-card">
      <div>Cargo Weight</div>
      <div>${capacityResult.totalWeightLbs.toLocaleString()} lbs</div>
      <div>Max Payload: ${capacityResult.maxPayloadLbs.toLocaleString()} lbs</div>
    </div>
  </div>

  <!-- Itemized Cargo Inventory -->
  <h3>Itemized Cargo & Furniture Checklist (${allManifestItems.length} Unique Items)</h3>
  ${
    allManifestItems.length > 0
      ? `<table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Category</th>
          <th>Packed Dimensions</th>
          <th>Assigned Loading Zone</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Total Cu Ft</th>
          <th style="text-align: center;">Loaded</th>
        </tr>
      </thead>
      <tbody>
        ${furnitureRows}
      </tbody>
    </table>`
      : `<p style="font-style: italic; color: #6b7280; margin-bottom: 12px;">No large furniture items selected. Only boxed cargo registered.</p>`
  }

  <!-- Box & Packaging Checklist -->
  <h3>Recommended Box & Packaging Supply Shopping List (${totalBoxes} Boxes Total)</h3>
  <div class="box-grid">
    <div class="box-card">
      <div class="box-title">Small Box (1.5 cu ft)</div>
      <div class="box-qty">${smallBoxes} Units</div>
      <div class="box-sub">Books, tools, canned goods</div>
    </div>
    <div class="box-card">
      <div class="box-title">Medium Box (3.0 cu ft)</div>
      <div class="box-qty">${mediumBoxes} Units</div>
      <div class="box-sub">Pantry, cookware, small decor</div>
    </div>
    <div class="box-card">
      <div class="box-title">Large Box (4.5 cu ft)</div>
      <div class="box-qty">${largeBoxes} Units</div>
      <div class="box-sub">Bedding, pillows, lampshades</div>
    </div>
    <div class="box-card">
      <div class="box-title">Wardrobe Box (16 cu ft)</div>
      <div class="box-qty">${wardrobeBoxes} Units</div>
      <div class="box-sub">Hanging garments & coats</div>
    </div>
    <div class="box-card">
      <div class="box-title">Heavy-Duty Tape</div>
      <div class="box-qty" style="color: #ff5500;">${tapeRolls} Rolls</div>
      <div class="box-sub">55-yd commercial grade</div>
    </div>
  </div>

  <!-- 4-Phase Professional Stacking Protocol -->
  <h3>4-Phase Professional Stacking Protocol</h3>
  <div class="phase-card">
    <div class="phase-title">Phase 1 — Left Side Wall Rails (Stood on Edge along X-Axis)</div>
    <div class="phase-desc">Stand mattresses, box springs, dining tabletops, and headboards vertically along the side rail (Z = 0). Strap securely to wall tie-downs.</div>
  </div>
  <div class="phase-card">
    <div class="phase-title">Phase 2 — Front Bulkhead (Heavy Foundation Deck)</div>
    <div class="phase-desc">Stand sofas vertically against the front bulkhead cab wall (X = 0). Place dressers, desks, and appliances flat on the floor deck.</div>
  </div>
  <div class="phase-card">
    <div class="phase-title">Phase 3 — Dense Box Columns (Floor to Ceiling)</div>
    <div class="phase-desc">Stack boxes in vertical tiers from floor to ceiling. Heaviest large boxes on bottom, progressing to medium and small on top.</div>
  </div>
  <div class="phase-card">
    <div class="phase-title">Phase 4 — Mom's Attic Cab Compartment (Light & Fragile Goods)</div>
    <div class="phase-desc">Route wardrobe hanging boxes, electronics, fragile dish packs, and lightweight parcels into the overhead cab deck.</div>
  </div>

  <div class="notice">
    <strong>Notice:</strong> All calculations, spatial models, and box counts are mathematical estimates based on standard furniture dimensions and professional loading practices. Vehicle specifications reflect standard US rental fleets (U-Haul, Budget, Penske). When between truck sizes, rental providers always recommend reserving the larger vehicle.
  </div>
</body>
</html>`;
  }, [allManifestItems, truck, capacityResult, leadId, moveDate, originZip, destinationZip, smallBoxes, mediumBoxes, largeBoxes, wardrobeBoxes, totalBoxes, tapeRolls]);

  /**
   * Print via isolated iframe to guarantee ZERO canvas pixels or dark mode artifacts in print preview.
   */
  const handlePrint = () => {
    const html = generateStandaloneHTML();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-1000';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 350);
    } else {
      window.print();
    }
  };

  /**
   * Direct download of standalone HTML document
   */
  const handleDownloadHTML = () => {
    const html = generateStandaloneHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TruckSizer_Load_Manifest_${leadId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="manifest-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm print:p-0 print:bg-white print:static"
    >
      {/* Modal Card Container */}
      <div
        id="manifest-printable-document"
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg bg-[#111318] border border-[#1F242F] text-zinc-100 p-4 sm:p-6 print:border-none print:max-w-none print:max-h-none print:p-0 print:text-black print:bg-white"
      >
        {/* Modal Action Header Bar (Hidden during print) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#1F242F] print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF5500]" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Official Load Manifest
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-[#0066FF]/20 text-[#0066FF] font-mono">
              REF: {leadId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors duration-150"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1F242F] hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors duration-150"
              title="Download standalone HTML document"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Download HTML</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-5 print:space-y-3">
          {/* Document Title Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-[#1F242F] print:border-black">
            <div>
              <div className="text-xl font-bold tracking-tight text-white print:text-black">
                TRUCK<span className="text-[#FF5500]">SIZER</span> LOAD MANIFEST
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                Certified Cargo Volume Plan &amp; Commercial Vehicle Packing Instructions
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#090A0C] p-3 rounded-md border border-[#1F242F] print:bg-zinc-50 print:border-zinc-300 print:text-black">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Assigned Vehicle</div>
              <div className="text-xs font-semibold text-white print:text-black mt-0.5">
                {truck.name}
              </div>
              <div className="text-[10px] text-zinc-400 tabular-nums">
                {truck.volumeCuFt} gross cu ft
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Cargo Volume</div>
              <div className="text-xs font-semibold text-[#0066FF] mt-0.5 tabular-nums">
                {capacityResult.totalVolumeCuFt} cu ft
              </div>
              <div className="text-[10px] text-zinc-400 tabular-nums">
                {capacityResult.fillPercentage}% Usable Cap.
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Safety Buffer</div>
              <div className="text-xs font-semibold text-[#10B981] mt-0.5">
                18% Included
              </div>
              <div className="text-[10px] text-zinc-400 tabular-nums">
                {capacityResult.usableCapacityCuFt} cu ft usable
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-medium">Cargo Weight</div>
              <div
                className={`text-xs font-semibold mt-0.5 tabular-nums ${
                  capacityResult.isOverweight ? 'text-[#EF4444]' : 'text-white print:text-black'
                }`}
              >
                {capacityResult.totalWeightLbs.toLocaleString()} lbs
              </div>
              <div className="text-[10px] text-zinc-400 tabular-nums">
                Cap: {capacityResult.maxPayloadLbs.toLocaleString()} lbs
              </div>
            </div>
          </div>

          {/* 2. Itemized Cargo & Furniture Checklist Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white print:text-black uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
                <span>Itemized Cargo &amp; Furniture Checklist ({allManifestItems.length} Items)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Moving Day Sign-Off</span>
            </div>

            {allManifestItems.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-[#1F242F] print:border-zinc-300">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#090A0C] print:bg-zinc-100 text-zinc-400 print:text-zinc-800 text-[10px] uppercase font-mono">
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300">Item Description</th>
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300">Dimensions</th>
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300">Assigned Stacking Zone</th>
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300 text-center">Qty</th>
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300 text-right">Volume</th>
                      <th className="p-2 border-b border-[#1F242F] print:border-zinc-300 text-center w-10">Loaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F242F] print:divide-zinc-300 text-xs">
                    {allManifestItems.map((it) => (
                      <tr key={it.id} className="hover:bg-[#090A0C]/40 print:hover:bg-transparent">
                        <td className="p-2 font-medium text-white print:text-black">{it.name}</td>
                        <td className="p-2 font-mono text-[11px] text-zinc-400 print:text-zinc-600">{it.dimensions}</td>
                        <td className="p-2 text-[11px] text-[#38BDF8] print:text-blue-700">{it.zone}</td>
                        <td className="p-2 text-center font-mono font-semibold text-white print:text-black tabular-nums">{it.quantity}</td>
                        <td className="p-2 text-right font-mono text-zinc-300 print:text-black tabular-nums">{it.totalVolume} cu ft</td>
                        <td className="p-2 text-center">
                          <span className="inline-block w-3.5 h-3.5 border border-zinc-500 rounded print:border-black" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-[#090A0C] border border-[#1F242F] text-xs text-zinc-400 italic">
                No large furniture items selected. Only boxed cargo registered.
              </div>
            )}
          </div>

          {/* 3. Itemized Box & Supply Shopping Checklist */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white print:text-black uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5 text-[#FF5500]" strokeWidth={1.5} />
              <span>Recommended Box &amp; Packaging Supply Checklist ({totalBoxes} Boxes Total)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[10px]">Small (1.5 cu ft)</div>
                <div className="text-sm font-bold text-white print:text-black mt-0.5 tabular-nums">
                  {smallBoxes} Units
                </div>
                <div className="text-[9px] text-zinc-500">Books &amp; heavy items</div>
              </div>

              <div className="p-2 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[10px]">Medium (3.0 cu ft)</div>
                <div className="text-sm font-bold text-white print:text-black mt-0.5 tabular-nums">
                  {mediumBoxes} Units
                </div>
                <div className="text-[9px] text-zinc-500">Pantry &amp; cookware</div>
              </div>

              <div className="p-2 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[10px]">Large (4.5 cu ft)</div>
                <div className="text-sm font-bold text-white print:text-black mt-0.5 tabular-nums">
                  {largeBoxes} Units
                </div>
                <div className="text-[9px] text-zinc-500">Linens &amp; bedding</div>
              </div>

              <div className="p-2 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[10px]">Wardrobe (16 cu ft)</div>
                <div className="text-sm font-bold text-white print:text-black mt-0.5 tabular-nums">
                  {wardrobeBoxes} Units
                </div>
                <div className="text-[9px] text-zinc-500">Clothes on hangers</div>
              </div>

              <div className="p-2 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="text-zinc-400 text-[10px]">Packing Tape</div>
                <div className="text-sm font-bold text-[#FF5500] mt-0.5 tabular-nums">
                  {tapeRolls} Rolls
                </div>
                <div className="text-[9px] text-zinc-500">55-yard heavy duty</div>
              </div>
            </div>
          </div>

          {/* 4. 4-Phase Truck Loading Sequence Guide */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white print:text-black uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
              <span>4-Phase Commercial Loading Sequence</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 1 — Left Side Wall Rails (Standing on Edge)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[10px] mt-0.5">
                  Stand mattresses, box springs, dining tabletops, and mirrors vertically along the driver-side rail ($Z = 0$). Secure firmly with ratchet straps to side wall tie-downs.
                </p>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 2 — Front Bulkhead (Heavy Base Foundation)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[10px] mt-0.5">
                  Stand sofas vertically against the front bulkhead cab wall ($X = 0$). Place dressers, desks, nightstands, and heavy machinery flat on the floor deck.
                </p>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 3 — Dense Box Columns (Floor to Ceiling)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[10px] mt-0.5">
                  Stack cardboard boxes in tight vertical tiers from the deck to the roof. Place heaviest large boxes on the bottom, progressing to medium and small boxes on top.
                </p>
              </div>

              <div className="p-2.5 bg-[#090A0C] border border-[#1F242F] rounded-md print:border-zinc-300 print:bg-white">
                <div className="font-semibold text-white print:text-black">
                  Phase 4 — Mom&apos;s Attic Cab Compartment (Fragile &amp; Hanging Goods)
                </div>
                <p className="text-zinc-400 print:text-zinc-700 text-[10px] mt-0.5">
                  Route wardrobe hanging boxes, electronics, fragile dish packs, and lightweight parcels into the overhead cab deck ($Y &gt; 50″$).
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-[9px] text-zinc-500 border-t border-[#1F242F] pt-2.5 leading-relaxed print:border-zinc-300">
            Notice: All volumetric calculations, spatial models, and box counts are mathematical estimates based on standard furniture dimensions and professional loading practices. Vehicle dimensions reflect standard US rental fleets (U-Haul, Budget, Penske). When between truck sizes, rental providers always recommend reserving the larger vehicle.
          </div>
        </div>
      </div>
    </div>
  );
}
