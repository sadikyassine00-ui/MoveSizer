'use client';

import React from 'react';
import { Package, ExternalLink, Check, ShoppingBag } from 'lucide-react';
import { trackEvent } from '../../lib/analytics/events';

interface DynamicBoxKitCardProps {
  boxCountTotal?: number;
  dwellingLabel?: string;
  boxBreakdown?: {
    small?: number;
    medium?: number;
    large?: number;
    wardrobe?: number;
  };
  className?: string;
}

export default function DynamicBoxKitCard({
  boxCountTotal = 42,
  dwellingLabel = 'this move',
  boxBreakdown,
  className = '',
}: DynamicBoxKitCardProps) {
  // Default distribution if explicit breakdown isn't passed
  const small = boxBreakdown?.small ?? Math.round(boxCountTotal * 0.3);
  const medium = boxBreakdown?.medium ?? Math.round(boxCountTotal * 0.45);
  const large = boxBreakdown?.large ?? Math.max(1, Math.round(boxCountTotal * 0.15));
  const wardrobe = boxBreakdown?.wardrobe ?? Math.max(2, Math.round(boxCountTotal * 0.1));
  const exactPieces = small + medium + large + wardrobe;

  const handleAmazonClick = () => {
    trackEvent('box_kit_amazon_clicked', {
      total_boxes: exactPieces,
      dwelling: dwellingLabel,
    });
    const amazonSearchUrl = `https://www.amazon.com/s?k=moving+box+kit+${exactPieces}+piece+heavy+duty+wardrobe&tag=trucksizer-20`;
    window.open(amazonSearchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`rounded-xl border border-[#1F242F] bg-gradient-to-br from-[#13161F] to-[#0E1017] p-5 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF9900]/15 border border-[#FF9900]/30 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#FF9900]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase text-[#FF9900] font-semibold tracking-wider">
              <ShoppingBag className="w-3 h-3" />
              <span>Tailored Packing Supply Kit</span>
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              Order Exact {exactPieces}-Piece Box &amp; Tape Kit on Amazon
            </h4>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Calculated precisely for {dwellingLabel}. Heavy-duty corrugated cardboard rated for high-density truck stacking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAmazonClick}
          className="px-4 py-2.5 rounded-lg bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md shadow-[#FF9900]/20"
        >
          <span>Get Kit on Amazon</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1F242F] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
        <div className="rounded-lg bg-[#181B22] border border-[#262B38] p-2">
          <div className="text-base font-black text-white">{small}</div>
          <div className="text-[10px] text-[#9CA3AF] uppercase">Small (1.5 cu ft)</div>
        </div>
        <div className="rounded-lg bg-[#181B22] border border-[#262B38] p-2">
          <div className="text-base font-black text-white">{medium}</div>
          <div className="text-[10px] text-[#9CA3AF] uppercase">Medium (3.0 cu ft)</div>
        </div>
        <div className="rounded-lg bg-[#181B22] border border-[#262B38] p-2">
          <div className="text-base font-black text-white">{large}</div>
          <div className="text-[10px] text-[#9CA3AF] uppercase">Large (4.5 cu ft)</div>
        </div>
        <div className="rounded-lg bg-[#181B22] border border-[#262B38] p-2">
          <div className="text-base font-black text-white">{wardrobe}</div>
          <div className="text-[10px] text-[#9CA3AF] uppercase">Wardrobe Boxes</div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#9CA3AF]">
        <span className="flex items-center gap-1">
          <Check className="w-3 h-3 text-[#10B981]" /> Includes 3 rolls commercial packing tape + bubble cushion
        </span>
        <span className="font-medium text-[#D1D5DB] hidden sm:inline">Prime 1-Day Delivery Available</span>
      </div>
    </div>
  );
}
