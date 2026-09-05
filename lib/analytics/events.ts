'use client';

import Clarity from '@microsoft/clarity';

export type FunnelEvent =
  | 'preset_selected'
  | 'capacity_threshold_crossed'
  | 'size_up_clicked'
  | 'quote_step2_reached'
  | 'quote_form_submitted'
  | 'route_calculated'
  | 'dwelling_selected'
  | 'lead_submitted'
  | 'manifest_downloaded'
  | 'affiliate_click'
  | 'moving_labor_searched'
  | 'rental_savings_clicked'
  | 'box_kit_amazon_clicked';

export interface EventPayloads {
  preset_selected: {
    preset_id: string;
    truck_size: string;
  };
  capacity_threshold_crossed: {
    status: 'caution' | 'critical';
    fill_percentage: number;
    truck_size: string;
  };
  size_up_clicked: {
    from_truck: string;
    to_truck: string;
    fill_percentage: number;
  };
  quote_step2_reached: {
    origin_zip: string;
    destination_zip: string;
    truck_size: string;
  };
  quote_form_submitted: {
    lead_id: string;
    truck_size: string;
    cu_ft: number;
    origin_zip: string;
    destination_zip: string;
  };
  route_calculated: {
    origin_zip: string;
    destination_zip: string;
    road_miles: number;
    is_local: boolean;
  };
  dwelling_selected: {
    dwelling: string;
    estimated_cu_ft: number;
    truck_size?: string;
  };
  lead_submitted: {
    lead_id: string;
    dwelling_type?: string;
    truck_size: string;
    origin_zip: string;
    destination_zip: string;
    distance_miles?: number;
    cu_ft: number;
  };
  manifest_downloaded: {
    truck_size: string;
    item_count: number;
    format: 'print_pdf' | 'html';
  };
  affiliate_click: {
    partner_name: string;
    placement: string;
    url?: string;
  };
  moving_labor_searched: {
    zip: string;
    helpers: number;
    hours: number;
    truck_label: string;
    estimated_cost: number;
  };
  rental_savings_clicked: {
    competitor_brand: string;
    truck_size: string;
  };
  box_kit_amazon_clicked: {
    total_boxes: number;
    dwelling: string;
  };
}

/**
 * Safe execution wrapper for GA4 telemetry.
 * Verifies execution runs in browser and that window.gtag exists.
 */
export function trackEvent<E extends FunnelEvent>(
  eventName: E,
  payload: EventPayloads[E]
) {
  if (typeof window === 'undefined') return;

  try {
    // 1. Google Analytics 4 Dispatch via window.gtag
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload as unknown as Record<string, unknown>);
    }

    // 2. dataLayer Fallback Push
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...payload,
      });
    }

    // 3. Microsoft Clarity Event Dispatch via official SDK
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
      Clarity.event(eventName);
    }

    // 4. Debug Logger in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[TELEMETRY EVENT: ${eventName}]`, payload);
    }
  } catch (err) {
    // Silent fail in production to avoid crashing user UI
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[GA4 TELEMETRY ERROR: ${eventName}]`, err);
    }
  }
}

// -------------------------------------------------------------
// Explicit Helper Functions for Key User Funnel Actions
// -------------------------------------------------------------

/**
 * 1. Route calculation: captures origin ZIP, destination ZIP, and mileage.
 */
export function trackRouteCalculated(data: {
  originZip: string;
  destinationZip: string;
  roadMiles: number;
  isLocal: boolean;
}) {
  trackEvent('route_calculated', {
    origin_zip: data.originZip,
    destination_zip: data.destinationZip,
    road_miles: data.roadMiles,
    is_local: data.isLocal,
  });
}

/**
 * 2. Dwelling selection / Step 1 completion: captures dwelling slug and estimated cubic feet.
 */
export function trackDwellingSelected(data: {
  dwelling: string;
  estimatedCuFt: number;
  truckSize?: string;
}) {
  trackEvent('dwelling_selected', {
    dwelling: data.dwelling,
    estimated_cu_ft: data.estimatedCuFt,
    truck_size: data.truckSize,
  });
}

/**
 * 3. Lead submission: captures dwelling type, recommended truck tier, and move distance.
 */
export function trackLeadSubmitted(data: {
  leadId: string;
  dwellingType?: string;
  truckSize: string;
  originZip: string;
  destinationZip: string;
  distanceMiles?: number;
  cuFt: number;
}) {
  trackEvent('lead_submitted', {
    lead_id: data.leadId,
    dwelling_type: data.dwellingType,
    truck_size: data.truckSize,
    origin_zip: data.originZip,
    destination_zip: data.destinationZip,
    distance_miles: data.distanceMiles,
    cu_ft: data.cuFt,
  });
}

/**
 * 4. Manifest PDF download: captures truck model and total cargo item count.
 */
export function trackManifestDownloaded(data: {
  truckSize: string;
  itemCount: number;
  format: 'print_pdf' | 'html';
}) {
  trackEvent('manifest_downloaded', {
    truck_size: data.truckSize,
    item_count: data.itemCount,
    format: data.format,
  });
}

/**
 * 5. Outbound affiliate click: captures partner name and UI placement identifier.
 */
export function trackAffiliateClick(data: {
  partnerName: string;
  placement: string;
  url?: string;
}) {
  trackEvent('affiliate_click', {
    partner_name: data.partnerName,
    placement: data.placement,
    url: data.url,
  });
}

// -------------------------------------------------------------
// Backwards-Compatible Helpers
// -------------------------------------------------------------

export function trackPresetSelected(presetId: string, truckSize: string) {
  trackEvent('preset_selected', { preset_id: presetId, truck_size: truckSize });
}

export function trackCapacityThresholdCrossed(
  status: 'caution' | 'critical',
  fillPercentage: number,
  truckSize: string
) {
  trackEvent('capacity_threshold_crossed', {
    status,
    fill_percentage: fillPercentage,
    truck_size: truckSize,
  });
}

export function trackSizeUpClicked(
  fromTruck: string,
  toTruck: string,
  fillPercentage: number
) {
  trackEvent('size_up_clicked', {
    from_truck: fromTruck,
    to_truck: toTruck,
    fill_percentage: fillPercentage,
  });
}

export function trackQuoteStep2Reached(
  originZip: string,
  destinationZip: string,
  truckSize: string
) {
  trackEvent('quote_step2_reached', {
    origin_zip: originZip,
    destination_zip: destinationZip,
    truck_size: truckSize,
  });
}

export function trackQuoteFormSubmitted(
  leadId: string,
  truckSize: string,
  cuFt: number,
  originZip: string,
  destinationZip: string
) {
  trackEvent('quote_form_submitted', {
    lead_id: leadId,
    truck_size: truckSize,
    cu_ft: cuFt,
    origin_zip: originZip,
    destination_zip: destinationZip,
  });
}
