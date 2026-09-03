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
  subid?: string;
  clickId?: string;
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
      subid,
      clickId,
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
    
    // Generate unique click/lead UUID upon submission (Task 13)
    const leadUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const leadId = `TS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Read affiliate click IDs from cookies or body
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieSubId = cookieHeader.match(/subid=([^;]+)/)?.[1] || subid || null;
    const cookieClickId = cookieHeader.match(/click_id=([^;]+)/)?.[1] || clickId || null;

    // Server-Side Postback Handler (Task 13)
    const brokerEndpoint = process.env.LEAD_BROKER_API_ENDPOINT;
    const brokerApiKey = process.env.LEAD_BROKER_API_KEY;

    if (brokerEndpoint) {
      try {
        await fetch(brokerEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(brokerApiKey ? { Authorization: `Bearer ${brokerApiKey}` } : {}),
          },
          body: JSON.stringify({
            lead_uuid: leadUuid,
            subid: cookieSubId,
            click_id: cookieClickId,
            origin_zip: originZip,
            destination_zip: destinationZip,
            move_date: moveDate,
            email,
            cu_ft: cuFt,
            truck_size: truckSize,
            safety_buffer: safetyBuffer || 18,
          }),
        });
      } catch (postbackErr) {
        console.error('[AFFILIATE POSTBACK FAILED]', postbackErr);
      }
    }

    const responseData = {
      success: true,
      leadId,
      leadUuid,
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

    console.log('[LEAD INGESTED]', { leadId, leadUuid, email, truckSize, originZip, destinationZip });

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    console.error('[LEAD INGEST ERROR]', err);
    return NextResponse.json(
      { error: 'Internal lead processing error.' },
      { status: 500 }
    );
  }
}
