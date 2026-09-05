import React from 'react';
import Link from 'next/link';
import { Home, HelpCircle, Truck, FileText, Layers, Scale, ShieldCheck } from 'lucide-react';
import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';

const CLEARANCE_CHECKS = [
  { slug: 'king-mattress-in-10ft-truck', label: 'King Mattress in 10-ft Truck' },
  { slug: 'queen-bed-in-10ft-truck', label: 'Queen Bed in 10-ft Truck' },
  { slug: 'sectional-sofa-in-15ft-truck', label: 'Sectional Sofa in 15-ft Truck' },
  { slug: '3-seat-sofa-in-10ft-truck', label: '3-Seat Sofa in 10-ft Truck' },
  { slug: 'dining-table-in-10ft-truck', label: 'Dining Table in 10-ft Truck' },
  { slug: 'dresser-in-10ft-truck', label: '6-Drawer Dresser in 10-ft Truck' },
  { slug: 'wardrobe-box-in-10ft-truck', label: 'Wardrobe Box in 10-ft Truck' },
  { slug: 'king-mattress-in-15ft-truck', label: 'King Mattress in 15-ft Truck' },
];

const DIMENSION_LINKS = [
  { slug: 'box-truck', label: 'Box Truck Dimensions (Master Pillar)' },
  { slug: '10ft-truck', label: '10-Foot Truck Specs (Studio / Dorm)' },
  { slug: '12ft-truck', label: '12-Foot Box Truck Specs (1-Bed Small)' },
  { slug: '15ft-truck', label: '15-Foot Truck Specs (1-2 Bed Standard)' },
  { slug: '16ft-truck', label: '16-Foot Box Truck Specs (2-Bed Apt)' },
  { slug: '20ft-truck', label: '20-Foot Truck Specs (2-3 Bed House)' },
  { slug: '26ft-truck', label: '26-Foot Truck Specs (3-5 Bed Home)' },
];

const BRAND_FLANKING_LINKS = [
  { slug: '10ft-uhaul-specs', label: 'U-Haul 10-Foot Truck Specs' },
  { slug: '15ft-uhaul-specs', label: 'U-Haul 15-Foot Truck Specs' },
  { slug: '20ft-uhaul-specs', label: 'U-Haul 20-Foot Truck Specs' },
  { slug: '26ft-uhaul-specs', label: 'U-Haul 26-Foot Super Mover Specs' },
];

const HOW_TO_PACK_LINKS = [
  { slug: 'moving-truck', label: 'How to Pack a Moving Truck (4 Phases)' },
  { slug: 'furniture-loading', label: 'How to Load Heavy Furniture (Damage-Free)' },
];

const COMPARISON_LINKS = [
  { slug: '10ft-vs-15ft', label: '10ft vs 15ft Moving Truck Comparison' },
  { slug: '15ft-vs-20ft', label: '15ft vs 20ft Moving Truck Comparison' },
  { slug: '15ft-truck-brands', label: 'U-Haul 15\' vs Budget 16\' vs Penske 16\'' },
];

export function FooterDirectory() {
  return (
    <nav
      aria-label="Crawlable Site Directory"
      className="border-t border-[#1F242F] pt-8 pb-4 text-zinc-300"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-xs">
        {/* Column 1: Fleet Dimensions */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <Truck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
            <span>Truck Dimensions</span>
          </div>
          <ul className="space-y-1.5">
            {DIMENSION_LINKS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/dimensions/${item.slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Brand Flanking Specs */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF5500]" strokeWidth={1.5} />
            <span>U-Haul Fleet Specs</span>
          </div>
          <ul className="space-y-1.5">
            {BRAND_FLANKING_LINKS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/dimensions/${item.slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: How-To Guides & Comparisons */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <Layers className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
            <span>Guides &amp; Compare</span>
          </div>
          <ul className="space-y-1.5">
            {HOW_TO_PACK_LINKS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/how-to-pack/${item.slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {COMPARISON_LINKS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/compare/${item.slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Dwelling Sizing Calculators */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <Home className="w-3.5 h-3.5 text-[#0066FF]" strokeWidth={1.5} />
            <span>Home Sizing Guides</span>
          </div>
          <ul className="space-y-1.5">
            {Object.entries(DWELLING_SLUG_MAP).map(([slug, item]) => (
              <li key={slug}>
                <Link
                  href={`/truck-size/${slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={`${item.title} Sizing Guide`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 5: Furniture Clearance Checks */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" strokeWidth={1.5} />
            <span>Clearance Checks</span>
          </div>
          <ul className="space-y-1.5">
            {CLEARANCE_CHECKS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/will-it-fit/${item.slug}`}
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5 truncate"
                  title={item.label}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 6: Standards & Legal */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <FileText className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Standards &amp; Legal</span>
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/how-we-calculate"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Volumetric Formula
              </Link>
            </li>
            <li>
              <Link
                href="/how-we-calculate"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                18% Safety Buffer
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Terms of Use &amp; Disclaimer
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
