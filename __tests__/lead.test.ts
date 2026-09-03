import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/lead/route';

describe('Task 8 & 12: Lead API Route Validation', () => {
  it('rejects missing origin ZIP with 400', async () => {
    const req = new Request('http://localhost:3000/api/lead', {
      method: 'POST',
      body: JSON.stringify({
        originZip: '',
        destinationZip: '90210',
        moveDate: '2026-12-01',
        email: 'test@example.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/valid 5-digit US postal code/i);
  });

  it('rejects invalid email address with 400', async () => {
    const req = new Request('http://localhost:3000/api/lead', {
      method: 'POST',
      body: JSON.stringify({
        originZip: '10001',
        destinationZip: '90210',
        moveDate: '2026-12-01',
        email: 'invalid-email',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/valid email/i);
  });

  it('accepts valid payload and returns 200 with leadId and priceRange', async () => {
    const req = new Request('http://localhost:3000/api/lead', {
      method: 'POST',
      body: JSON.stringify({
        originZip: '10001',
        destinationZip: '90210',
        moveDate: '2026-12-01',
        email: 'mover@example.com',
        cuFt: 500,
        truckSize: '15ft',
        safetyBuffer: 18,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.leadId).toMatch(/^TS-/);
    expect(data.priceRange.low).toBe(390);
    expect(data.priceRange.high).toBe(650);
  });
});
