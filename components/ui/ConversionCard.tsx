'use client';

import React, { useState } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { CustomItemInput } from '@/lib/engine/packEngine';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertCircle,
  Calendar,
  MapPin,
  Mail,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { trackQuoteFormSubmitted } from '@/lib/analytics/events';

interface ConversionCardProps {
  truck: TruckSpec;
  capacityResult: CapacityCalculationResult;
  inventory: Record<string, number>;
  customItems: CustomItemInput[];
  onOpenManifest?: (info: {
    leadId: string;
    originZip: string;
    destinationZip: string;
    moveDate: string;
  }) => void;
  className?: string;
}

const ZIP_REGEX = /^\d{5}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const BASE_RATES: Record<string, { low: number; high: number; formatted: string }> = {
  '10ft': { low: 290, high: 490, formatted: '$290 – $490' },
  '15ft': { low: 390, high: 650, formatted: '$390 – $650' },
  '20ft': { low: 490, high: 790, formatted: '$490 – $790' },
  '26ft': { low: 650, high: 990, formatted: '$650 – $990' },
};

export function ConversionCard({
  truck,
  capacityResult,
  inventory,
  customItems,
  onOpenManifest,
  className = '',
}: ConversionCardProps) {
  // 2-Step Micro-Commitment State (Step 1: Origin/Dest ZIPs; Step 2: Date/Email)
  const [step, setStep] = useState<1 | 2>(1);

  const [originZip, setOriginZip] = useState('');
  const [destinationZip, setDestinationZip] = useState('');
  const [moveDate, setMoveDate] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadResult, setLeadResult] = useState<{
    leadId: string;
    priceRange: { low: number; high: number; formatted: string };
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const ratePreview = BASE_RATES[truck.id] || BASE_RATES['15ft'];

  // Validate Step 1 (ZIPs)
  const validateStep1 = () => {
    const errs: Record<string, string> = {};

    if (!originZip.trim()) {
      errs.originZip = 'Origin ZIP is required.';
    } else if (!ZIP_REGEX.test(originZip.trim())) {
      errs.originZip = 'Enter a valid 5-digit US ZIP.';
    }

    if (!destinationZip.trim()) {
      errs.destinationZip = 'Destination ZIP is required.';
    } else if (!ZIP_REGEX.test(destinationZip.trim())) {
      errs.destinationZip = 'Enter a valid 5-digit US ZIP.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate Step 2 (Date & Email)
  const validateStep2 = () => {
    const errs: Record<string, string> = {};

    if (!moveDate) {
      errs.moveDate = 'Please select your move date.';
    } else if (moveDate < todayStr) {
      errs.moveDate = 'Move date cannot be in the past.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Proceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originZip: originZip.trim(),
          destinationZip: destinationZip.trim(),
          moveDate,
          email: email.trim(),
          cuFt: capacityResult.totalVolumeCuFt,
          truckSize: truck.id,
          safetyBuffer: 18,
          inventorySummary: inventory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quote request.');
      }

      const data = await response.json();
      setLeadResult({
        leadId: data.leadId,
        priceRange: data.priceRange,
      });

      trackQuoteFormSubmitted(
        data.leadId,
        truck.id,
        capacityResult.totalVolumeCuFt,
        originZip.trim(),
        destinationZip.trim()
      );
    } catch (err: unknown) {
      setErrors({
        form: err instanceof Error ? err.message : 'Submission failed. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside
      className={`flex flex-col h-full bg-[#111318] border-l border-[#1F242F] text-zinc-200 overflow-y-auto ${className}`}
    >
      {/* 1. Header */}
      <div className="p-3.5 border-b border-[#1F242F] space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Estimated Route Pricing
          </h2>
          <span className="text-[10px] font-mono uppercase text-zinc-400 bg-[#090A0C] px-1.5 py-0.5 rounded border border-[#1F242F]">
            Step {step} of 2
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#0066FF]/15 text-[#38BDF8] border border-[#0066FF]/30 tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
          Sized for {truck.name} ({capacityResult.fillPercentage}% Capacity)
        </div>
      </div>

      {/* 2. Form or Confirmation View */}
      <div className="p-3.5 flex-1">
        {leadResult ? (
          /* Confirmation State */
          <div className="space-y-4 text-center py-2">
            <div className="w-9 h-9 mx-auto rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981]">
              <CheckCircle className="w-5 h-5" strokeWidth={1.75} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Rate Estimate Dispatched</h3>
              <p className="text-xs text-zinc-400">
                Verified commercial movers matching your {truck.name} capacity profile.
              </p>
            </div>

            {/* Estimated Price Range Banner */}
            <div className="p-3.5 rounded-md bg-[#090A0C] border border-[#1F242F] text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="text-[10px] uppercase tracking-wider font-semibold">ESTIMATED PRICE RANGE</span>
                <span className="font-mono text-[#10B981] font-semibold text-xs">{leadResult.leadId}</span>
              </div>
              <div className="text-xl font-bold text-white tracking-tight font-mono tabular-nums">
                {leadResult.priceRange.formatted}
              </div>
              <div className="text-[11px] text-zinc-400">
                Based on {truck.name} capacity ({capacityResult.totalVolumeCuFt} cu ft cargo) from ZIP {originZip} to {destinationZip}.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onOpenManifest?.({
                    leadId: leadResult.leadId,
                    originZip,
                    destinationZip,
                    moveDate,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors duration-150"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>View & Print Load Manifest</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLeadResult(null);
                  setStep(1);
                }}
                className="w-full py-1.5 px-3 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors duration-150"
              >
                Calculate Another Route
              </button>
            </div>
          </div>
        ) : (
          /* Progressive 2-Step Micro-Commitment Form */
          <form onSubmit={step === 1 ? handleStep1Proceed : handleFinalSubmit} className="space-y-3">
            {errors.form && (
              <div className="p-2 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* STEP 1 FIELDS: Origin & Destination ZIPs */}
            <div className="space-y-3">
              {/* Origin ZIP */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-[#FF5500]" strokeWidth={1.5} />
                  Origin ZIP Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={originZip}
                  onChange={(e) => {
                    setOriginZip(e.target.value.replace(/\D/g, ''));
                    if (errors.originZip) setErrors((prev) => ({ ...prev, originZip: '' }));
                  }}
                  placeholder="e.g. 90210"
                  className={`w-full bg-[#090A0C] border ${
                    errors.originZip ? 'border-[#EF4444]' : 'border-[#1F242F]'
                  } rounded-md px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 tabular-nums`}
                />
                {errors.originZip && (
                  <p className="text-[10px] text-[#EF4444]">{errors.originZip}</p>
                )}
              </div>

              {/* Destination ZIP */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-[#0066FF]" strokeWidth={1.5} />
                  Destination ZIP Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={destinationZip}
                  onChange={(e) => {
                    setDestinationZip(e.target.value.replace(/\D/g, ''));
                    if (errors.destinationZip) setErrors((prev) => ({ ...prev, destinationZip: '' }));
                  }}
                  placeholder="e.g. 10001"
                  className={`w-full bg-[#090A0C] border ${
                    errors.destinationZip ? 'border-[#EF4444]' : 'border-[#1F242F]'
                  } rounded-md px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 tabular-nums`}
                />
                {errors.destinationZip && (
                  <p className="text-[10px] text-[#EF4444]">{errors.destinationZip}</p>
                )}
              </div>
            </div>

            {/* STEP 2 EXPANSION: High-Intent Reveal (Move Date & Email) */}
            {step === 2 && (
              <div className="space-y-3 pt-2 border-t border-[#1F242F] animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Route Summary Pill */}
                <div className="flex items-center justify-between p-2 rounded-md bg-[#090A0C] border border-[#1F242F] text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-mono">Verified Route</span>
                    <span className="font-semibold text-white font-mono tabular-nums">
                      {originZip} → {destinationZip}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[10px] text-[#0066FF] hover:underline font-medium"
                  >
                    Edit ZIPs
                  </button>
                </div>

                {/* Instant Pricing Estimate Badge */}
                <div className="p-2.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-xs flex items-center justify-between">
                  <span className="text-zinc-300">Estimated Carrier Rate:</span>
                  <span className="font-bold text-[#10B981] font-mono tabular-nums">
                    {ratePreview.formatted}
                  </span>
                </div>

                {/* Move Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                    Scheduled Move Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={moveDate}
                    onChange={(e) => {
                      setMoveDate(e.target.value);
                      if (errors.moveDate) setErrors((prev) => ({ ...prev, moveDate: '' }));
                    }}
                    className={`w-full bg-[#090A0C] border ${
                      errors.moveDate ? 'border-[#EF4444]' : 'border-[#1F242F]'
                    } rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500`}
                  />
                  {errors.moveDate && (
                    <p className="text-[10px] text-[#EF4444]">{errors.moveDate}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Mail className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@company.com"
                    className={`w-full bg-[#090A0C] border ${
                      errors.email ? 'border-[#EF4444]' : 'border-[#1F242F]'
                    } rounded-md px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-[#EF4444]">{errors.email}</p>
                  )}
                </div>

                {/* Micro-copy */}
                <p className="text-[10px] text-zinc-500 leading-tight">
                  We send your load manifest and verified carrier rates directly to your inbox.
                </p>
              </div>
            )}

            {/* 3. Primary CTA Button */}
            {step === 1 ? (
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold tracking-wider uppercase transition-colors duration-150 mt-2"
              >
                <span>Calculate Route &amp; Rates</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold tracking-wider uppercase transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Locking Rates...</span>
                  </>
                ) : (
                  <>
                    <span>Lock In Rates &amp; Get PDF Manifest</span>
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>
            )}

            {/* 4. Trust Signals */}
            <div className="pt-2.5 border-t border-[#1F242F] space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" strokeWidth={1.5} />
                <span>USDOT Licensed Carriers</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <FileCheck className="w-3.5 h-3.5 text-[#FF5500] shrink-0" strokeWidth={1.5} />
                <span>18% Real-World Buffer Applied</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-[#0066FF] shrink-0" strokeWidth={1.5} />
                <span>No-Spam Guarantee &amp; Encrypted Data</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
