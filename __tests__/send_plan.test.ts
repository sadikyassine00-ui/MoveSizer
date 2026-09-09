import { describe, it, expect } from 'vitest';
import { generateLoadManifest } from '@/lib/manifest/generateManifest';
import { buildBlueprintEmailHtml } from '@/lib/email/blueprintTemplate';
import { calculateMoveEstimate } from '@/lib/pricing/moveEstimator';
import { POST } from '@/app/api/send-plan/route';

describe('Manifest Generation & Resend Email Pipeline', () => {
  describe('Load Manifest Generator (lib/manifest/generateManifest.ts)', () => {
    it('generates a valid Logistics Reference ID matching TS-[SIZE]-[RANDOM6]', () => {
      const manifest10 = generateLoadManifest({
        truckSize: '10ft',
        inventory: { queen_bed: 1, sofa_3seat: 1, box_medium: 15 },
      });
      expect(manifest10.logisticsRefId).toMatch(/^TS-10FT-[2-9A-Z]{6}$/);

      const manifest15 = generateLoadManifest({
        truckSize: '15ft',
        inventory: { queen_bed: 1, sofa_3seat: 1, box_medium: 25 },
      });
      expect(manifest15.logisticsRefId).toMatch(/^TS-15FT-[2-9A-Z]{6}$/);
    });

    it('categorizes inventory into 3 Physical Loading Strategy Tiers', () => {
      const manifest = generateLoadManifest({
        truckSize: '15ft',
        inventory: {
          queen_bed: 1,
          sofa_3seat: 1,
          dresser_6drawer: 1,
          dining_table: 1,
          box_medium: 20,
          box_wardrobe: 3,
        },
      });

      // Tier 1 (Bulkhead): Sofa and Dresser
      const tier1Names = manifest.loadingStrategy.tier1Bulkhead.items.map((i) => i.id);
      expect(tier1Names).toContain('sofa_3seat');
      expect(tier1Names).toContain('dresser_6drawer');

      // Tier 2 (Mid-Deck): Medium boxes and Dining table
      const tier2Names = manifest.loadingStrategy.tier2MidDeck.items.map((i) => i.id);
      expect(tier2Names).toContain('box_medium');
      expect(tier2Names).toContain('dining_table');

      // Tier 3 (Rear & Overhang): Queen Bed (wall rail) and Wardrobe boxes (attic/rear)
      const tier3Names = manifest.loadingStrategy.tier3RearOverhang.items.map((i) => i.id);
      expect(tier3Names).toContain('queen_bed');
      expect(tier3Names).toContain('box_wardrobe');

      expect(manifest.loadSpecs.fillPercentage).toBeGreaterThan(0);
      expect(manifest.loadSpecs.payloadSafetyMarginLbs).toBeGreaterThan(0);
      expect(manifest.shareableBlueprintUrl).toContain('https://');
      expect(manifest.shareableBlueprintUrl).toContain('ref=');
      expect(manifest.shareableBlueprintUrl).toContain('truck=15ft');
    });
  });

  describe('Logistics Supervisor Email Template (lib/email/blueprintTemplate.ts)', () => {
    it('renders clean, frank logistics coordinator HTML without AI marketing buzzwords', () => {
      const estimate = calculateMoveEstimate({
        truckSize: '15ft',
        cargoCuFt: 450,
        distanceMiles: 850,
        originZip: '30301',
        destZip: '10001',
      });

      const manifest = generateLoadManifest({
        truckSize: '15ft',
        inventory: { queen_bed: 1, sofa_3seat: 1, box_medium: 20 },
        originZip: '30301',
        destinationZip: '10001',
        moveDate: '2026-11-15',
      });

      const html = buildBlueprintEmailHtml({
        estimate,
        manifest,
        moveDate: '2026-11-15',
      });

      // Assert direct non-robot tone
      expect(html).toContain('Here is your loading blueprint and cost breakdown');
      expect(html).not.toContain('Congratulations on your upcoming relocation');
      expect(html).not.toContain('We are thrilled');

      // Assert Reference ID and route specs
      expect(html).toContain(manifest.logisticsRefId);
      expect(html).toContain('30301');
      expect(html).toContain('10001');
      expect(html).toContain('~850 mi');

      // Assert 3-way cost cards
      expect(html).toContain('Tier 1: Self-Drive Truck Rental');
      expect(html).toContain('Tier 2: Hybrid (Truck + Loading Crew)');
      expect(html).toContain('Tier 3: Turnkey Full-Service Van Lines');
      expect(html).toContain(estimate.tiers.diy.formatted);
      expect(html).toContain(estimate.tiers.hybrid.formatted);
      expect(html).toContain(estimate.tiers.fullService.formatted);

      // Assert loading rules
      expect(html).toContain('Bulkhead (Front Cab Wall)');
      expect(html).toContain('Mid-Deck');
      expect(html).toContain('Rear &amp; Cabover');

      // Assert direct return visualizer link
      expect(html).toContain(manifest.shareableBlueprintUrl);
      expect(html).toContain('View 2.5D Visualizer on Mobile');
    });
  });

  describe('/api/send-plan POST Endpoint', () => {
    it('rejects missing or invalid origin ZIP with 400', async () => {
      const req = new Request('http://localhost:3000/api/send-plan', {
        method: 'POST',
        body: JSON.stringify({
          originZip: 'abc',
          destinationZip: '10001',
          moveDate: '2026-12-01',
          email: 'mover@example.com',
          truckSize: '15ft',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/valid 5-digit US postal code/i);
    });

    it('rejects invalid email address with 400', async () => {
      const req = new Request('http://localhost:3000/api/send-plan', {
        method: 'POST',
        body: JSON.stringify({
          originZip: '90210',
          destinationZip: '10001',
          moveDate: '2026-12-01',
          email: 'not-an-email',
          truckSize: '15ft',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/valid email/i);
    });

    it('accepts valid payload and returns 200 with manifest and pricing estimate', async () => {
      const req = new Request('http://localhost:3000/api/send-plan', {
        method: 'POST',
        body: JSON.stringify({
          originZip: '90210',
          destinationZip: '10001',
          moveDate: '2026-12-15',
          email: 'delivered@resend.dev',
          truckSize: '15ft',
          cargoCuFt: 450,
          inventorySummary: { queen_bed: 1, sofa_3seat: 1, box_medium: 20 },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.refId).toMatch(/^TS-15FT-/);
      expect(data.estimate).toBeDefined();
      expect(data.estimate.tiers.diy.formatted).toBeDefined();
      expect(data.estimate.tiers.hybrid.formatted).toBeDefined();
      expect(data.estimate.tiers.fullService.formatted).toBeDefined();
      expect(data.manifest).toBeDefined();
      expect(data.manifest.logisticsRefId).toBe(data.refId);
      expect(data.shareableUrl).toContain('ref=');
      expect(data.shareableUrl).toContain('truck=15ft');
    }, 15000);
  });
});
