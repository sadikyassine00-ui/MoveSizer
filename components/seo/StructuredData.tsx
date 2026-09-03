import React from 'react';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface StructuredDataProps {
  breadcrumbs?: BreadcrumbItem[];
}

export default function StructuredData({ breadcrumbs }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com';

  // 1. BreadcrumbList Schema (Directly triggers GSC Breadcrumbs Enhancement)
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (
      breadcrumbs || [{ name: 'Home', url: baseUrl }]
    ).map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  // 2. WebApplication / SoftwareApplication Schema
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TruckSizer',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All modern web browsers',
    browserRequirements: 'Requires JavaScript',
    url: baseUrl,
    description:
      'Interactive 2.5D moving truck sizing calculator with commercial loading heuristics and real-time cargo volume optimization.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      '2.5D isometric cargo packing simulation',
      'Dynamic volumetric safety buffer calculation',
      'Local and interstate moving cost estimates',
      'Exportable loading manifest checklist',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
    </>
  );
}
