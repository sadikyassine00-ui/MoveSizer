'use client';

import React, { useState, useEffect } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { CustomItemInput } from '@/lib/engine/packEngine';
import { calculateRoutePricing, RoutePricingResult } from '@/lib/engine/pricingEngine';
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
} from 'lucide-react';
import {
  trackQuoteStep2Reached,
  trackQuoteFormSubmitted,
  trackRouteCalculated,
  trackDwellingSelected,
  trackLeadSubmitted,
  trackAffiliateClick,
} from '@/lib/analytics/events';

interface ConversionCardProps {
  truck: TruckSpec;
  capacityResult: CapacityCalculationResult;
  inventory: Record<string, number>;
  customItems: CustomItemInput[];
  dwellingType?: string;
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
  dwellingType,
  onOpenManifest,
  className = '',
}: ConversionCardProps) {
  // 2-Step Micro-Commitment State (Step 1: Origin/Dest ZIPs; Step 2: Date/Email)
  const [step, setStep] = useState<1 | 2>(1);

  const [originZip, setOriginZip] = useState('');
  const [destinationZip, setDestinationZip] = useState('');
  const [moveDate, setMoveDate] = useState('');
  const [email, setEmail] = useState('');

  const [pricingResult, setPricingResult] = useState<RoutePricingResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadResult, setLeadResult] = useState<{
    leadId: string;
    priceRange: { low: number; high: number; formatted: string };
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Keep pricing synced when truck size changes while in Step 2
  useEffect(() => {
    if (step === 2 && originZip && destinationZip && ZIP_REGEX.test(originZip) && ZIP_REGEX.test(destinationZip)) {
      calculateRoutePricing(originZip.trim(), destinationZip.trim(), truck.id).then((res) => {
        setPricingResult(res);
      });
    }
  }, [truck.id, step, originZip, destinationZip]);

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

  const handleStep1Proceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsCalculatingRoute(true);
    try {
      const pricing = await calculateRoutePricing(
        originZip.trim(),
        destinationZip.trim(),
        truck.id
      );
      setPricingResult(pricing);
      setStep(2);
      trackQuoteStep2Reached(originZip.trim(), destinationZip.trim(), truck.id);
      trackRouteCalculated({
        originZip: originZip.trim(),
        destinationZip: destinationZip.trim(),
        roadMiles: pricing.roadMiles,
        isLocal: pricing.isLocal,
      });
      trackDwellingSelected({
        dwelling: dwellingType || 'custom',
        estimatedCuFt: capacityResult.totalVolumeCuFt,
        truckSize: truck.id,
      });
    } catch {
      // Graceful degradation
      setStep(2);
      trackQuoteStep2Reached(originZip.trim(), destinationZip.trim(), truck.id);
      trackRouteCalculated({
        originZip: originZip.trim(),
        destinationZip: destinationZip.trim(),
        roadMiles: 250,
        isLocal: false,
      });
      trackDwellingSelected({
        dwelling: dwellingType || 'custom',
        estimatedCuFt: capacityResult.totalVolumeCuFt,
        truckSize: truck.id,
      });
    } finally {
      setIsCalculatingRoute(false);
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

      trackLeadSubmitted({
        leadId: data.leadId,
        dwellingType: dwellingType || 'custom',
        truckSize: truck.id,
        originZip: originZip.trim(),
        destinationZip: destinationZip.trim(),
        distanceMiles: pricingResult?.roadMiles,
        cuFt: capacityResult.totalVolumeCuFt,
      });
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
      className={`flex flex-col h-full bg-neutral-900 border-l border-neutral-800 text-zinc-200 overflow-y-auto ${className}`}
    >
      {/* 1. Dynamic Header Card */}
      <div className="p-4 border-b border-neutral-800 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Move Summary &amp; Rates
          </h2>
          <span className="text-[10px] font-mono uppercase text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
            Step {step} of 2
          </span>
        </div>

        {/* Selected Truck Size & Capacity Badge */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
            <span className="text-xs font-semibold text-white">
              {truck.name.split(' ')[0]} Moving Truck
            </span>
          </div>
          <span
            className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
              capacityResult.fillPercentage > 85
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : capacityResult.fillPercentage > 70
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {capacityResult.fillPercentage}% Full
          </span>
        </div>
      </div>


      {/* 2. Form or Confirmation View */}
      <div className="p-4 flex-1">
        {leadResult ? (
          /* Confirmation State */
          <div className="space-y-4 text-center py-2">
            <div className="w-9 h-9 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" strokeWidth={1.75} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">Rate Estimate Dispatched</h3>
              <p className="text-xs text-neutral-400">
                Verified commercial movers matching your {truck.name} capacity profile.
              </p>
            </div>

            {/* Estimated Price Range Banner */}
            <div className="p-3.5 rounded-md bg-neutral-950 border border-neutral-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="text-[10px] uppercase tracking-wider font-semibold">ESTIMATED PRICE RANGE</span>
                <span className="font-mono text-emerald-400 font-semibold text-xs">{leadResult.leadId}</span>
              </div>
              <div className="text-xl font-bold text-white tracking-tight font-mono tabular-nums">
                {leadResult.priceRange.formatted}
              </div>
              <div className="text-[11px] text-neutral-400">
                Based on {truck.name} capacity ({capacityResult.totalVolumeCuFt} cu ft cargo) and ~{pricingResult?.roadMiles.toLocaleString() || '250'} road miles from ZIP {originZip} to {destinationZip}.
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
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors duration-150"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>View &amp; Print Load Manifest</span>
              </button>

              {/* Outbound Verified Carrier Affiliate Partner Link */}
              <a
                href="https://www.moving.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackAffiliateClick({
                    partnerName: 'MovingNetwork',
                    placement: 'confirmation_card',
                    url: 'https://www.moving.com',
                  })
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-colors duration-150"
              >
                <span>Compare Carrier Quotes on Moving.com</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-500" strokeWidth={1.5} />
              </a>

              <button
                type="button"
                onClick={() => {
                  setLeadResult(null);
                  setStep(1);
                }}
                className="w-full py-1.5 px-3 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150"
              >
                Calculate Another Route
              </button>
            </div>
          </div>
        ) : (
          /* Progressive 2-Step Micro-Commitment Form */
          <form onSubmit={step === 1 ? handleStep1Proceed : handleFinalSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-2 rounded-md bg-red-500/15 border border-red-500/40 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* STEP 1 FIELDS: Origin & Destination ZIPs */}
            <div className="space-y-3.5">
              {/* Origin ZIP */}
              <div className="space-y-1.5">
                <label htmlFor="origin-zip" className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Origin ZIP
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Moving From</span>
                </label>
                <input
                  id="origin-zip"
                  type="text"
                  maxLength={5}
                  value={originZip}
                  onChange={(e) => {
                    setOriginZip(e.target.value.replace(/\D/g, ''));
                    if (errors.originZip) setErrors((prev) => ({ ...prev, originZip: '' }));
                  }}
                  placeholder="e.g. 90210"
                  className={`w-full bg-neutral-950 border ${
                    errors.originZip ? 'border-red-500' : 'border-neutral-800'
                  } rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 tabular-nums transition-colors`}
                />
                {errors.originZip && (
                  <p className="text-[10px] text-red-400">{errors.originZip}</p>
                )}
              </div>

              {/* Destination ZIP */}
              <div className="space-y-1.5">
                <label htmlFor="destination-zip" className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Destination ZIP
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Moving To</span>
                </label>
                <input
                  id="destination-zip"
                  type="text"
                  maxLength={5}
                  value={destinationZip}
                  onChange={(e) => {
                    setDestinationZip(e.target.value.replace(/\D/g, ''));
                    if (errors.destinationZip) setErrors((prev) => ({ ...prev, destinationZip: '' }));
                  }}
                  placeholder="e.g. 10001"
                  className={`w-full bg-neutral-950 border ${
                    errors.destinationZip ? 'border-red-500' : 'border-neutral-800'
                  } rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 tabular-nums transition-colors`}
                />
                {errors.destinationZip && (
                  <p className="text-[10px] text-red-400">{errors.destinationZip}</p>
                )}
              </div>
            </div>

            {/* STEP 2 EXPANSION: High-Intent Reveal (Move Date & Email) */}
            {step === 2 && (
              <div className="space-y-3 pt-2 border-t border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Route Summary Pill */}
                <div className="p-2.5 rounded-md bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                      <span>Verified Route</span>
                      {pricingResult?.roadMiles && (
                        <span>• ~{pricingResult.roadMiles.toLocaleString()} miles</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] text-blue-400 hover:underline font-medium shrink-0"
                    >
                      Edit ZIPs
                    </button>
                  </div>
                  <span className="font-semibold text-white font-mono tabular-nums text-xs truncate block">
                    {pricingResult?.originPlace ? `${pricingResult.originPlace} (${originZip})` : originZip} → {pricingResult?.destinationPlace ? `${pricingResult.destinationPlace} (${destinationZip})` : destinationZip}
                  </span>
                </div>

                {/* Move Date */}
                <div className="space-y-1.5">
                  <label htmlFor="move-date" className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Move Date
                  </label>
                  <input
                    id="move-date"
                    type="date"
                    min={todayStr}
                    value={moveDate}
                    onChange={(e) => {
                      setMoveDate(e.target.value);
                      if (errors.moveDate) setErrors((prev) => ({ ...prev, moveDate: '' }));
                    }}
                    className={`w-full bg-neutral-950 border ${
                      errors.moveDate ? 'border-red-500' : 'border-neutral-800'
                    } rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-700 transition-colors`}
                  />
                  {errors.moveDate && (
                    <p className="text-[10px] text-red-400">{errors.moveDate}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="lead-email" className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    Contact Email
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@company.com"
                    className={`w-full bg-neutral-950 border ${
                      errors.email ? 'border-red-500' : 'border-neutral-800'
                    } rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* 3. Primary CTA Button */}
            {step === 1 ? (
              <button
                type="submit"
                disabled={isCalculatingRoute}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isCalculatingRoute ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating Rates...</span>
                  </>
                ) : (
                  <span>Compare Rates &amp; Availability &rarr;</span>
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Locking Rates...</span>
                  </>
                ) : (
                  <span>Lock Rates &amp; Get Manifest &rarr;</span>
                )}
              </button>
            )}

            {/* 4. Compact Trust Signals */}
            <div className="flex items-center justify-center gap-2.5 pt-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={1.75} />
                <span>USDOT Licensed Carriers</span>
              </div>
              <span className="text-neutral-600">•</span>
              <div className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" strokeWidth={1.75} />
                <span>18% Buffer Included</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
