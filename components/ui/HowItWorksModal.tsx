'use client';

import React, { useEffect } from 'react';
import { X, Layers, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManifest?: () => void;
}

export function HowItWorksModal({ isOpen, onClose, onOpenManifest }: HowItWorksModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      {/* Dark backdrop blur */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside
          className={`w-screen max-w-md bg-[#111318] border-l border-[#1F242F] text-zinc-200 flex flex-col transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="h-14 px-4 border-b border-[#1F242F] bg-[#0D0F14] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                How TruckSizer Works
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors"
              title="Close guide (Esc)"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <p className="text-zinc-400 text-xs leading-relaxed">
              TruckSizer applies commercial freight engineering to consumer moving truck sizing.
              Here are the 3 core principles behind every calculation:
            </p>

            {/* Card 1: Real-World Packing Logic */}
            <div className="p-4 rounded-md bg-[#090A0C] border border-[#1F242F] space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <div className="p-1.5 rounded-md bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30">
                  <Layers className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span>1. Real-World Packing Heuristics</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Mattresses and box springs stand on edge along side rub rails (<code className="text-zinc-300">Z = 0</code>), while sofas stand vertically against the front bulkhead (<code className="text-zinc-300">X = 0</code>). This mirrors professional moving techniques, maximizing deck clearance and keeping the vehicle&apos;s center of gravity stable.
              </p>
            </div>

            {/* Card 2: The 18% Safety Buffer */}
            <div className="p-4 rounded-md bg-[#090A0C] border border-[#1F242F] space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <div className="p-1.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span>2. The 18% Safety Inefficiency Buffer</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Rental providers advertise gross liquid cubic footage. Because solid furniture has irregular shapes, legs, and cushions, 100% capacity is physically impossible. TruckSizer reserves an 18% buffer (<code className="text-zinc-300">Usable Cu Ft = Gross × 0.82</code>) so you never run out of room on moving day.
              </p>
            </div>

            {/* Card 3: Export & Moving Day */}
            <div className="p-4 rounded-md bg-[#090A0C] border border-[#1F242F] space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <div className="p-1.5 rounded-md bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]/30">
                  <FileText className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span>3. Certified Load Manifest Export</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Once your inventory is organized, download a print-ready Load Manifest with a 4-phase loading sequence, box supply checklist, and weight distribution guidelines to hand directly to your movers.
              </p>
              {onOpenManifest && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenManifest();
                  }}
                  className="mt-1 flex items-center gap-1.5 text-[11px] text-[#0066FF] hover:text-[#3385FF] font-medium"
                >
                  <span>Preview Load Manifest</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-[#1F242F] bg-[#0D0F14] flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 font-mono">Precision Sizing Engine</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-white font-semibold text-xs transition-colors"
            >
              Got It
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
