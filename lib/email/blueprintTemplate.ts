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
 * Incorporates the complete Load Manifest itemized checklist, box shopping supplies,
 * 4-phase loading protocol, and 3-way verified rate estimates.
 */
export function buildBlueprintEmailHtml({
  estimate,
  manifest,
  moveDate,
}: BlueprintEmailProps): string {
  const { originZip, destZip, distanceMiles, truckSize, tiers } = estimate;
  const { logisticsRefId, loadSpecs, boxSupplyList, loadingStrategy, allItems, shareableBlueprintUrl } = manifest;

  const itemRowsHtml = allItems && allItems.length > 0
    ? allItems.map((item) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #1e2433; color: #f1f5f9; font-weight: 600; font-size: 13px;">${item.name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #1e2433; color: #94a3b8; font-family: monospace; font-size: 11px;">${item.unitDimensions}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #1e2433; color: #38bdf8; font-size: 11px;">${item.zoneNote || item.loadingTierLabel}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #1e2433; color: #ffffff; text-align: center; font-family: monospace; font-weight: 700; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #1e2433; color: #cbd5e1; text-align: right; font-family: monospace; font-size: 12px;">${item.totalCuFt} cu ft</td>
      </tr>
    `).join('')
    : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #64748b; font-style: italic;">No large furniture items registered. Boxed cargo only.</td></tr>`;

  const tier1ItemsSummary = loadingStrategy.tier1Bulkhead.items.length > 0
    ? loadingStrategy.tier1Bulkhead.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
    : 'None placed in this tier';

  const tier2ItemsSummary = loadingStrategy.tier2MidDeck.items.length > 0
    ? loadingStrategy.tier2MidDeck.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
    : 'None placed in this tier';

  const tier3ItemsSummary = loadingStrategy.tier3RearOverhang.items.length > 0
    ? loadingStrategy.tier3RearOverhang.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
    : 'None placed in this tier';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Load Manifest & Moving Rates - ${logisticsRefId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0e12; color: #e2e8f0; margin: 0; padding: 24px 12px; }
    .container { max-width: 640px; margin: 0 auto; background-color: #14171f; border: 1px solid #232936; border-radius: 12px; overflow: hidden; }
    .header { padding: 24px; background: linear-gradient(180deg, #181d28 0%, #14171f 100%); border-bottom: 1px solid #232936; }
    .brand { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .brand span { color: #ff5500; }
    .ref-badge { float: right; font-family: monospace; font-size: 12px; background-color: #090a0f; border: 1px solid #273042; padding: 4px 8px; border-radius: 6px; color: #38bdf8; font-weight: 700; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
    .lead-p { font-size: 15px; color: #f1f5f9; line-height: 1.6; margin-top: 0; }
    .metrics-table { width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #090a0f; border-radius: 8px; overflow: hidden; border: 1px solid #1e2433; }
    .metrics-table td { padding: 10px 14px; border-bottom: 1px solid #191f2c; font-size: 13px; }
    .metrics-table td.label { color: #94a3b8; font-weight: 500; }
    .metrics-table td.value { color: #ffffff; font-weight: 700; text-align: right; font-family: monospace; }
    .section-heading { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #f8fafc; margin: 24px 0 10px; border-left: 3px solid #ff5500; padding-left: 8px; }
    .inventory-table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; background-color: #090a0f; border-radius: 8px; overflow: hidden; border: 1px solid #1e2433; }
    .inventory-table th { padding: 8px 10px; background-color: #161b26; border-bottom: 1px solid #232a3b; text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-family: monospace; }
    .box-grid { width: 100%; border-collapse: collapse; margin: 12px 0 18px; }
    .box-cell { width: 33.33%; padding: 6px; }
    .box-box { background-color: #090a0f; border: 1px solid #1e2433; border-radius: 6px; padding: 10px; }
    .box-label { font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
    .box-count { font-size: 16px; font-weight: 800; font-family: monospace; color: #ffffff; }
    .box-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .rate-card { border: 1px solid #232936; border-radius: 8px; padding: 14px; margin-bottom: 12px; background-color: #0e1117; }
    .rate-card.diy { border-left: 4px solid #10b981; }
    .rate-card.hybrid { border-left: 4px solid #0284c7; }
    .rate-card.full { border-left: 4px solid #a855f7; }
    .rate-title { font-size: 13px; font-weight: 800; color: #ffffff; }
    .rate-badge { float: right; font-size: 10px; font-family: monospace; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .rate-badge.diy { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .rate-badge.hybrid { background: rgba(2, 132, 199, 0.15); color: #38bdf8; }
    .rate-badge.full { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .rate-amount { font-size: 18px; font-weight: 900; font-family: monospace; color: #ffffff; margin: 4px 0; }
    .rate-desc { font-size: 12px; color: #94a3b8; margin: 0; }
    .rate-breakdown { font-size: 11px; color: #64748b; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #1e2433; }
    .phase-card { background-color: #090a0f; border: 1px solid #1d2330; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
    .phase-title { font-size: 12px; font-weight: 800; color: #f8fafc; }
    .phase-desc { font-size: 12px; color: #94a3b8; margin-top: 3px; line-height: 1.45; }
    .phase-items { font-size: 11px; color: #38bdf8; margin-top: 4px; font-family: monospace; }
    .btn-container { text-align: center; margin: 26px 0 12px; }
    .btn { display: inline-block; background-color: #ff5500; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 8px; letter-spacing: 0.2px; }
    .footer { padding: 20px 24px; background-color: #090a0f; border-top: 1px solid #191f2c; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="ref-badge">${logisticsRefId}</div>
      <div class="brand">TRUCK<span>SIZER</span> LOAD MANIFEST</div>
    </div>
    <div class="content">
      <p class="lead-p">
        Here is your loading blueprint and cost breakdown, including your official <strong>TruckSizer Load Manifest</strong> for <strong>${originZip} &rarr; ${destZip}</strong> (~${distanceMiles.toLocaleString()} road miles) on <strong>${moveDate}</strong>.
      </p>
      <p style="margin-top: 6px; color: #94a3b8; font-size: 13px;">
        Your cargo measures <strong>${loadSpecs.usedVolumeCuFt} cu ft</strong>, filling <strong>${loadSpecs.fillPercentage}%</strong> of an assigned <strong>${truckSize}' Moving Truck</strong> with an 18% real-world packing buffer included.
      </p>

      <!-- 1. The Route Specs at a Glance -->
      <div class="section-heading">1. Vehicle &amp; Volumetric Specs</div>
      <table class="metrics-table">
        <tr>
          <td class="label">Route &amp; Mileage</td>
          <td class="value">${originZip} &rarr; ${destZip} (~${distanceMiles.toLocaleString()} mi)</td>
        </tr>
        <tr>
          <td class="label">Assigned Vehicle</td>
          <td class="value">${manifest.truckName} (${loadSpecs.usableVolumeCuFt} cu ft usable)</td>
        </tr>
        <tr>
          <td class="label">Cargo Volume</td>
          <td class="value">${loadSpecs.usedVolumeCuFt} cu ft (${loadSpecs.fillPercentage}% full)</td>
        </tr>
        <tr>
          <td class="label">Estimated Cargo Weight</td>
          <td class="value">~${loadSpecs.estimatedCargoWeightLbs.toLocaleString()} lbs (Margin: +${loadSpecs.payloadSafetyMarginLbs.toLocaleString()} lbs)</td>
        </tr>
        <tr>
          <td class="label">Cabover Shelf (Mom's Attic)</td>
          <td class="value">${loadSpecs.hasMomsAttic ? (loadSpecs.atticDimensions || 'Present (500 lbs max rating)') : 'None (Flat Bulkhead)'}</td>
        </tr>
      </table>

      <!-- 2. Itemized Cargo & Furniture Checklist Table -->
      <div class="section-heading">2. Itemized Cargo &amp; Furniture Checklist (${allItems ? allItems.length : 0} Items)</div>
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Dimensions</th>
            <th>Loading Zone</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Cu Ft</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <!-- 3. Recommended Box & Supply Shopping Checklist -->
      <div class="section-heading">3. Box &amp; Packing Supply Shopping List (${boxSupplyList.totalBoxes} Boxes Total)</div>
      <table class="box-grid">
        <tr>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Small Box (1.5 cu ft)</div>
              <div class="box-count">${boxSupplyList.smallBoxes} Units</div>
              <div class="box-sub">Books, tools, pantry</div>
            </div>
          </td>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Medium Box (3.0 cu ft)</div>
              <div class="box-count">${boxSupplyList.mediumBoxes} Units</div>
              <div class="box-sub">Cookware, decor, toys</div>
            </div>
          </td>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Large Box (4.5 cu ft)</div>
              <div class="box-count">${boxSupplyList.largeBoxes} Units</div>
              <div class="box-sub">Linens, pillows, lamps</div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Wardrobe Box (16 cu ft)</div>
              <div class="box-count">${boxSupplyList.wardrobeBoxes} Units</div>
              <div class="box-sub">Hanging clothes & coats</div>
            </div>
          </td>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Heavy-Duty Tape</div>
              <div class="box-count" style="color: #ff5500;">${boxSupplyList.recommendedTapeRolls} Rolls</div>
              <div class="box-sub">55-yd commercial grade</div>
            </div>
          </td>
          <td class="box-cell">
            <div class="box-box">
              <div class="box-label">Total Box Volume</div>
              <div class="box-count">${Math.round((boxSupplyList.smallBoxes * 1.5 + boxSupplyList.mediumBoxes * 3.0 + boxSupplyList.largeBoxes * 4.5 + boxSupplyList.wardrobeBoxes * 16) * 10) / 10} cu ft</div>
              <div class="box-sub">Standard corrugated</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- 4. 4-Phase Commercial Stacking Protocol -->
      <div class="section-heading">4. 4-Phase Loading Protocol</div>
      <div class="phase-card">
        <div class="phase-title">Phase 1 — Bulkhead (Front Cab Wall) &amp; Heavy Deck Foundation</div>
        <div class="phase-desc">Stand heavy dressers, washers, and solid wood flat against the bulkhead. Keeps steer axle planted for safe highway braking.</div>
        <div class="phase-items">Assigned items: ${tier1ItemsSummary}</div>
      </div>
      <div class="phase-card">
        <div class="phase-title">Phase 2 — Mid-Deck Dense Box Columns (Deck to Roof)</div>
        <div class="phase-desc">Build tight vertical box tiers floor-to-ceiling. Heavy cartons on deck, lighter boxes on top. Stand tabletops on edge along side rub-rails.</div>
        <div class="phase-items">Assigned items: ${tier2ItemsSummary}</div>
      </div>
      <div class="phase-card">
        <div class="phase-title">Phase 3 — Rear &amp; Cabover (Mom's Attic)</div>
        <div class="phase-desc">Stand mattresses vertically along driver-side rail. Route wardrobe boxes and fragile cartons into Mom's Attic (keep under 500 lbs).</div>
        <div class="phase-items">Assigned items: ${tier3ItemsSummary}</div>
      </div>

      <!-- 5. 3-Way Moving Cost Breakdown -->
      <div class="section-heading">5. 3-Way Moving Rate Breakdown</div>

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

      <!-- 6. Direct Return Link -->
      <div class="btn-container">
        <a href="${shareableBlueprintUrl}" class="btn">
          View 2.5D Visualizer on Mobile &rarr;
        </a>
      </div>
      <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 8px;">
        Clicking opens your exact 3D furniture placement and inventory list on your smartphone on moving day.
      </p>
    </div>
    <div class="footer">
      Official TruckSizer Load Manifest &bull; Reference ${logisticsRefId}<br>
      Notice: Estimates reflect standard US rental fleet specs (U-Haul, Budget, Penske) and national average tariff schedules.<br>
      Tip: Press Ctrl+P (or Cmd+P) to print or save this email as a PDF document.
    </div>
  </div>
</body>
</html>`;
}
