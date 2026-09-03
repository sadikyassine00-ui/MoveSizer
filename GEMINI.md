# AI AGENT SPECIFICATION: TRUCKSIZER BUILD

You are an expert full-stack engineer building **TruckSizer**, a high-performance web utility built with Next.js (App Router), TypeScript, Tailwind CSS, and HTML5 Canvas. The application visualizes moving truck cargo volume in a 2.5D isometric cutaway and captures high-intent moving leads.

Execute the following tasks sequentially without skipping any steps or requirements.

---

## TASK 1: PROJECT SETUP AND DEPENDENCIES

1. Initialize a clean Next.js project using App Router and TypeScript:
   - Framework: Next.js (App Router, Server-Side Rendering enabled by default)
   - Styling: Tailwind CSS
   - Icons: `lucide-react`
   - Utilities: `clsx`, `tailwind-merge`
2. Configure fonts in `app/layout.tsx`:
   - Primary interface font: `Geist Sans` or `Inter`
   - Data and numerical readouts: `Geist Mono` or `JetBrains Mono`
3. Configure the color palette in `tailwind.config.ts`:
   - Canvas background: `#090A0C` (Dark) / `#F8F9FA` (Light)
   - Panel surfaces: `#111318` (Dark) / `#FFFFFF` (Light)
   - 1px borders: `#1F242F` (Dark) / `#E2E4E9` (Light)
   - Primary Action / Conversion: `#FF5500` (Safety Orange)
   - Accent / Selection: `#0066FF` (Electric Blue)
   - Status Optimal: `#10B981` (Green)
   - Status Caution: `#F59E0B` (Amber)
   - Status Critical: `#EF4444` (Red)
4. Scaffold the exact folder structure:
   - `lib/constants/` (trucks, items, presets)
   - `lib/engine/` (packing logic, box math)
   - `components/visualizer/` (isometric canvas, capacity gauge, inspector)
   - `components/ui/` (inventory drawer, conversion card, preset pills)
   - `components/layout/` (app shell, header, bottom sheet)
   - `app/api/lead/` (lead webhook handler)
   - `app/truck-size/[dwelling]/` (programmatic SEO routes)
   - `app/will-it-fit/[slug]/` (single-item fit routes)

---

## TASK 2: DATA SCHEMAS AND CONSTANTS

Create the static data tables in `lib/constants/`:

1. **`trucks.ts`**: Define standard US rental truck interior specifications in inches and cubic feet:
   - `10ft`: Length 119″, Width 76″, Height 74″, Volume 402 cu ft, Max Payload 2,810 lbs, No cab shelf.
   - `15ft`: Length 180″, Width 92″, Height 86″, Volume 764 cu ft, Max Payload 6,385 lbs, Mom's Attic (Length 36″, Width 76″, Height 30″).
   - `20ft`: Length 240″, Width 92″, Height 86″, Volume 1,016 cu ft, Max Payload 5,700 lbs, Mom's Attic (Length 36″, Width 76″, Height 30″).
   - `26ft`: Length 312″, Width 98″, Height 99″, Volume 1,682 cu ft, Max Payload 9,010 lbs, Mom's Attic (Length 36″, Width 82″, Height 32″).

2. **`items.ts`**: Define standard household furniture with strict real-world packing bounds (inches), volume (cu ft), estimated weight (lbs), and packing orientation:
   - `queen_bed`: Packed Dimensions 80″L × 20″W × 60″H (mattress + foundation stood on edge). Zone: `wall_left`. Cannot stack items on top.
   - `king_bed`: Packed Dimensions 80″L × 20″W × 76″H (on edge). Zone: `wall_left`. Cannot stack items on top.
   - `sofa_3seat`: Packed Dimensions 35″L × 33″W × 84″H (stood vertically on end). Zone: `bulkhead`. Cannot stack items on top.
   - `loveseat`: Packed Dimensions 35″L × 33″W × 60″H (stood vertically on end). Zone: `bulkhead`.
   - `dining_table`: Packed Dimensions 60″L × 4″W × 36″H (top stood on edge, legs bundled). Zone: `wall_left`.
   - `dresser_6drawer`: Packed Dimensions 60″L × 20″W × 35″H (flat on deck). Zone: `floor`. Heavy base item (allows boxes stacked on top).
   - `nightstand`: Packed Dimensions 22″L × 18″W × 24″H. Zone: `floor`.
   - `box_small`: Dimensions 16″L × 12″W × 12″H (1.5 cu ft, 30 lbs). Max stack height: 5.
   - `box_medium`: Dimensions 18″L × 18″W × 16″H (3.0 cu ft, 35 lbs). Max stack height: 4.
   - `box_large`: Dimensions 18″L × 18″W × 24″H (4.5 cu ft, 40 lbs). Max stack height: 3.
   - `box_wardrobe`: Dimensions 24″L × 24″W × 48″H (16.0 cu ft, 50 lbs). Zone: `attic` or `floor`. Cannot stack items on top.

