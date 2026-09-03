import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMiles,
  calculateRoadDistanceMiles,
  calculateRoutePricing,
  ROAD_ROUTING_FACTOR,
  DEFAULT_FALLBACK_MILES,
} from '@/lib/engine/pricingEngine';

describe('Pricing Engine: Haversine & Zippopotam.us Distance Math', () => {
  it('correctly calculates straight-line Haversine distance between NYC and LA', () => {
    // New York: 40.7128° N, 74.0060° W
    // Los Angeles: 34.0522° N, 118.2437° W
    const miles = calculateHaversineDistanceMiles(40.7128, -74.006, 34.0522, -118.2437);
    expect(miles).toBeGreaterThan(2440);
    expect(miles).toBeLessThan(2460);
  });

  it('returns 0 distance for identical coordinates', () => {
    const miles = calculateHaversineDistanceMiles(34.0901, -118.4065, 34.0901, -118.4065);
    expect(miles).toBe(0);
  });

  it('applies the 1.22 road routing factor on straight-line miles', async () => {
    // 90210 (Beverly Hills) to 10001 (New York)
    const result = await calculateRoadDistanceMiles('90210', '10001');
    expect(result.isFallback).toBe(false);
    expect(result.straightLineMiles).toBeGreaterThan(2400);
    // Road miles should be straightLine * 1.22
    const expectedRoad = Math.round(result.straightLineMiles * ROAD_ROUTING_FACTOR);
    expect(Math.abs(result.roadMiles - expectedRoad)).toBeLessThanOrEqual(5);
  });

  it('handles same origin and destination ZIP as a local move (~15 road miles)', async () => {
    const result = await calculateRoadDistanceMiles('90210', '90210');
    expect(result.roadMiles).toBe(15);
    expect(result.isFallback).toBe(false);
  });

  it('falls back gracefully to 250 miles for invalid or unresolvable ZIP codes', async () => {
    const result = await calculateRoadDistanceMiles('00000', '99999');
    expect(result.isFallback).toBe(true);
    expect(result.roadMiles).toBe(DEFAULT_FALLBACK_MILES);
  });
});

describe('Pricing Engine: Dynamic Local vs Long-Distance Tier Logic', () => {
  it('prices local moves (<= 50 miles) based on truck day rate and labor hours', async () => {
    // Same ZIP is 15 miles (local move)
    const pricing = await calculateRoutePricing('90210', '90210', '15ft');
    expect(pricing.isLocal).toBe(true);
    expect(pricing.roadMiles).toBe(15);
    // 15ft local base fee $69 + (2 movers * $55 * 4.5 hrs = $495) = $564 base total
    // Low should be around ~$460, High around ~$670
    expect(pricing.low).toBeGreaterThanOrEqual(400);
    expect(pricing.high).toBeLessThanOrEqual(750);
    expect(pricing.caption).toContain('15 road miles');
    expect(pricing.caption).toContain("15' Moving Truck");
  });

  it('prices long-distance moves (> 50 miles) using dispatch surcharge and per-mile rates', async () => {
    // Cross-country ~2,900 miles on 26ft truck
    const pricing = await calculateRoutePricing('90210', '10001', '26ft');
    expect(pricing.isLocal).toBe(false);
    expect(pricing.roadMiles).toBeGreaterThan(2500);
    // Base dispatch $680 + (2900+ miles * $1.95-$2.55) -> $6,000+
    expect(pricing.low).toBeGreaterThan(5000);
    expect(pricing.high).toBeGreaterThan(pricing.low);
    expect(pricing.formatted).toMatch(/^\$[\d,]+ – \$[\d,]+$/);
    expect(pricing.caption).toContain("26' Moving Truck");
  });

  it('scales cost predictably between truck size tiers for the same route', async () => {
    const price10ft = await calculateRoutePricing('90210', '10001', '10ft');
    const price15ft = await calculateRoutePricing('90210', '10001', '15ft');
    const price20ft = await calculateRoutePricing('90210', '10001', '20ft');
    const price26ft = await calculateRoutePricing('90210', '10001', '26ft');

    expect(price10ft.low).toBeLessThan(price15ft.low);
    expect(price15ft.low).toBeLessThan(price20ft.low);
    expect(price20ft.low).toBeLessThan(price26ft.low);
  });
});
