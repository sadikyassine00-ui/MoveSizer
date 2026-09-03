import React from 'react';
import Link from 'next/link';
import { Home, HelpCircle, Truck, FileText } from 'lucide-react';
import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';
import { TRUCKS, TRUCK_ORDER } from '@/lib/constants/trucks';

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

export function FooterDirectory() {
  return (
    <nav
      aria-label="Crawlable Site Directory"
      className="border-t border-[#1F242F] pt-8 pb-4 text-zinc-300"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        {/* Column 1: Dwelling Sizing Calculators */}
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
                  className="text-zinc-400 hover:text-white transition-colors block py-0.5"
                >
                  {item.title} Sizing Guide
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Furniture Clearance Checks */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-[#FF5500]" strokeWidth={1.5} />
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

        {/* Column 3: Commercial Fleet Specs */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <Truck className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
            <span>Rental Fleet Specs</span>
          </div>
          <ul className="space-y-1.5">
            {TRUCK_ORDER.map((tid) => {
              const trk = TRUCKS[tid];
              return (
                <li key={tid}>
                  <Link
                    href="/#fleet-specs"
                    className="text-zinc-400 hover:text-white transition-colors block py-0.5"
                  >
                    {trk.name} ({trk.volumeCuFt} cu ft)
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/how-we-calculate"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Mom&apos;s Attic Shelf Dimensions
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Standards & Legal Documentation */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-200 font-semibold uppercase tracking-wider text-[11px]">
            <FileText className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Standards & Legal</span>
          </div>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/how-we-calculate"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Volumetric Packing Formula
              </Link>
            </li>
            <li>
              <Link
                href="/how-we-calculate"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                18% Safety Inefficiency Buffer
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Privacy & Lead Protection
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-zinc-400 hover:text-white transition-colors block py-0.5"
              >
                Terms of Use & Disclaimer
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
