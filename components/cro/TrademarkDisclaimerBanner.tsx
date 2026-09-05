import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface TrademarkDisclaimerBannerProps {
  className?: string;
}

/**
 * TrademarkDefenseProtocol: Permanent, un-closable header disclaimer
 * required on all branded spec routes under US Nominative Fair Use.
 */
export default function TrademarkDisclaimerBanner({
  className = '',
}: TrademarkDisclaimerBannerProps) {
  return (
    <div
      role="note"
      aria-label="Trademark Disclaimer"
      className={`w-full bg-[#16181D] border-y border-[#262A36] px-4 py-2.5 text-xs text-[#9CA3AF] ${className}`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2.5 text-center sm:text-left">
        <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 hidden sm:inline-block" />
        <p className="leading-relaxed">
          <span className="font-semibold text-[#D1D5DB]">Legal Notice:</span>{' '}
          TruckSizer is an independent dimensional verification calculator and is not
          affiliated with, endorsed by, or sponsored by U-Haul International, Penske, or
          Budget. Vehicle names and trademarks are used strictly for identification and
          compatibility comparison under nominative fair use.
        </p>
      </div>
    </div>
  );
}
