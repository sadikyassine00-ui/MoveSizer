import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { calculateRoadDistanceMiles } from '@/lib/engine/pricingEngine';
import { calculateMoveEstimate, TruckInputSize } from '@/lib/pricing/moveEstimator';
import { generateLoadManifest, CustomManifestItemInput } from '@/lib/manifest/generateManifest';
import { buildBlueprintEmailHtml } from '@/lib/email/blueprintTemplate';

export interface SendPlanPayload {
  originZip: string;
  destinationZip: string;
  moveDate: string;
  email: string;
  truckSize: TruckInputSize;
  cargoCuFt?: number;
  inventorySummary?: Record<string, number>;
  customItems?: CustomManifestItemInput[];
  subid?: string;
  clickId?: string;
}

const ZIP_REGEX = /^\d{5}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SendPlanPayload>;
    const {
      originZip,
      destinationZip,
      moveDate,
      email,
      truckSize = '15ft',
      cargoCuFt = 0,
      inventorySummary = {},
      customItems = [],
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
        { error: 'A valid email address is required to dispatch the moving blueprint.' },
        { status: 400 }
      );
    }

    // 1. Resolve road miles
    const distanceInfo = await calculateRoadDistanceMiles(originZip.trim(), destinationZip.trim());
    const roadMiles = distanceInfo.roadMiles;

    // 2. Compute pure deterministic pricing
    const estimate = calculateMoveEstimate({
      truckSize,
      cargoCuFt,
      distanceMiles: roadMiles,
      originZip: originZip.trim(),
      destZip: destinationZip.trim(),
    });

    // 3. Generate structured load manifest
    const manifest = generateLoadManifest({
      truckSize,
      inventory: inventorySummary,
      customItems,
      originZip: originZip.trim(),
      destinationZip: destinationZip.trim(),
      moveDate,
    });

    // 4. Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'TruckSizer <plans@trucksizer.com>';

    if (!resendApiKey) {
      console.error('Resend Dispatch Error: RESEND_API_KEY environment variable is not configured.');
      return NextResponse.json(
        { error: 'Email delivery service is not configured (missing RESEND_API_KEY).' },
        { status: 500 }
      );
    }

    let emailId: string | undefined;

    try {
      const resend = new Resend(resendApiKey);
      const emailHtml = buildBlueprintEmailHtml({
        estimate,
        manifest,
        moveDate,
      });

      const { data, error } = await resend.emails.send({
        from: resendFromEmail,
        to: [email.trim()],
        subject: `Official Load Manifest & Moving Rates [${manifest.logisticsRefId}]`,
        html: emailHtml,
      });

      if (error) {
        console.error('Resend Dispatch Error:', error);
        const statusCode =
          typeof error === 'object' && error && 'statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 500;
        return NextResponse.json(
          {
            error: error.message || 'Failed to dispatch email via Resend.',
            details: error,
          },
          { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
        );
      }

      emailId = data?.id;
    } catch (emailErr) {
      console.error('Resend Dispatch Error:', emailErr);
      return NextResponse.json(
        {
          error: emailErr instanceof Error ? emailErr.message : 'Exception during Resend email dispatch.',
        },
        { status: 500 }
      );
    }

    // 5. Optional affiliate broker postback
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
            lead_id: manifest.logisticsRefId,
            subid,
            click_id: clickId,
            origin_zip: originZip.trim(),
            destination_zip: destinationZip.trim(),
            move_date: moveDate,
            email: email.trim(),
            cu_ft: cargoCuFt,
            truck_size: truckSize,
            road_miles: roadMiles,
            diy_estimate: estimate.tiers.diy.formatted,
            hybrid_estimate: estimate.tiers.hybrid.formatted,
            full_service_estimate: estimate.tiers.fullService.formatted,
          }),
        });
      } catch (postbackErr) {
        console.error('[AFFILIATE BROKER POSTBACK ERROR]', postbackErr);
      }
    }

    console.log('[PLAN DISPATCHED]', {
      refId: manifest.logisticsRefId,
      email: email.trim(),
      emailDispatched: true,
      emailId,
      roadMiles,
    });

    return NextResponse.json(
      {
        success: true,
        leadId: manifest.logisticsRefId,
        refId: manifest.logisticsRefId,
        emailDispatched: true,
        emailId,
        roadMiles,
        estimate,
        manifest,
        shareableUrl: manifest.shareableBlueprintUrl,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[SEND PLAN ERROR]', err);
    return NextResponse.json(
      { error: 'Internal error preparing moving blueprint.' },
      { status: 500 }
    );
  }
}
