'use client';

export type FunnelEvent =
  | 'preset_selected'
  | 'capacity_threshold_crossed'
  | 'size_up_clicked'
  | 'quote_step2_reached'
  | 'quote_form_submitted';

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
}

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      target: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export function trackEvent<E extends FunnelEvent>(
  eventName: E,
  payload: EventPayloads[E]
) {
  if (typeof window === 'undefined') return;

  // 1. Google Analytics 4 Dispatch
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, payload as unknown as Record<string, unknown>);
  }

  // 2. Debug Logger
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[ANALYTICS EVENT: ${eventName}]`, payload);
  }
}

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
