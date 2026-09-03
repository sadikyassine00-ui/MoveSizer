'use client';

import React, { useState } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { CustomItemInput } from '@/lib/engine/packEngine';
import {
  ShieldCheck,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertCircle,
  Calendar,
  MapPin,
  Mail,
  Loader2,
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

export function ConversionCard({
  truck,
  capacityResult,
  inventory,
  customItems,
  onOpenManifest,
  className = '',
}: ConversionCardProps) {
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

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!originZip.trim()) {
      errs.originZip = 'Origin ZIP is required.';
    } else if (!ZIP_REGEX.test(originZip.trim())) {
      errs.originZip = 'Enter a valid 5-digit US ZIP code.';
    }

    if (!destinationZip.trim()) {
      errs.destinationZip = 'Destination ZIP is required.';
    } else if (!ZIP_REGEX.test(destinationZip.trim())) {
      errs.destinationZip = 'Enter a valid 5-digit US ZIP code.';
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      <div className="p-4 border-b border-[#1F242F] space-y-2">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Lock In Verified Moving Rates
        </h2>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#0066FF]/15 text-[#38BDF8] border border-[#0066FF]/30 tabular-nums">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
          Sized for {truck.name} ({capacityResult.fillPercentage}% Capacity)
        </div>
      </div>

      {/* 2. Form or Confirmation View */}
      <div className="p-4 flex-1">
        {leadResult ? (
          /* Confirmation State */
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981]">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Rate Estimate Locked</h3>
              <p className="text-xs text-zinc-400">
                Quotes dispatched to verified movers matching your cargo profile.
              </p>
            </div>

            {/* Estimated Price Range Banner */}
            <div className="p-4 rounded-xl bg-[#090A0C] border border-[#1F242F] text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>ESTIMATED PRICE RANGE</span>
                <span className="font-mono text-[#10B981] font-semibold">{leadResult.leadId}</span>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
                {leadResult.priceRange.formatted}
              </div>
              <div className="text-[11px] text-zinc-400">
                Based on {truck.name} capacity ({capacityResult.totalVolumeCuFt} cu ft cargo) from ZIP {originZip} to {destinationZip}.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-colors shadow-lg shadow-[#0066FF]/20"
              >
                <FileText className="w-4 h-4" />
                <span>View & Print Load Manifest</span>
              </button>

              <button
                type="button"
                onClick={() => setLeadResult(null)}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#1F242F] transition-colors"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          /* Quote Request Form */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errors.form && (
              <div className="p-2.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Origin ZIP */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-3 h-3 text-[#FF5500]" />
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
                } rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#0066FF] tabular-nums`}
              />
              {errors.originZip && (
                <p className="text-[10px] text-[#EF4444]">{errors.originZip}</p>
              )}
            </div>

            {/* Destination ZIP */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-3 h-3 text-[#0066FF]" />
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
                } rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#0066FF] tabular-nums`}
              />
              {errors.destinationZip && (
                <p className="text-[10px] text-[#EF4444]">{errors.destinationZip}</p>
              )}
            </div>

            {/* Move Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Calendar className="w-3 h-3 text-zinc-400" />
                Move Date
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
                } rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0066FF]`}
              />
              {errors.moveDate && (
                <p className="text-[10px] text-[#EF4444]">{errors.moveDate}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Mail className="w-3 h-3 text-zinc-400" />
                Email for Instant Estimate
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="your.email@example.com"
                className={`w-full bg-[#090A0C] border ${
                  errors.email ? 'border-[#EF4444]' : 'border-[#1F242F]'
                } rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#0066FF]`}
              />
              {errors.email && (
                <p className="text-[10px] text-[#EF4444]">{errors.email}</p>
              )}
            </div>

            {/* 3. Primary CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold tracking-wide uppercase transition-all shadow-lg shadow-[#FF5500]/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Matching Rates...</span>
                </>
              ) : (
                <>
                  <span>Compare Mover Rates & Truck Prices</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 4. Trust Signals */}
            <div className="pt-3 border-t border-[#1F242F] space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span>USDOT Licensed Carriers</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <Lock className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                <span>No-Spam Guarantee & Encrypted Data</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <Zap className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span>Instant Estimate & Load Manifest PDF</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
