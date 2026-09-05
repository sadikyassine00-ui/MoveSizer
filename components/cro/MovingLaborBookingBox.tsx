'use client';

import React, { useState } from 'react';
import { Users, ShieldCheck, Clock, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '../../lib/analytics/events';

interface MovingLaborBookingBoxProps {
  truckLabel?: string;
  className?: string;
  defaultZip?: string;
}

export default function MovingLaborBookingBox({
  truckLabel = 'this truck',
  className = '',
  defaultZip = '',
}: MovingLaborBookingBoxProps) {
  const [zipCode, setZipCode] = useState(defaultZip);
  const [helpers, setHelpers] = useState<number>(2);
  const [hours, setHours] = useState<number>(2);
  const [zipError, setZipError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hourly moving labor rate standard benchmark: ~$85/hr for 2 helpers
  const estimatedRate = helpers === 2 ? 85 : helpers === 3 ? 125 : 165;
  const estimatedTotal = estimatedRate * hours;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanZip = zipCode.trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setZipError('Please enter a valid 5-digit US ZIP code');
      return;
    }
    setZipError('');
    setIsSubmitting(true);

    trackEvent('moving_labor_searched', {
      zip: cleanZip,
      helpers,
      hours,
      truck_label: truckLabel,
      estimated_cost: estimatedTotal,
    });

    // Generate affiliate referral destination (HireAHelper / MovingHelp gateway)
    const referralUrl = `https://www.hireahelper.com/movers/?zip=${cleanZip}&crew_size=${helpers}&hours=${hours}&ref=trucksizer`;

    // Open booking partner in new tab
    setTimeout(() => {
      window.open(referralUrl, '_blank', 'noopener,noreferrer');
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div
      className={`rounded-xl border border-[#1F242F] bg-gradient-to-b from-[#111318] to-[#0D0F14] p-5 shadow-xl ${className}`}
      id="hourly-moving-labor"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F242F] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5500]/10 border border-[#FF5500]/25 text-[#FF5500] text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>DIY Loading Assistance</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Need 2 Experienced Helpers to Load {truckLabel}?
          </h3>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1">
            Keep your rental truck, skip the back pain. Book vetted local movers by the hour to pack &amp; carry heavy items.
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <div className="text-xs text-[#9CA3AF] uppercase font-mono tracking-wider">Starting Rate</div>
          <div className="text-2xl font-black text-[#10B981] font-mono">
            From $85<span className="text-xs font-normal text-[#9CA3AF]">/hr</span>
          </div>
          <div className="text-[11px] text-[#9CA3AF]">Includes 2 verified movers</div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-4">
          <label htmlFor="labor-zip" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
            Loading Location (ZIP Code)
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="labor-zip"
              type="text"
              pattern="[0-9]*"
              maxLength={5}
              placeholder="e.g. 90210"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value);
                if (zipError) setZipError('');
              }}
              className="w-full bg-[#181B22] border border-[#2D3342] rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#6B7280] focus:border-[#FF5500] focus:outline-none focus:ring-1 focus:ring-[#FF5500] transition-colors font-mono"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="labor-helpers" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
            Crew Size
          </label>
          <select
            id="labor-helpers"
            value={helpers}
            onChange={(e) => setHelpers(Number(e.target.value))}
            aria-label="Crew Size"
            className="w-full bg-[#181B22] border border-[#2D3342] rounded-lg py-2.5 px-3 text-sm text-white focus:border-[#FF5500] focus:outline-none focus:ring-1 focus:ring-[#FF5500] transition-colors"
          >
            <option value={2}>2 Movers (Recommended)</option>
            <option value={3}>3 Movers (Faster Loading)</option>
            <option value={4}>4 Movers (Heavy Estates)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="labor-hours" className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
            Hours
          </label>
          <select
            id="labor-hours"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            aria-label="Labor Hours"
            className="w-full bg-[#181B22] border border-[#2D3342] rounded-lg py-2.5 px-3 text-sm text-white focus:border-[#FF5500] focus:outline-none focus:ring-1 focus:ring-[#FF5500] transition-colors font-mono"
          >
            <option value={2}>2 Hours</option>
            <option value={3}>3 Hours</option>
            <option value={4}>4 Hours</option>
            <option value={5}>5 Hours</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[42px] bg-[#FF5500] hover:bg-[#E04B00] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF5500]/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Locating Crews...</span>
            ) : (
              <>
                <span>Check Helpers</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {zipError && (
        <p className="text-xs text-[#EF4444] mt-2 font-medium">{zipError}</p>
      )}

      <div className="mt-4 pt-3 border-t border-[#1F242F]/70 flex flex-wrap items-center justify-between gap-y-2 text-xs text-[#9CA3AF]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          <span>100% Background-Checked Crews</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#0066FF]" />
          <span>Free Cancellation Up to 24h Before</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Standard Damage Coverage Included</span>
        </div>
      </div>
    </div>
  );
}
