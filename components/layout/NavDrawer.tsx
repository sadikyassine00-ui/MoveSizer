'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Home,
  HelpCircle,
  Truck,
  FileText,
  Shield,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';
import { TRUCKS, TRUCK_ORDER } from '@/lib/constants/trucks';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WILL_IT_FIT_LINKS = [
  { slug: 'king-mattress-in-10ft-truck', label: 'King Mattress in 10-ft Truck' },
  { slug: 'queen-bed-in-10ft-truck', label: 'Queen Bed in 10-ft Truck' },
  { slug: 'sectional-sofa-in-15ft-truck', label: 'Sectional Sofa in 15-ft Truck' },
  { slug: '3-seat-sofa-in-10ft-truck', label: '3-Seat Sofa in 10-ft Truck' },
  { slug: 'dining-table-in-10ft-truck', label: 'Dining Table in 10-ft Truck' },
  { slug: 'dresser-in-10ft-truck', label: '6-Drawer Dresser in 10-ft Truck' },
  { slug: 'wardrobe-box-in-10ft-truck', label: 'Wardrobe Box in 10-ft Truck' },
  { slug: 'king-mattress-in-15ft-truck', label: 'King Mattress in 15-ft Truck' },
];

export function NavDrawer({ isOpen, onClose }: NavDrawerProps) {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-visibility duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className={`w-screen max-w-md bg-[#111318] border-l border-[#1F242F] text-zinc-200 flex flex-col transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="h-14 px-4 border-b border-[#1F242F] bg-[#0D0F14] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Site Directory & Guides
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors"
              title="Close directory (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
            {/* 1. Dwelling Sizing Guides */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Home className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
                <span>Dwelling Sizing Guides</span>
              </div>
              <div className="space-y-1">
                {Object.entries(DWELLING_SLUG_MAP).map(([slug, item]) => (
                  <Link
                    key={slug}
                    href={`/truck-size/${slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 hover:text-white transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200 group-hover:text-white">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        Default: {item.defaultTruck} truck
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. "Will It Fit?" Single Item Fit Database */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <HelpCircle className="w-3.5 h-3.5 text-[#FF5500]" strokeWidth={1.5} />
                <span>&ldquo;Will It Fit?&rdquo; Clearance Database</span>
              </div>
              <div className="space-y-1">
                {WILL_IT_FIT_LINKS.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/will-it-fit/${link.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 hover:text-white transition-colors group"
                  >
                    <span className="font-medium text-zinc-300 group-hover:text-white truncate pr-2">
                      {link.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Commercial Fleet Specifications */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Truck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                <span>Rental Fleet Specifications</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono">
                {TRUCK_ORDER.map((tid) => {
                  const trk = TRUCKS[tid];
                  return (
                    <div
                      key={tid}
                      className="p-2 rounded-md bg-[#090A0C] border border-[#1F242F] space-y-0.5"
                    >
                      <div className="font-semibold text-white font-sans text-[11px]">
                        {trk.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 tabular-nums">
                        {trk.volumeCuFt} cu ft gross
                      </div>
                      <div className="text-[10px] text-[#10B981] tabular-nums">
                        {Math.round(trk.volumeCuFt * 0.82)} cu ft usable
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Methodology & Legal Resources */}
            <div className="space-y-2 pt-2 border-t border-[#1F242F]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <FileText className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                <span>Technical Specifications & Standards</span>
              </div>
              <div className="space-y-1">
                <Link
                  href="/how-we-calculate"
                  onClick={onClose}
                  className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 hover:text-white transition-colors"
                >
                  <span className="font-medium text-zinc-300">
                    18% Buffer & Box Calculation Methodology
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                </Link>

                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/privacy"
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    <span className="text-zinc-400">Privacy Policy</span>
                    <Shield className="w-3 h-3 text-zinc-500" />
                  </Link>

                  <Link
                    href="/terms"
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] hover:border-zinc-500 hover:text-white transition-colors"
                  >
                    <span className="text-zinc-400">Terms of Service</span>
                    <FileText className="w-3 h-3 text-zinc-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-[#1F242F] bg-[#0D0F14] text-[10px] text-zinc-500 font-mono">
            TRUCKSIZER v1.0 • USDOT Carrier & Freight Sizing Directory
          </div>
        </aside>
      </div>
    </div>
  );
}
