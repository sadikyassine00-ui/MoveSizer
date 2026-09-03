import { NextResponse } from 'next/server';

export interface LeadPayload {
  originZip: string;
  destinationZip: string;
  moveDate: string;
  email: string;
  cuFt: number;
  truckSize: string;
  safetyBuffer: number;
  inventorySummary?: Record<string, number>;
}

const ZIP_REGEX = /^\d{5}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LeadPayload>;

    const {
      originZip,
      destinationZip,
      moveDate,
      email,
      cuFt,
      truckSize,
      safetyBuffer,
      inventorySummary,
    } = body;

    // Strict validation
    if (!originZip || !ZIP_REGEX.test(originZip.trim())) {
      return NextResponse.json(
        { error: 'Origin ZIP code must be a valid 5-digit US postal code.' },
        { status: 400 }
      );
    }

    if (!destinationZip || !ZIP_REGEX.test(destinationZip.trim())) {
      return NextResponse.json(
        { error: 'Destination ZIP code must be a valid 5-digit US postal code.' },
        { status: 400 }
      );
    }

    if (!moveDate) {
      return NextResponse.json(
        { error: 'Move date is required.' },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (moveDate < todayStr) {
      return NextResponse.json(
        { error: 'Move date cannot be in the past.' },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address is required for quote dispatch.' },
        { status: 400 }
      );
    }

    // Generate price estimate based on truck size and volume
    const baseRates: Record<string, { low: number; high: number }> = {
      '10ft': { low: 290, high: 490 },
      '15ft': { low: 390, high: 650 },
      '20ft': { low: 490, high: 790 },
      '26ft': { low: 650, high: 990 },
    };

    const truckTier = baseRates[truckSize || '15ft'] || baseRates['15ft'];
    const leadId = `TS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const responseData = {
      success: true,
      leadId,
      truckSize: truckSize || '15ft',
      cuFt: cuFt || 0,
      priceRange: {
        low: truckTier.low,
        high: truckTier.high,
        formatted: `$${truckTier.low} – $${truckTier.high}`,
      },
      originZip,
      destinationZip,
      moveDate,
      timestamp: new Date().toISOString(),
    };

    console.log('[LEAD INGESTED]', { leadId, email, truckSize, originZip, destinationZip });

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    console.error('[LEAD INGEST ERROR]', err);
    return NextResponse.json(
      { error: 'Internal lead processing error.' },
      { status: 500 }
    );
  }
}