3. **`presets.ts`**: Define default inventories for instant one-click loading:
   - `studio`: 1 Queen Bed, 1 Loveseat, 1 Coffee Table, 1 TV Stand, 15 Medium Boxes, 10 Small Boxes, 2 Wardrobe Boxes. Default Truck: `10ft`.
   - `1-2_bed`: 1 Queen Bed, 1 3-Seat Sofa, 1 6-Drawer Dresser, 2 Nightstands, 1 Dining Table, 4 Chairs, 25 Medium Boxes, 15 Small Boxes, 8 Large Boxes, 4 Wardrobe Boxes. Default Truck: `15ft`.
   - `3+_bed`: 1 King Bed, 1 Queen Bed, 1 3-Seat Sofa, 1 Loveseat, 2 Dressers, 4 Nightstands, 1 Dining Set, 1 Desk, 40 Medium Boxes, 25 Small Boxes, 15 Large Boxes, 8 Wardrobe Boxes. Default Truck: `20ft`.

---

## TASK 3: CALCULATION ENGINES

Implement pure calculation functions in `lib/engine/`:

1. **`boxCalculator.ts`**:
   - Implement the box count formula:
     $$\text{Total Boxes} = ((\text{Bedrooms} \times 20) + (\text{Occupants} \times 10)) \times \text{Density Multiplier}$$
     *(Density Multipliers: Minimalist = 0.8, Standard = 1.0, Packrat = 1.35)*.
   - Distribute the resulting total into box types:
     - Small: 30%
     - Medium: 45%
     - Large: 15%
     - Wardrobe: Bedrooms × 2 (minimum 2)
   - Return counts, individual cubic feet, and total box volume.

2. **`capacityEngine.ts`**:
   - Apply the mandatory 18% packing inefficiency safety buffer:
     $$\text{Usable Capacity} = \text{Interior Truck Volume (cu ft)} \times 0.82$$
     $$\text{Fill Percentage} = \frac{\sum \text{Item Volume}}{\text{Usable Capacity}} \times 100$$
   - Calculate total estimated cargo weight by summing item weights.
   - Return status:
     - `optimal` (0% to 70%): Safe fit.
     - `caution` (71% to 85%): Tight fit; requires ceiling-height professional stacking.
     - `critical` (>85%): Over capacity; recommend upgrading to next truck size.

---

## TASK 4: ISOMETRIC AUTO-PACK HEURISTIC ENGINE

Create `lib/engine/packEngine.ts` to convert the active inventory list into positioned 3D blocks $[x, y, z]$:

1. Coordinate system definition:
   - $X$: Truck length from front bulkhead ($0$) to roll-up door (`usableLength`).
   - $Y$: Vertical height from floor ($0$) to ceiling (`usableHeight`).
   - $Z$: Width across truck bed from left wall ($0$) to right wall (`usableWidth`).
