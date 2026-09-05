'use client';

import React from 'react';
import { Tag, ArrowUpRight } from 'lucide-react';
import { trackEvent } from '../../lib/analytics/events';

interface RentalSavingsBannerProps {
  truckSize?: string;
  className?: string;
}

export default function RentalSavingsBanner({
  truckSize = 'this size',
  className = '',
}: RentalSavingsBannerProps) {
  const handleClick = (brand: 'Budget' | 'Penske') => {
    trackEvent('rental_savings_clicked', {
      competitor_brand: brand,
      truck_size: truckSize,
    });
  };

  return (
    <div
      className={`rounded-xl border border-[#10B981]/30 bg-gradient-to-r from-[#10B981]/10 via-[#111318] to-[#10B981]/10 p-4 shadow-lg ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Save 15–20% on {truckSize}</span>
              <span className="inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-semibold">
                Online Promo Available
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Budget &amp; Penske offer verified online booking discounts and unlimited one-way mileage for this vehicle class.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
          <a
            href="https://www.budgettruck.com/?ref=trucksizer"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick('Budget')}
            className="px-3 py-1.5 rounded-lg bg-[#181B22] hover:bg-[#202530] border border-[#2E3545] text-xs font-semibold text-white flex items-center gap-1 transition-colors"
          >
            <span>Budget 20% Off</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
          </a>
          <a
            href="https://www.pensketruckrental.com/?ref=trucksizer"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick('Penske')}
            className="px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#0EA271] text-black text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-[#10B981]/20"
          >
            <span>Check Promo Rates</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
