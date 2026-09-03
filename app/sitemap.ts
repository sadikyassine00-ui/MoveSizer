import { MetadataRoute } from 'next';
import { getAllDwellingSlugs } from '@/lib/seo/dwellings';

const KNOWN_FIT_SLUGS = [
  'king-mattress-in-10ft-truck',
  'queen-bed-in-10ft-truck',
  'sectional-sofa-in-15ft-truck',
  '3-seat-sofa-in-10ft-truck',
  'dining-table-in-10ft-truck',
  'dresser-in-10ft-truck',
  'wardrobe-box-in-10ft-truck',
  'king-mattress-in-15ft-truck',
  'queen-bed-in-15ft-truck',
  'sofa-in-20ft-truck',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-09-03T18:00:00Z'),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/how-we-calculate`,
      lastModified: new Date('2026-09-02T12:00:00Z'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-08-15T00:00:00Z'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-08-15T00:00:00Z'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dwelling guides: priority 0.8
  const dwellingPages: MetadataRoute.Sitemap = getAllDwellingSlugs().map(
    (dwelling, idx) => ({
      url: `${baseUrl}/truck-size/${dwelling}`,
      lastModified: new Date(Date.UTC(2026, 8, 1 + (idx % 3))),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  );

  // Single item fit guides: priority 0.75
  const fitPages: MetadataRoute.Sitemap = KNOWN_FIT_SLUGS.map((slug, idx) => ({
    url: `${baseUrl}/will-it-fit/${slug}`,
    lastModified: new Date(Date.UTC(2026, 7, 20 + (idx % 10))),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...staticPages, ...dwellingPages, ...fitPages];
}