2. Implement heuristic placement sequence:
   - **Phase 1 (Left Wall):** Snap mattresses, box springs, and tabletops along $Z = 0$, stood on edge along the $X$-axis.
   - **Phase 2 (Front Bulkhead):** Snap upright sofas and tall heavy items along $X = 0$ across the available $Z$-axis width.
   - **Phase 3 (Floor Deck):** Place dressers, nightstands, and heavy items flat on the floor deck ($Y = 0$) in remaining open floor space.
   - **Phase 4 (Mom's Attic):** Route wardrobe boxes, fragile items, and light parcels into the elevated cab compartment ($Y \ge \text{usableHeight} - \text{atticHeight}$).
   - **Phase 5 (Box Columns):** Aggregate remaining small, medium, and large boxes into dense, uniform vertical tiers stacked floor-to-ceiling in the remaining cargo space.
3. Return an array of drawable isometric blocks:
   `{ id, label, x, y, z, length, width, height, color, category, isAttic }`.

---

## TASK 5: 2.5D ISOMETRIC CANVAS COMPONENT

Build `components/visualizer/TruckCanvas.tsx` using HTML5 Canvas:

1. **Projection Math**:
   Convert 3D coordinates $(x, y, z)$ to 2D screen coordinates $(X_{\text{screen}}, Y_{\text{screen}})$ at a fixed 30° isometric angle:
   $$X_{\text{screen}} = (x - z) \cdot \cos(30^\circ) \cdot \text{scale} + \text{offsetX}$$
   $$Y_{\text{screen}} = ((x + z) \cdot \sin(30^\circ) - y) \cdot \text{scale} + \text{offsetY}$$
   *(Set $\cos(30^\circ) \approx 0.866$ and $\sin(30^\circ) = 0.5$)*.
2. **Retina Display Optimization**:
   Scale the canvas buffer by `window.devicePixelRatio` to ensure 1px gridlines and text labels remain razor-sharp.
3. **Truck Shell Rendering**:
   - Draw the floor deck grid with subtle 1-foot line increments.
   - Draw the left wall and front bulkhead in semi-transparent dark wireframe.
   - Draw the elevated "Mom's Attic" shelf over the cab (if present for selected truck size).
   - Keep the right wall and ceiling cut away for an open visual cross-section.
4. **Painter's Algorithm Depth Sorting**:
   Sort all blocks by depth before drawing to eliminate overlap bugs:
   $$\text{Depth Key} = x + z + y$$
   Render items from back to front (lowest depth key to highest).
5. **Block Rendering**:
   - Render each block as a 3D isometric prism.
   - Apply distinct lighting across faces: Top face light, Right face medium, Left face dark.
   - Print clean uppercase monospace labels on visible block faces (e.g., `QUEEN BED`, `SOFA`, `BOX TIER`).
6. **Interaction**:
   Add raycasting or mouse coordinate checks so hovering over a block highlights its perimeter in `#0066FF` and reveals a dimensional tooltip.

---

## TASK 6: CAPACITY GAUGE AND HUD

Build `components/visualizer/CapacityGauge.tsx` and HUD overlays:

1. **Capacity Gauge**:
   - Horizontal progress bar placed directly below the truck canvas.
   - Reactive color styling based on status: Emerald Green (Optimal), Amber (Caution), Crimson Red (Critical).
   - Monospace numeric readout: `[Fill %] Full ([Used Cu Ft] / [Usable Cu Ft] cu ft)`.
2. **Safety Buffer Readout**:
   - Display a persistent micro-badge: `18% Real-World Packing Buffer Included`.
3. **Payload Estimator**:
   - Readout showing: `Est. Cargo Weight: [Weight] lbs / Max Payload: [Max] lbs`.
4. **Dynamic Size-Up CTA**:
   - When capacity hits 71%+ (Amber or Red), render a prominent high-contrast banner:
     `"Space is tight. Upgrade to [Next Truck Size] to prevent moving-day overflow."`
   - Clicking upgrades the canvas to the next truck size in one click.

---

## TASK 7: INVENTORY DRAWER COMPONENT

Build `components/ui/InventoryDrawer.tsx` (left sidebar on desktop, collapsible drawer on mobile):

1. **Preset Selectors**:
   - Top row of pill buttons: `[Studio]`, `[1-2 Bed]`, `[3+ Bed]`.
   - Clicking a pill triggers the preset inventory, re-calculates boxes, and updates the canvas immediately.
2. **Baseline Room Controls**:
   - Stepper inputs for `Bedrooms` (1–5) and `Occupants` (1–6).
   - Density dropdown: `Minimalist (0.8x)`, `Standard (1.0x)`, `Packrat (1.35x)`.
   - Triggers the box estimation calculation instantly.
3. **Categorized Inventory Accordions**:
   - Accordion categories: `Living Room`, `Bedrooms`, `Dining & Office`, `Boxes`.
   - Each row displays: Lucide SVG icon, item label, cubic footage pill, and `[-]` / `[+]` count steppers.
4. **Custom Dimensions Module**:
   - Expandable section titled `+ Add Custom Item`.
   - Inputs: Name, Length (in), Width (in), Height (in), Quantity.
   - "Add to Truck" button appends custom blocks to the packing engine.

---

## TASK 8: CONVERSION CARD (CPL MONETIZATION)

Build `components/ui/ConversionCard.tsx` (right sidebar on desktop):

1. **Header**:
   - Title: `Lock In Verified Moving Rates`.
   - Dynamic status pill: `Sized for [Selected Truck Size] ([Fill %] Capacity)`.
2. **Form Inputs (Strict Validation)**:
   - `Origin ZIP`: 5-digit US postal code validation.
   - `Destination ZIP`: 5-digit US postal code validation.
   - `Move Date`: Native date selector; disable past dates.
   - `Email Address`: Standard RFC email regex validation.
3. **Primary CTA**:
   - Full-width button: `Compare Mover Rates & Truck Prices`.
   - Color: Solid `#FF5500` (Safety Orange), white bold text, prominent hover state.
4. **Trust Signals**:
   - Render carrier trust badges below button: `USDOT Licensed Carriers`, `No-Spam Guarantee`, `Instant Estimate`.
5. **Form Submission**:
   - POST valid payload to `/api/lead`.
   - On success, display a clean confirmation modal containing the estimated price range and download link for the Load Manifest.

---

## TASK 9: RESPONSIVE APPLICATION SHELL

Build `components/layout/AppShell.tsx`:

1. **Desktop Layout (≥ 1024px)**:
   - Fixed, non-scrolling 3-column viewport:
     - Left Column (320px): Inventory Drawer (internal scroll).
     - Center Column (Flex-1): Isometric Truck Canvas + Capacity Gauge + HUD.
     - Right Column (340px): Conversion Card (sticky).
2. **Mobile Layout (< 1024px)**:
   - Top 45% of screen: Sticky 2.5D Isometric Canvas.
   - Bottom 55% of screen: Swipeable bottom sheet with tabs:
     - `[Tab 1: Inventory & Presets]`
     - `[Tab 2: Quote & Rates]`
   - Persistent bottom pill showing `[Fill %] Capacity • [Truck Size] • Tap for Rates`.
3. **Global Micro-Header**:
   - Brand logo (`TRUCKSIZER`), quick-preset buttons, `Imperial/Metric` toggle, and `Reset Canvas` button.

---

## TASK 10: PROGRAMMATIC SEO ROUTE ENGINE

Implement dynamic Next.js App Router templates:

1. **`app/truck-size/[dwelling]/page.tsx`**:
   - Slugs: `studio-apartment`, `1-bedroom-apartment`, `2-bedroom-apartment`, `3-bedroom-home`.
   - Server-Side Rendering (SSR) fetches the matching preset and auto-loads the isometric canvas and inventory drawer in the pre-packed state.
   - Dynamic Metadata:
     - Title: `What Size Moving Truck for a [Dwelling]? (Visual Fit Guide)`
     - Description: `Accurate sizing calculator and 2.5D visual load plan for a [Dwelling]. Find box counts and compare verified moving quotes.`
     - Schema.org: Output `SoftwareApplication` JSON-LD structured data.
2. **`app/will-it-fit/[slug]/page.tsx`**:
   - Slugs: `king-mattress-in-10ft-truck`, `sectional-sofa-in-15ft-truck`, etc.
   - Loads canvas with the single item placed in its optimal orientation.
   - Prominent bold hero badge answering the query directly (e.g., *"YES: A King Mattress fits in a 10-ft truck stood on edge along the side wall"*).

---

## TASK 11: LOAD MANIFEST EXPORT (PRINT/PDF)

Implement `components/ui/LoadManifestModal.tsx`:

1. Build a print-ready document view (`@media print` stylesheet) containing:
   - Itemized packing box shopping checklist (counts for Small, Medium, Large, Wardrobe boxes, tape rolls).
   - 4-phase truck loading sequence instructions:
     - *Phase 1:* Stand mattresses and tabletops vertically along side rails.
     - *Phase 2:* Stand sofas vertically against front bulkhead; place dressers flat on deck.
     - *Phase 3:* Stack cardboard boxes in tight vertical tiers floor-to-ceiling.
     - *Phase 4:* Place wardrobe boxes and fragile items in Mom's Attic.
   - Volumetric data summary: Total cubic feet, safety buffer percentage, estimated payload weight.
   - Lead confirmation reference number.
2. Provide a single-click `[Print / Save as PDF]` trigger.

---

## TASK 12: API ROUTE & LEGAL DISCLAIMER

1. **`app/api/lead/route.ts`**:
   - Accept incoming POST requests containing:
     `{ originZip, destinationZip, moveDate, email, cuFt, truckSize, safetyBuffer, inventorySummary }`.
   - Validate all fields server-side with strict error returns (400) for missing or invalid inputs.
   - Log the structured lead payload and return a 200 JSON success response `{ success: true, leadId: string }`.
2. **Legal Insulation & Below-Canvas Content**:
   - Below the interactive workspace, render an informational section for SEO and compliance:
     - Standard truck size comparison specifications table.
     - Professional loading methodology overview.
     - Hardcoded legal disclaimer:
       > *"Notice: All calculations, spatial models, and box counts are mathematical estimates based on standard furniture dimensions and professional loading practices. Vehicle specifications reflect standard US rental fleets (U-Haul, Budget, Penske). When between truck sizes, rental providers always recommend reserving the larger vehicle."*

## TASK 13: CPL POSTBACK & CONVERSION TRACKING

1. **Conversion Event Architecture**:
   - Implement client-side tracking hooks in `lib/analytics/events.ts`.
   - Fire custom events for the moving lead funnel:
     - `preset_selected`: Fires when user clicks Studio / 1-Bed / 3-Bed (`{ preset_id, truck_size }`).
     - `capacity_threshold_crossed`: Fires when volume crosses 71% (`amber`) or 85% (`critical`).
     - `size_up_clicked`: Fires when user clicks the dynamic upgrade banner.
     - `quote_form_submitted`: Fires on successful POST to `/api/lead`.
2. **Server-Side Postback Handler**:
   - In `app/api/lead/route.ts`, implement postback integration hooks for moving affiliate networks (e.g., CJ, Sirelo, QuinStreet).
   - Generate a unique click/lead UUID (`lead_uuid`) upon submission.
   - If an affiliate click ID exists in cookies (`subid` or `click_id`), pass it through to the broker webhook to ensure revenue attribution.

---

## TASK 14: PROGRAMMATIC SITEMAP & DYNAMIC ROBOTS.TXT

1. **Dynamic Sitemap (`app/sitemap.ts`)**:
   - Generate dynamic sitemap entries covering:
     - Static pages: `/`, `/privacy`, `/terms`, `/how-we-calculate`.
     - Dwelling routes: Map over all preset keys in `presets.ts` (`/truck-size/studio-apartment`, `/truck-size/1-bedroom-apartment`, `/truck-size/2-bedroom-apartment`, `/truck-size/3-bedroom-home`, `/truck-size/4-bedroom-house`).
     - Single-item fit routes: Map over high-intent search combinations from `items.ts` × `trucks.ts` (`/will-it-fit/king-mattress-in-10ft-truck`, `/will-it-fit/sectional-sofa-in-15ft-truck`, `/will-it-fit/queen-bed-in-10ft-truck`, etc.).
   - Set `changeFrequency: 'monthly'` and `priority: 0.8` for programmatic pages; `priority: 1.0` for `/`.
2. **Robots Configuration (`app/robots.ts`)**:
   - Allow all legitimate search crawlers (`*`).
   - Disallow internal API endpoints: `/api/*`.
   - Point explicitly to the dynamic sitemap URL (`https://[domain]/sitemap.xml`).

---

## TASK 15: VALIDATION SUITE & GEOMETRIC TEST HARNESS

1. **Unit Tests (`__tests__/engine.test.ts`)**:
   - Install Vitest or Jest.
   - Test `boxCalculator.ts`:
     - Assert a 2-bedroom, 2-occupant home with standard density returns exactly 60 total boxes (18 Small, 27 Medium, 9 Large, 4 Wardrobe).
     - Assert packrat density (1.35x) scales totals up proportionally without fractional box counts.
   - Test `capacityEngine.ts`:
     - Assert that 330 cu ft of cargo inside a 10-ft truck (402 cu ft total, 329 cu ft usable at 18% buffer) triggers `critical` (>85%) status.
     - Assert that cargo weight exceeding `maxPayloadLbs` flags a payload overload warning.
   - Test `packEngine.ts`:
     - Verify mattresses stand on edge ($Z = 0$, width = 20″, height = 60″/76″).
     - Verify sofas stand vertically ($X = 0$, height = 84″).
     - Assert that no items exceed the ceiling height of the selected truck.

---

## TASK 16: PRODUCTION DEPLOYMENT & ENVIRONMENT VARIABLES

1. **Environment Variables Schema (`.env.example`)**:
   - `NEXT_PUBLIC_SITE_URL=https://trucksizer.com`
   - `LEAD_BROKER_API_KEY=` (Moving affiliate/broker network API key)
   - `LEAD_BROKER_API_ENDPOINT=` (Live endpoint for dispatching validated CPL leads)
   - `NEXT_PUBLIC_GA_ID=` (Google Analytics 4 measurement ID)
2. **Production Build Validation**:
   - Run `npm run build` to verify zero TypeScript compilation errors and complete SSG/SSR generation on all dynamic routes.
   - Verify that all canvas projection math operates safely during SSR without window/document hydration mismatch errors.