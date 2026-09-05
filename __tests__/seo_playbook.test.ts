import { describe, it, expect } from 'vitest';
import {
  getAllDimensionSlugs,
  getDimensionSpec,
  getCanonicalDimensionSlugs,
} from '@/lib/seo/dimensions';
import {
  getAllHowToPackSlugs,
  getHowToPackGuide,
} from '@/lib/seo/howToPack';
import {
  getAllComparisonSlugs,
  getComparisonSpec,
  getCanonicalComparisonSlugs,
} from '@/lib/seo/comparisons';
import sitemap from '@/app/sitemap';

describe('SEO Playbook v4.0 - Data Manifest & Programmatic Engine', () => {
  describe('Cluster A & B: Dimensions & Fleet Specs', () => {
    it('provides all canonical slugs for Cluster A and Cluster B', () => {
      const canonicals = getCanonicalDimensionSlugs();
      const expectedCanonicals = [
        'box-truck',
        '10ft-truck',
        '12ft-truck',
        '15ft-truck',
        '16ft-truck',
        '20ft-truck',
        '26ft-truck',
        '10ft-uhaul-specs',
        '15ft-uhaul-specs',
        '20ft-uhaul-specs',
        '26ft-uhaul-specs',
      ];
      for (const slug of expectedCanonicals) {
        expect(canonicals).toContain(slug);
        const spec = getDimensionSpec(slug);
        expect(spec).not.toBeNull();
        expect(spec?.title).toBeDefined();
        expect(spec?.dimensions.grossVolumeCuFt).toBeGreaterThan(0);
        expect(spec?.dimensions.usableVolumeCuFt).toBeGreaterThan(0);
        expect(spec?.dimensions.lengthInches).toBeGreaterThan(0);
        expect(spec?.dimensions.widthInches).toBeGreaterThan(0);
        expect(spec?.dimensions.heightInches).toBeGreaterThan(0);
        expect(spec?.brandComparisons.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('correctly flags brand flanking pages and includes trademark requirements', () => {
      const uhaul15 = getDimensionSpec('15ft-uhaul-specs');
      expect(uhaul15?.isBrandFlanking).toBe(true);
      expect(uhaul15?.brand).toBe('u-haul');
      expect(uhaul15?.visualHook).toContain("Mom's Attic");

      const generic15 = getDimensionSpec('15ft-truck');
      expect(generic15?.isBrandFlanking).toBe(false);
    });

    it('resolves shorthand slug aliases without 404s', () => {
      const alias1 = getDimensionSpec('10f-truck');
      expect(alias1).not.toBeNull();
      expect(alias1?.canonicalSlug).toBe('10ft-truck');
      expect(alias1?.isAlias).toBe(true);

      const alias2 = getDimensionSpec('15f-uhaul-specs');
      expect(alias2).not.toBeNull();
      expect(alias2?.canonicalSlug).toBe('15ft-uhaul-specs');
    });

    it('exports all static params for Next.js SSG prerendering', () => {
      const slugs = getAllDimensionSlugs();
      expect(slugs.length).toBeGreaterThanOrEqual(15);
      expect(slugs).toContain('box-truck');
      expect(slugs).toContain('10f-truck');
      expect(slugs).toContain('10ft-truck');
    });
  });

  describe('Cluster C: How-To-Pack & Loading Guides', () => {
    it('covers all required how-to-pack slugs', () => {
      const slugs = getAllHowToPackSlugs();
      expect(slugs).toContain('moving-truck');
      expect(slugs).toContain('furniture-loading');

      for (const slug of slugs) {
        const guide = getHowToPackGuide(slug);
        expect(guide).not.toBeNull();
        expect(guide?.phases.length).toBe(4);
        expect(guide?.weightDistributionRule).toBeDefined();
        expect(guide?.equipmentChecklist.length).toBeGreaterThan(2);
        expect(guide?.faqList.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('specifies the 4 sequential loading phases for moving-truck', () => {
      const guide = getHowToPackGuide('moving-truck');
      expect(guide).not.toBeNull();
      const phases = guide!.phases;
      expect(phases[0].zone).toBe('bulkhead');
      expect(phases[1].zone).toBe('wall_left');
      expect(phases[2].zone).toBe('floor');
      expect(phases[3].zone).toBe('attic');
    });
  });

  describe('Cluster D: Decision-Stage Comparisons', () => {
    it('covers all required comparison slugs and aliases', () => {
      const canonicals = getCanonicalComparisonSlugs();
      expect(canonicals).toContain('10ft-vs-15ft');
      expect(canonicals).toContain('15ft-vs-20ft');
      expect(canonicals).toContain('15ft-truck-brands');

      // Aliases
      const alias1 = getComparisonSpec('10f-vs-15f');
      expect(alias1?.canonicalSlug).toBe('10ft-vs-15ft');

      const alias2 = getComparisonSpec('15f-truck-brands');
      expect(alias2?.canonicalSlug).toBe('15ft-truck-brands');
    });

    it('contains comprehensive side-by-side matrices', () => {
      const spec = getComparisonSpec('10ft-vs-15ft');
      expect(spec).not.toBeNull();
      expect(spec?.vehicleA.truckId).toBe('10ft');
      expect(spec?.vehicleB.truckId).toBe('15ft');
      expect(spec?.keyDifferences.length).toBeGreaterThanOrEqual(4);
      expect(spec?.decisionMatrix.chooseAWhen.length).toBeGreaterThan(1);
      expect(spec?.decisionMatrix.chooseBWhen.length).toBeGreaterThan(1);
      expect(spec?.bottomLineVerdict).toBeDefined();
    });
  });

  describe('Sitemap Integration', () => {
    it('includes all canonical SEO playbook URLs with proper priorities', () => {
      const siteUrls = sitemap();
      const urls = siteUrls.map((entry) => entry.url);

      // Check Cluster A & B
      expect(urls).toContain('https://www.trucksizer.com/dimensions/box-truck');
      expect(urls).toContain('https://www.trucksizer.com/dimensions/15ft-truck');
      expect(urls).toContain('https://www.trucksizer.com/dimensions/15ft-uhaul-specs');

      // Check Cluster C
      expect(urls).toContain('https://www.trucksizer.com/how-to-pack/moving-truck');
      expect(urls).toContain('https://www.trucksizer.com/how-to-pack/furniture-loading');

      // Check Cluster D
      expect(urls).toContain('https://www.trucksizer.com/compare/10ft-vs-15ft');
      expect(urls).toContain('https://www.trucksizer.com/compare/15ft-truck-brands');

      // Verify high priority for programmatic pillar routes
      const boxTruckEntry = siteUrls.find((e) => e.url.endsWith('/dimensions/box-truck'));
      expect(boxTruckEntry?.priority).toBe(0.85);
      expect(boxTruckEntry?.changeFrequency).toBe('weekly');
    });
  });

  describe('VehicleSpecMatrix: Real-World Fit Table Architecture', () => {
    it('generates 3 consolidated columns and eliminates redundant units column', async () => {
      const React = await import('react');
      const { renderToStaticMarkup } = await import('react-dom/server');
      const { default: VehicleSpecMatrix } = await import('@/components/seo/VehicleSpecMatrix');

      const spec = getDimensionSpec('15ft-truck');
      expect(spec).not.toBeNull();

      const html = renderToStaticMarkup(
        React.createElement(VehicleSpecMatrix, { spec: spec! })
      );

      // Must use semantic HTML table tags for Position Zero snippets
      expect(html).toContain('<table');
      expect(html).toContain('<thead');
      expect(html).toContain('<tbody');
      expect(html).toContain('<tr');
      expect(html).toContain('<th');
      expect(html).toContain('<td');

      // Check the 3 consolidated columns
      expect(html).toContain('Dimension &amp; Choke Point');
      expect(html).toContain('Clear Clearance');
      expect(html).toContain('What Actually Fits');

      // Assert redundant old 4th column is GONE
      expect(html).not.toContain('Inches / Unit');
      expect(html).not.toContain('Specification Metric');

      // Humanized terms (not cold clinical terms)
      expect(html).toContain('Door Opening (Choke Point)');
      expect(html).toContain('Interior Height (Ceiling)');
      expect(html).toContain('Deck Height (Step-In)');

      // Critical choke point row accent
      expect(html).toContain('border-l-4 border-l-amber-500');

      // Visual highlight badges
      expect(html).toContain('Full-Size Sofa Safe');
      expect(html).toContain('Vertical Mattress Fit');
      expect(html).toContain('Standard Fridge &amp; Armoires');
      expect(html).toContain('18% Void Buffer Included');
    });
  });
});
