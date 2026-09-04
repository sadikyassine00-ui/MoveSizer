import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackEvent,
  trackRouteCalculated,
  trackDwellingSelected,
  trackLeadSubmitted,
  trackManifestDownloaded,
  trackAffiliateClick,
  trackPresetSelected,
  trackCapacityThresholdCrossed,
  trackSizeUpClicked,
  trackQuoteStep2Reached,
  trackQuoteFormSubmitted,
} from '@/lib/analytics/events';

describe('GA4 Centralized Telemetry Utility', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock window with dataLayer and gtag
    const dataLayer: unknown[] = [];
    const gtag = vi.fn((command: string, action: string, params?: Record<string, unknown>) => {
      // Simulate typical gtag behavior
    });

    Object.defineProperty(global, 'window', {
      value: {
        dataLayer,
        gtag,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('safely dispatches events to window.gtag and window.dataLayer', () => {
    trackEvent('route_calculated', {
      origin_zip: '90210',
      destination_zip: '10001',
      road_miles: 2800,
      is_local: false,
    });

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'route_calculated',
      expect.objectContaining({
        origin_zip: '90210',
        destination_zip: '10001',
        road_miles: 2800,
        is_local: false,
      })
    );

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'route_calculated',
        origin_zip: '90210',
        destination_zip: '10001',
        road_miles: 2800,
        is_local: false,
      })
    );
  });

  it('tracks route calculated helper with correct payload', () => {
    trackRouteCalculated({
      originZip: '30301',
      destinationZip: '33101',
      roadMiles: 660,
      isLocal: false,
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'route_calculated', {
      origin_zip: '30301',
      destination_zip: '33101',
      road_miles: 660,
      is_local: false,
    });
  });

  it('tracks dwelling selected helper with correct payload', () => {
    trackDwellingSelected({
      dwelling: 'studio-apartment',
      estimatedCuFt: 350,
      truckSize: '10ft',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'dwelling_selected', {
      dwelling: 'studio-apartment',
      estimated_cu_ft: 350,
      truck_size: '10ft',
    });
  });

  it('tracks lead submitted helper with accurate details', () => {
    trackLeadSubmitted({
      leadId: 'TS-99881',
      dwellingType: '2-bedroom-apartment',
      truckSize: '20ft',
      originZip: '94103',
      destinationZip: '97201',
      distanceMiles: 635,
      cuFt: 820,
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'lead_submitted', {
      lead_id: 'TS-99881',
      dwelling_type: '2-bedroom-apartment',
      truck_size: '20ft',
      origin_zip: '94103',
      destination_zip: '97201',
      distance_miles: 635,
      cu_ft: 820,
    });
  });

  it('tracks manifest downloaded for print_pdf and html formats', () => {
    trackManifestDownloaded({
      truckSize: '15ft',
      itemCount: 42,
      format: 'print_pdf',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'manifest_downloaded', {
      truck_size: '15ft',
      item_count: 42,
      format: 'print_pdf',
    });

    trackManifestDownloaded({
      truckSize: '26ft',
      itemCount: 88,
      format: 'html',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'manifest_downloaded', {
      truck_size: '26ft',
      item_count: 88,
      format: 'html',
    });
  });

  it('tracks outbound affiliate clicks with partner name and placement', () => {
    trackAffiliateClick({
      partnerName: 'MovingNetwork',
      placement: 'confirmation_card',
      url: 'https://www.moving.com',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'affiliate_click', {
      partner_name: 'MovingNetwork',
      placement: 'confirmation_card',
      url: 'https://www.moving.com',
    });
  });

  it('tracks legacy funnel events without error', () => {
    trackPresetSelected('studio', '10ft');
    expect(window.gtag).toHaveBeenCalledWith('event', 'preset_selected', {
      preset_id: 'studio',
      truck_size: '10ft',
    });

    trackCapacityThresholdCrossed('caution', 78, '15ft');
    expect(window.gtag).toHaveBeenCalledWith('event', 'capacity_threshold_crossed', {
      status: 'caution',
      fill_percentage: 78,
      truck_size: '15ft',
    });

    trackSizeUpClicked('10ft', '15ft', 88);
    expect(window.gtag).toHaveBeenCalledWith('event', 'size_up_clicked', {
      from_truck: '10ft',
      to_truck: '15ft',
      fill_percentage: 88,
    });

    trackQuoteStep2Reached('90210', '10001', '10ft');
    expect(window.gtag).toHaveBeenCalledWith('event', 'quote_step2_reached', {
      origin_zip: '90210',
      destination_zip: '10001',
      truck_size: '10ft',
    });

    trackQuoteFormSubmitted('TS-1234', '15ft', 550, '90210', '10001');
    expect(window.gtag).toHaveBeenCalledWith('event', 'quote_form_submitted', {
      lead_id: 'TS-1234',
      truck_size: '15ft',
      cu_ft: 550,
      origin_zip: '90210',
      destination_zip: '10001',
    });
  });

  it('does not throw when window is undefined (SSR environment)', () => {
    // @ts-expect-error simulating SSR
    delete global.window;

    expect(() => {
      trackRouteCalculated({
        originZip: '12345',
        destinationZip: '67890',
        roadMiles: 100,
        isLocal: true,
      });
    }).not.toThrow();
  });

  it('falls back to dataLayer push if window.gtag is not yet initialized', () => {
    const dataLayer: unknown[] = [];
    Object.defineProperty(global, 'window', {
      value: {
        dataLayer,
        gtag: undefined,
      },
      writable: true,
      configurable: true,
    });

    expect(() => {
      trackAffiliateClick({
        partnerName: 'TestPartner',
        placement: 'test_banner',
      });
    }).not.toThrow();

    expect(dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'affiliate_click',
        partner_name: 'TestPartner',
        placement: 'test_banner',
      })
    );
  });
});
