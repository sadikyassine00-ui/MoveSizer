import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  const aiBots = [
    'GPTBot',
    'PerplexityBot',
    'ClaudeBot',
    'Google-Extended',
    'Amazonbot',
    'Applebot-Extended',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      ...aiBots.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow: ['/api/'],
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
