import { describe, it, expect, vi } from 'vitest';
import {
  getIndexNowKey,
  getIndexNowHost,
  getAllSiteUrls,
  submitToIndexNow,
  DEFAULT_INDEXNOW_KEY,
} from '@/lib/seo/indexnow';

describe('IndexNow Protocol Engine', () => {
  it('provides a valid 32-character hexadecimal key', () => {
    const key = getIndexNowKey();
    expect(key).toBeDefined();
    expect(key.length).toBeGreaterThanOrEqual(8);
    expect(key.length).toBeLessThanOrEqual(128);
    expect(key).toBe(DEFAULT_INDEXNOW_KEY);
  });

  it('correctly extracts the host from site url', () => {
    expect(getIndexNowHost('https://trucksizer.com')).toBe('trucksizer.com');
    expect(getIndexNowHost('https://sub.domain.org/path')).toBe('sub.domain.org');
  });

  it('gathers all programmatic and static URLs (including Clusters A, B, C, D)', () => {
    const urls = getAllSiteUrls('https://www.trucksizer.com');
    expect(urls.length).toBe(37);

    // Static pages
    expect(urls).toContain('https://www.trucksizer.com');
    expect(urls).toContain('https://www.trucksizer.com/how-we-calculate');
    expect(urls).toContain('https://www.trucksizer.com/privacy');
    expect(urls).toContain('https://www.trucksizer.com/terms');

    // Cluster A & B: Dimension and Brand Specs
    expect(urls).toContain('https://www.trucksizer.com/dimensions/box-truck');
    expect(urls).toContain('https://www.trucksizer.com/dimensions/15ft-truck');
    expect(urls).toContain('https://www.trucksizer.com/dimensions/15ft-uhaul-specs');

    // Cluster C: How-To-Pack
    expect(urls).toContain('https://www.trucksizer.com/how-to-pack/moving-truck');
    expect(urls).toContain('https://www.trucksizer.com/how-to-pack/furniture-loading');

    // Cluster D: Comparisons
    expect(urls).toContain('https://www.trucksizer.com/compare/10ft-vs-15ft');
    expect(urls).toContain('https://www.trucksizer.com/compare/15ft-truck-brands');

    // Dwelling routes
    expect(urls).toContain('https://www.trucksizer.com/truck-size/studio-apartment');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/1-bedroom-apartment');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/2-bedroom-apartment');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/2-bedroom-house');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/3-bedroom-house');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/3-bedroom-home');
    expect(urls).toContain('https://www.trucksizer.com/truck-size/4-bedroom-house');

    // Single item fit routes
    expect(urls).toContain('https://www.trucksizer.com/will-it-fit/king-mattress-in-10ft-truck');
    expect(urls).toContain('https://www.trucksizer.com/will-it-fit/sectional-sofa-in-15ft-truck');
  });

  it('rejects empty URL submission gracefully', async () => {
    const result = await submitToIndexNow([]);
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.submittedCount).toBe(0);
  });

  it('formats payload and parses successful 200/202 IndexNow response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(''),
    });

    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    try {
      const urls = ['https://trucksizer.com/truck-size/studio-apartment'];
      const result = await submitToIndexNow(urls, {
        key: 'testkey12345678',
        host: 'trucksizer.com',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.submittedCount).toBe(1);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe('https://api.indexnow.org/indexnow');
      const sentPayload = JSON.parse(callArgs[1].body);
      expect(sentPayload.host).toBe('trucksizer.com');
      expect(sentPayload.key).toBe('testkey12345678');
      expect(sentPayload.keyLocation).toBe('https://trucksizer.com/testkey12345678.txt');
      expect(sentPayload.urlList).toEqual(urls);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
