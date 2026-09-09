'use client';

import React, { useState, useEffect } from 'react';
import { TruckSpec } from '@/lib/constants/trucks';
import { CapacityCalculationResult } from '@/lib/engine/capacityEngine';
import { CustomItemInput } from '@/lib/engine/packEngine';
import { calculateRoadDistanceMiles } from '@/lib/engine/pricingEngine';
import {
  calculateMoveEstimate,
  MoveEstimateResult,
} from '@/lib/pricing/moveEstimator';
import { LoadManifestDataObject } from '@/lib/manifest/generateManifest';
import {
  ShieldCheck,
  CheckCircle,
  FileText,
  AlertCircle,
  Calendar,
  MapPin,
  Mail,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Truck,
  Users,
  Building,
  RotateCcw,
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

  const [roadMiles, setRoadMiles] = useState<number>(250);
  const [originPlace, setOriginPlace] = useState<string | undefined>();
  const [destinationPlace, setDestinationPlace] = useState<string | undefined>();

  const [estimate, setEstimate] = useState<MoveEstimateResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-submission result state
  const [submissionResult, setSubmissionResult] = useState<{
    refId: string;
    manifest: LoadManifestDataObject;
    estimate: MoveEstimateResult;
    shareableUrl: string;
    emailDispatched: boolean;
    emailError?: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Re-calculate move estimate if truck size or cargo volume changes while in Step 2 or after submit
  useEffect(() => {
    if (originZip && destinationZip && ZIP_REGEX.test(originZip) && ZIP_REGEX.test(destinationZip)) {
      const updatedEstimate = calculateMoveEstimate({
        truckSize: truck.id,
        cargoCuFt: capacityResult.totalVolumeCuFt,
        distanceMiles: roadMiles,
        originZip,
        destZip: destinationZip,
      });
      setEstimate(updatedEstimate);
    }
  }, [truck.id, capacityResult.totalVolumeCuFt, roadMiles, originZip, destinationZip]);

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

  // Step 1 Submit: Calculate Route & Distance
  const handleStep1Proceed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsCalculatingRoute(true);
    try {
      const distance = await calculateRoadDistanceMiles(originZip.trim(), destinationZip.trim());
      setRoadMiles(distance.roadMiles);
      setOriginPlace(distance.originPlace);
      setDestinationPlace(distance.destinationPlace);

      const computedEstimate = calculateMoveEstimate({
        truckSize: truck.id,
        cargoCuFt: capacityResult.totalVolumeCuFt,
        distanceMiles: distance.roadMiles,
        originZip: originZip.trim(),
        destZip: destinationZip.trim(),
      });
      setEstimate(computedEstimate);

      setStep(2);
      trackQuoteStep2Reached(originZip.trim(), destinationZip.trim(), truck.id);
      trackRouteCalculated({
        originZip: originZip.trim(),
        destinationZip: destinationZip.trim(),
        roadMiles: distance.roadMiles,
        isLocal: distance.roadMiles < 100,
      });
      trackDwellingSelected({
        dwelling: dwellingType || 'custom',
        estimatedCuFt: capacityResult.totalVolumeCuFt,
        truckSize: truck.id,
      });
    } catch {
      // Fallback
      setStep(2);
      const fallbackEstimate = calculateMoveEstimate({
        truckSize: truck.id,
        cargoCuFt: capacityResult.totalVolumeCuFt,
        distanceMiles: 250,
        originZip: originZip.trim(),
        destZip: destinationZip.trim(),
      });
      setEstimate(fallbackEstimate);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Step 2 Submit: Call /api/send-plan
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/send-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originZip: originZip.trim(),
          destinationZip: destinationZip.trim(),
          moveDate,
          email: email.trim(),
          truckSize: truck.id,
          cargoCuFt: capacityResult.totalVolumeCuFt,
          inventorySummary: inventory,
          customItems: customItems.map((c) => ({
            id: c.id,
            name: c.name,
            length: c.length,
            width: c.width,
            height: c.height,
            quantity: c.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate move plan.');
      }

      const data = await response.json();

      setSubmissionResult({
        refId: data.refId || data.leadId,
        manifest: data.manifest,
        estimate: data.estimate || estimate,
        shareableUrl: data.shareableUrl,
        emailDispatched: !!data.emailDispatched,
        emailError: data.emailError,
      });

      trackQuoteFormSubmitted(
        data.refId,
        truck.id,
        capacityResult.totalVolumeCuFt,
        originZip.trim(),
        destinationZip.trim()
      );

      trackLeadSubmitted({
        leadId: data.refId,
        dwellingType: dwellingType || 'custom',
        truckSize: truck.id,
        originZip: originZip.trim(),
        destinationZip: destinationZip.trim(),
        distanceMiles: roadMiles,
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

  const handleCopyShareableLink = async () => {
    const urlToCopy =
      submissionResult?.shareableUrl ||
      `${window.location.origin}/?ref=${encodeURIComponent(
        submissionResult?.refId || 'TS-PLAN'
      )}&truck=${encodeURIComponent(truck.id)}`;

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
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
            {submissionResult ? 'Verified Plan' : `Step ${step} of 2`}
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

      {/* 2. Form or Post-Submission View */}
      <div className="p-4 flex-1">
        {submissionResult ? (
          /* ========================================================================= */
          /* POST-SUBMISSION VIEW: Instant Manifest Access & 3-Tier Moving Rates       */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Instant Confirmation Badge */}
            {submissionResult.emailDispatched ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    ✓ Official Load Manifest Emailed
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 pl-6 leading-relaxed">
                  Logistics blueprint sent to <span className="font-semibold text-white">{email}</span>. Ref: <span className="font-mono font-bold text-emerald-400">{submissionResult.refId}</span>
                </p>
                <p className="text-[10px] text-zinc-400 pl-6">
                  Check your inbox for the complete itemized checklist, box supply list, and rate breakdown. (Check spam/junk if not received within 60s).
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Manifest Created (Email Delivery Delayed)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 pl-6 leading-relaxed">
                  Ref: <span className="font-mono font-bold text-white">{submissionResult.refId}</span>. Direct email delivery encountered a temporary delay ({submissionResult.emailError || 'Delivery pending'}).
                </p>
                <p className="text-[10px] text-amber-400 pl-6 font-medium">
                  Your full Load Manifest and rate analysis are ready below for instant viewing and PDF export:
                </p>
              </div>
            )}

            {/* ACTION BUTTONS: Instant On-Screen Utility */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-bold">
                  On-Screen Manifest Access
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Print-Ready</span>
              </div>

              {/* Primary Action Button (High Contrast) */}
              <button
                type="button"
                onClick={() =>
                  onOpenManifest?.({
                    leadId: submissionResult.refId,
                    originZip,
                    destinationZip,
                    moveDate,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-orange-600" />
                <span>📄 View &amp; Print Load Manifest (PDF)</span>
              </button>

              {/* Secondary Utility Action: Shareable Link */}
              <button
                type="button"
                onClick={handleCopyShareableLink}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied Blueprint Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>🔗 Copy Shareable Blueprint Link</span>
                  </>
                )}
              </button>
            </div>

            {/* SECTION HEADING: 3-Way Verified Rate Breakdown */}
            <div className="pt-2 border-t border-neutral-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  Verified Moving Rates (~{roadMiles.toLocaleString()} mi)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Compare self-drive vs. hybrid vs. full-service options for your inventory.
              </p>
            </div>

            {/* COLOR-CODED TIER CARDS */}
            <div className="space-y-3">
              {/* TIER 1: DIY Truck Rental (Emerald Green Accent) */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Truck className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-white">DIY Truck Rental</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    SELF-DRIVE BUDGET
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-emerald-300 tabular-nums">
                  {submissionResult.estimate.tiers.diy.formatted}
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Includes truck rental, estimated fuel, and highway tolls.
                </p>
                <div className="text-[10px] text-emerald-400/80 font-mono pt-1 border-t border-emerald-500/20">
                  Fuel: ~${submissionResult.estimate.tiers.diy.breakdown.estimatedFuel} • Tolls: ~${submissionResult.estimate.tiers.diy.breakdown.estimatedTolls}
                </div>
                <a
                  href="https://www.budgettruck.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackAffiliateClick({
                      partnerName: 'BudgetTruck',
                      placement: 'tier_card_diy',
                      url: 'https://www.budgettruck.com',
                    })
                  }
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors"
                >
                  <span>Check Truck Rates &rarr;</span>
                </a>
              </div>

              {/* TIER 2: Hybrid Move (Sky Blue Accent) */}
              <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:border-sky-500/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-white">Hybrid Move</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    MOST POPULAR
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-sky-300 tabular-nums">
                  {submissionResult.estimate.tiers.hybrid.formatted}
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Rent the truck yourself + hire 2 vetted helpers to load &amp; unload.
                </p>
                <div className="text-[10px] text-sky-400/80 font-mono pt-1 border-t border-sky-500/20">
                  Truck baseline + ${submissionResult.estimate.tiers.hybrid.breakdown.laborCost} pro loading crew
                </div>
                <a
                  href="https://www.hireahelper.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackAffiliateClick({
                      partnerName: 'HireAHelper',
                      placement: 'tier_card_hybrid',
                      url: 'https://www.hireahelper.com',
                    })
                  }
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-xs transition-colors"
                >
                  <span>Find Local Helpers &rarr;</span>
                </a>
              </div>

              {/* TIER 3: Full-Service Van Lines (Purple / Amber Accent) */}
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Building className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-white">Full-Service Van Lines</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    TURNKEY / ZERO-EFFORT
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-purple-300 tabular-nums">
                  {submissionResult.estimate.tiers.fullService.formatted}
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Licensed commercial carrier handling packing, driving, and delivery.
                </p>
                <div className="text-[10px] text-purple-400/80 font-mono pt-1 border-t border-purple-500/20">
                  Standard tariff on {submissionResult.estimate.tiers.fullService.breakdown.billableWeightLbs?.toLocaleString()} lbs billable weight
                </div>
                <a
                  href="https://www.moving.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackAffiliateClick({
                      partnerName: 'MovingNetwork',
                      placement: 'tier_card_full_service',
                      url: 'https://www.moving.com',
                    })
                  }
                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-purple-500 hover:bg-purple-400 text-neutral-950 font-bold text-xs transition-colors"
                >
                  <span>Compare Carrier Quotes &rarr;</span>
                </a>
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => {
                setSubmissionResult(null);
                setStep(1);
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Calculate Another Route</span>
            </button>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2-STEP PROGRESSIVE FORM: Step 1 (ZIPs) -> Step 2 (Date & Email)            */
          /* ========================================================================= */
          <form
            onSubmit={step === 1 ? handleStep1Proceed : handleFinalSubmit}
            className="space-y-4"
          >
            {errors.form && (
              <div className="p-2.5 rounded-md bg-red-500/15 border border-red-500/40 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{errors.form}</span>
              </div>
            )}

            {/* STEP 1 FIELDS: Origin & Destination ZIPs */}
            <div className="space-y-3.5">
              {/* Origin ZIP */}
              <div className="space-y-1.5">
                <label
                  htmlFor="origin-zip"
                  className="text-xs font-medium text-neutral-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Origin ZIP
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Moving From
                  </span>
                </label>
                <input
                  id="origin-zip"
                  type="text"
                  maxLength={5}
                  value={originZip}
                  onChange={(e) => {
                    setOriginZip(e.target.value.replace(/\D/g, ''));
                    if (errors.originZip)
                      setErrors((prev) => ({ ...prev, originZip: '' }));
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
                <label
                  htmlFor="destination-zip"
                  className="text-xs font-medium text-neutral-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    Destination ZIP
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Moving To
                  </span>
                </label>
                <input
                  id="destination-zip"
                  type="text"
                  maxLength={5}
                  value={destinationZip}
                  onChange={(e) => {
                    setDestinationZip(e.target.value.replace(/\D/g, ''));
                    if (errors.destinationZip)
                      setErrors((prev) => ({ ...prev, destinationZip: '' }));
                  }}
                  placeholder="e.g. 10001"
                  className={`w-full bg-neutral-950 border ${
                    errors.destinationZip
                      ? 'border-red-500'
                      : 'border-neutral-800'
                  } rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 tabular-nums transition-colors`}
                />
                {errors.destinationZip && (
                  <p className="text-[10px] text-red-400">
                    {errors.destinationZip}
                  </p>
                )}
              </div>
            </div>

            {/* STEP 2 EXPANSION: High-Intent Reveal (Move Date & Email) */}
            {step === 2 && (
              <div className="space-y-3.5 pt-3 border-t border-neutral-800 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Route Summary Pill */}
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase font-mono tracking-wider">
                      <span>Verified Route</span>
                      <span>• ~{roadMiles.toLocaleString()} miles</span>
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
                    {originPlace ? `${originPlace} (${originZip})` : originZip}{' '}
                    →{' '}
                    {destinationPlace
                      ? `${destinationPlace} (${destinationZip})`
                      : destinationZip}
                  </span>
                </div>

                {/* Move Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="move-date"
                    className="text-xs font-medium text-neutral-300 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    Target Move Date
                  </label>
                  <input
                    id="move-date"
                    type="date"
                    min={todayStr}
                    value={moveDate}
                    onChange={(e) => {
                      setMoveDate(e.target.value);
                      if (errors.moveDate)
                        setErrors((prev) => ({ ...prev, moveDate: '' }));
                    }}
                    className={`w-full bg-neutral-950 border ${
                      errors.moveDate ? 'border-red-500' : 'border-neutral-800'
                    } rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-700 transition-colors`}
                  />
                  {errors.moveDate && (
                    <p className="text-[10px] text-red-400">
                      {errors.moveDate}
                    </p>
                  )}
                </div>

                {/* Contact Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="lead-email"
                    className="text-xs font-medium text-neutral-300 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      Contact Email
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      For Blueprint &amp; Rates
                    </span>
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@company.com"
                    className={`w-full bg-neutral-950 border ${
                      errors.email ? 'border-red-500' : 'border-neutral-800'
                    } rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors`}
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-400">{errors.email}</p>
                  )}
                  <p className="text-[10px] text-neutral-500 leading-tight">
                    Instant on-screen access to download your Load Manifest PDF.
                  </p>
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
                    <span>Calculating Road Miles...</span>
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
                    <span>Generating Manifest &amp; Rates...</span>
                  </>
                ) : (
                  <span>Lock Rates &amp; Get Manifest &rarr;</span>
                )}
              </button>
            )}

            {/* 4. Compact Trust Signals */}
            <div className="flex items-center justify-center gap-2.5 pt-2 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1">
                <ShieldCheck
                  className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                  strokeWidth={1.75}
                />
                <span>USDOT Licensed Carriers</span>
              </div>
              <span className="text-neutral-600">•</span>
              <div className="flex items-center gap-1">
                <FileText
                  className="w-3.5 h-3.5 text-orange-500 shrink-0"
                  strokeWidth={1.75}
                />
                <span>Instant Load Manifest</span>
              </div>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}

export default ConversionCard;
