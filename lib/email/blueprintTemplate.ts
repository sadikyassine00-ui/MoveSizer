import { MoveEstimateResult } from '@/lib/pricing/moveEstimator';
import { LoadManifestDataObject } from '@/lib/manifest/generateManifest';

export interface BlueprintEmailProps {
  estimate: MoveEstimateResult;
  manifest: LoadManifestDataObject;
  moveDate: string;
}

/**
 * Builds clean, responsive HTML for the logistics supervisor blueprint email.
 * Styled with high-contrast, modern dark/light email client-safe tables and styles.
 */
export function buildBlueprintEmailHtml({
  estimate,
  manifest,
  moveDate,
}: BlueprintEmailProps): string {
  const { originZip, destZip, distanceMiles, truckSize, tiers } = estimate;
  const { logisticsRefId, loadSpecs, shareableBlueprintUrl } = manifest;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Blueprint & Moving Rates - ${logisticsRefId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0e12; color: #e2e8f0; margin: 0; padding: 24px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #14171f; border: 1px solid #232936; border-radius: 12px; overflow: hidden; }
    .header { padding: 24px; background: linear-gradient(180deg, #181d28 0%, #14171f 100%); border-bottom: 1px solid #232936; }
    .brand { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #ff5500; }
    .ref-badge { float: right; font-family: monospace; font-size: 12px; background-color: #090a0f; border: 1px solid #273042; padding: 4px 8px; border-radius: 6px; color: #38bdf8; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .lead-p { font-size: 15px; color: #f1f5f9; line-height: 1.6; margin-top: 0; }
    .metrics-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #090a0f; border-radius: 8px; overflow: hidden; border: 1px solid #1e2433; }
    .metrics-table td { padding: 12px 16px; border-bottom: 1px solid #191f2c; font-size: 13px; }
    .metrics-table td.label { color: #94a3b8; font-weight: 500; }
    .metrics-table td.value { color: #ffffff; font-weight: 700; text-align: right; font-family: monospace; }
    .section-heading { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #f8fafc; margin: 24px 0 12px; border-left: 3px solid #ff5500; padding-left: 8px; }
    .rate-card { border: 1px solid #232936; border-radius: 8px; padding: 16px; margin-bottom: 14px; background-color: #0e1117; }
    .rate-card.diy { border-left: 4px solid #10b981; }
    .rate-card.hybrid { border-left: 4px solid #0284c7; }
    .rate-card.full { border-left: 4px solid #a855f7; }
    .rate-title { font-size: 14px; font-weight: 800; color: #ffffff; display: flex; justify-content: space-between; }
    .rate-badge { font-size: 10px; font-family: monospace; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .rate-badge.diy { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .rate-badge.hybrid { background: rgba(2, 132, 199, 0.15); color: #38bdf8; }
    .rate-badge.full { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .rate-amount { font-size: 18px; font-weight: 900; font-family: monospace; color: #ffffff; margin: 6px 0; }
    .rate-desc { font-size: 12px; color: #94a3b8; margin: 0; }
    .rate-breakdown { font-size: 11px; color: #64748b; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #1e2433; }
    .rule-box { background-color: #0a0d12; border: 1px solid #1d2330; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .rule-item { margin-bottom: 10px; font-size: 13px; line-height: 1.5; }
    .rule-item strong { color: #f1f5f9; }
    .btn-container { text-align: center; margin: 28px 0 12px; }
    .btn { display: inline-block; background-color: #ff5500; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 8px; letter-spacing: 0.2px; }
    .footer { padding: 20px 24px; background-color: #090a0f; border-top: 1px solid #191f2c; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="ref-badge">${logisticsRefId}</div>
      <div class="brand">TRUCK<span>SIZER</span></div>
    </div>
    <div class="content">
      <p class="lead-p">
        Here is your loading blueprint and cost breakdown for the move from <strong>${originZip}</strong> to <strong>${destZip}</strong> (~${distanceMiles.toLocaleString()} road miles).
      </p>
      <p style="margin-top: 8px; color: #94a3b8;">
        Target date: <strong>${moveDate}</strong>. Your placed inventory occupies <strong>${loadSpecs.usedVolumeCuFt} cu ft</strong>, filling roughly <strong>${loadSpecs.fillPercentage}%</strong> of a <strong>${truckSize}' truck</strong>. Below is the unvarnished breakdown of what this route actually costs across self-drive, hybrid, and commercial carrier tiers.
      </p>

      <!-- The Numbers at a Glance -->
      <div class="section-heading">The Route Specs at a Glance</div>
      <table class="metrics-table">
        <tr>
          <td class="label">Route &amp; Mileage</td>
          <td class="value">${originZip} &rarr; ${destZip} (~${distanceMiles.toLocaleString()} mi)</td>
        </tr>
        <tr>
          <td class="label">Recommended Fleet Unit</td>
          <td class="value">${truckSize}ft Box Truck (${loadSpecs.usableVolumeCuFt} cu ft usable)</td>
        </tr>
        <tr>
          <td class="label">Cargo Volume &amp; Capacity</td>
          <td class="value">${loadSpecs.usedVolumeCuFt} cu ft (${loadSpecs.fillPercentage}% full)</td>
        </tr>
        <tr>
          <td class="label">Estimated Cargo Weight</td>
          <td class="value">~${loadSpecs.estimatedCargoWeightLbs.toLocaleString()} lbs (Payload margin: +${loadSpecs.payloadSafetyMarginLbs.toLocaleString()} lbs)</td>
        </tr>
        <tr>
          <td class="label">Cabover Shelf (Mom's Attic)</td>
          <td class="value">${loadSpecs.hasMomsAttic ? 'Present (500 lbs max rating)' : 'None (Flat Bulkhead)'}</td>
        </tr>
      </table>

      <!-- 3-Way Cost Comparison -->
      <div class="section-heading">3-Way Moving Cost Breakdown</div>

      <!-- Tier 1: DIY -->
      <div class="rate-card diy">
        <div class="rate-title">
          <span>Tier 1: Self-Drive Truck Rental</span>
          <span class="rate-badge diy">${tiers.diy.tag}</span>
        </div>
        <div class="rate-amount">${tiers.diy.formatted}</div>
        <p class="rate-desc">${tiers.diy.subtitle}</p>
        <div class="rate-breakdown">
          Truck equipment: $${tiers.diy.breakdown.equipmentCost} &bull; Fuel (~${Math.round(distanceMiles / (Number(tiers.diy.breakdown.highwayMpg) || 9))} gals @ $${tiers.diy.breakdown.gasPricePerGal}/gal): $${tiers.diy.breakdown.estimatedFuel} &bull; Tolls: $${tiers.diy.breakdown.estimatedTolls}
        </div>
      </div>

      <!-- Tier 2: Hybrid -->
      <div class="rate-card hybrid">
        <div class="rate-title">
          <span>Tier 2: Hybrid (Truck + Loading Crew)</span>
          <span class="rate-badge hybrid">${tiers.hybrid.tag}</span>
        </div>
        <div class="rate-amount">${tiers.hybrid.formatted}</div>
        <p class="rate-desc">${tiers.hybrid.subtitle}</p>
        <div class="rate-breakdown">
          Truck baseline: $${tiers.hybrid.breakdown.truckCostLow}–$${tiers.hybrid.breakdown.truckCostHigh} + Pro crew: $${tiers.hybrid.breakdown.laborCost} (${tiers.hybrid.breakdown.loadMovers} helpers load + unload)
        </div>
      </div>

      <!-- Tier 3: Full-Service -->
      <div class="rate-card full">
        <div class="rate-title">
          <span>Tier 3: Turnkey Full-Service Van Lines</span>
          <span class="rate-badge full">${tiers.fullService.tag}</span>
        </div>
        <div class="rate-amount">${tiers.fullService.formatted}</div>
        <p class="rate-desc">${tiers.fullService.subtitle}</p>
        <div class="rate-breakdown">
          Commercial tariff on ${tiers.fullService.breakdown.billableWeightLbs?.toLocaleString()} lbs billable weight &bull; 16% carrier fuel surcharge included ${tiers.fullService.breakdown.metroFee ? '&bull; $450 metro shuttle fee' : ''}
        </div>
      </div>

      <!-- Moving Day Loading Order -->
      <div class="section-heading">Moving Day Loading Sequence</div>
      <div class="rule-box">
        <div class="rule-item">
          <strong>1. Bulkhead (Front Cab Wall):</strong> Stand heavy dressers, washers, and solid oak flat against the bulkhead. Keeps front steer axle planted so the truck tracks true in crosswinds.
        </div>
        <div class="rule-item">
          <strong>2. Mid-Deck:</strong> Build tight vertical tiers of corrugated boxes from deck to roof bows. Interlock box corners like bricks. Stand table tops on edge along side rub-rails.
        </div>
        <div class="rule-item">
          <strong>3. Rear &amp; Cabover:</strong> Stand mattresses vertically along the side rails. Route wardrobe boxes and fragile cartons into Mom's Attic cabover (keep under 500 lbs to avoid high center of gravity).
        </div>
      </div>

      <!-- Direct Return Link -->
      <div class="btn-container">
        <a href="${shareableBlueprintUrl}" class="btn">
          View 2.5D Visualizer on Mobile &rarr;
        </a>
      </div>
      <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 8px;">
        Clicking above restores your exact 3D furniture placement and inventory list on your phone on moving day.
      </p>
    </div>
    <div class="footer">
      TruckSizer Logistics Blueprint &bull; Reference ${logisticsRefId}<br>
      Notice: Estimates reflect standard US rental fleet specs and national average tariff schedules.
    </div>
  </div>
</body>
</html>`;
}
