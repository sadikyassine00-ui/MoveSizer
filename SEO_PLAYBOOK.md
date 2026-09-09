# TruckSizer Programmatic SEO & Conversion Playbook

This document defines the architectural standards, ranking rationale, and implementation guidelines for programmatic search optimization across `trucksizer.com`.

---

## 1. Structured Data Architecture (Rich Snippets & AI Engine Ingestion)

Search engines (Google, Bing, and AI crawlers like Perplexity and Copilot) prioritize structured data to extract factual parameters directly into SERP answer cards and AI Overviews.

* **Target Entity:** Schema.org `FAQPage` paired with structured numerical specifications (`lib/schema/faqSchema.ts`).
* **Placement:** Programmatically generated on every `/dimensions/[slug]` and `/compare/[slug]` page.
* **Core Rule:** Questions and answers must use verified database specs rather than boilerplate text. Every question must directly map to observed user queries:
  * Interior usable cubic footage and floor deck length.
  * Presence, dimensions, and weight limitations of the cabover shelf ("Mom's Attic").
  * Clear differentiation between advertised vehicle length and actual usable floor length.
* **Strategic Value:** Enhances snippet pixel height on desktop/mobile SERPs and supplies clean, token-efficient facts to AI indexers.

---

## 2. Information Scent & Above-the-Fold UX (`UsableSpecsCallout`)

Movers search specifically for "interior" and "inside" dimensions because truck rental companies advertise deceptive exterior bumper-to-bumper lengths. If a visitor does not find the exact dimension within 3 seconds, they bounce back to the search results, registering a negative signal with ranking algorithms.

* **Component Standard:** High-contrast dimensional summary grid positioned above the fold on all dimension and comparison routes (`components/truck/UsableSpecsCallout.tsx`).
* **Mandatory Dimensional Fields:**
  * **Advertised Class:** Commercial fleet tier (e.g., 10ft, 15ft, 26ft).
  * **Usable Floor Deck Length:** True flat floor measurement minus cab and bumper.
  * **Wheel Well Intrusion:** Width between wheel housings (the single most critical choke point for mattress and sectional loading).
  * **Door Clearance:** Clear roll-up door pass-through height and width.
  * **Cabover Shelf Presence:** Explicit status ("None / Flat Wall" on 10ft vs. dimensions and 500-lb limit on 15ft+).
* **Strategic Value:** Eliminates pogo-sticking back to search results, protects early Page 1 rankings, and establishes instant domain credibility.

---

## 3. High-Intent Comparison Matrix (`/compare/` Route Expansion)

Search data confirms that users comparing two specific fleet options are at the bottom of the purchase funnel. Generic informational pages build awareness, but comparison pages generate affiliate clicks.

* **Target URL Clusters:**
  * **Intra-fleet size stepping:** `/compare/10ft-vs-15ft` (answering ramp presence, Mom's Attic availability, and chassis differences).
  * **Branded intra-fleet stepping:** `/compare/10ft-vs-15ft-uhaul` (capturing high-volume Bing commercial queries).
  * **Cross-brand fleet parity:** `/compare/15ft-truck-brands` (U-Haul 15ft vs. Budget 16ft vs. Penske 16ft).
  * **Capacity step-ups:** `/compare/15ft-vs-20ft` (volume jumps and payload capacity limits).
* **Content Hierarchy:**
  * Visual cubic volume progress bars comparing both models side-by-side.
  * Direct comparison of mechanical loading factors (loading ramp vs. liftgate vs. bare bumper drop).
  * Recommended dwelling threshold for each option.
  * Interactive 2.5D visualizer switcher (`components/truck/CompareVisualizerToggle.tsx`).
* **Strategic Value:** Captures high-CTR searches where users are ready to book a truck or labor within 24 to 72 hours.

---

## 4. Engagement-First Landing Pages (Canvas Auto-Hydration)

Landing on a blank interactive visualizer forces high cognitive load on the user. For programmatic SEO, every URL must act as a complete, pre-configured answer to the search query.

* **Route-to-State Mapping:**
  * **Dimension Routes (`/dimensions/[slug]`):** The canvas must immediately mount with that specific truck model rendered in isometric 2.5D, showing exterior boundaries and door frames.
  * **Dwelling Routes (`/truck-size/[slug]`):** The canvas must mount with the recommended vehicle class pre-packed with a standard cargo preset (e.g., `/truck-size/2-bedroom-apartment` pre-loads a queen bed, sofa, dresser, dining set, and 30 standardized boxes).
  * **Item Fit Routes (`/will-it-fit/[slug]`):** The canvas must render the target item positioned inside the specific cargo box, visually demonstrating clearance around wheel wells and door openings.
  * **Component & Shell Hydration:** `components/canvas/TruckCanvas.tsx` and `components/layout/AppShell.tsx` accept `truckSize`, `presetType`, and `preloadedItems` and auto-hydrate from URL query parameters.
* **Strategic Value:** Maximizes initial session engagement, triggers immediate interaction events, and drives up session duration without confusing the user.

---

## 5. SERP Snippet & CTR Engineering

A page ranking in positions 5 to 10 will quickly be demoted by search algorithms if searchers scroll past it. Title tags and meta descriptions must emphasize concrete numbers and practical utility over generic branding.

* **Title Tag Formula:**
  * `[Specific Size/Model] Box Truck Dimensions: Inside Usable Space & Cu Ft Guide`
  * `[Model A] vs [Model B]: Usable Interior Size & Spec Comparison`
  * `What Size Moving Truck for a [Dwelling Type]? (Visual Sizer)`
* **Snippet Principles:**
  * Keep titles strictly under 60 characters to avoid mobile truncation.
  * Feature terms like **Usable**, **Inside**, **Clearance**, and **Exact** to contrast with generic rental company landing pages.
  * Include clear parentheses or bracketed qualifiers to capture visual attention on crowded mobile screens.
* **Meta Description Constraints:**
  * Under 155 characters.
  * Must mention real usable cubic footage, interior deck length, and doorway clearance to drive high search-intent clicks.
