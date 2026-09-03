import { DWELLING_SLUG_MAP } from '@/lib/constants/presets';

export const DEFAULT_INDEXNOW_KEY = '7d5b128532f64ab896e30bca238a8e52';

export const KNOWN_FIT_SLUGS = [
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

export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY;
}

export function getIndexNowHost(baseUrl?: string): string {
  const urlStr = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com';
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname;
  } catch {
    return 'www.trucksizer.com';
  }
}

export function getAllSiteUrls(baseUrl?: string): string[] {
  const siteUrl = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.trucksizer.com').replace(/\/$/, '');

  const staticUrls = [
    siteUrl,
    `${siteUrl}/how-we-calculate`,
    `${siteUrl}/privacy`,
    `${siteUrl}/terms`,
  ];

  const dwellingUrls = Object.keys(DWELLING_SLUG_MAP).map(
    (slug) => `${siteUrl}/truck-size/${slug}`
  );

  const fitUrls = KNOWN_FIT_SLUGS.map(
    (slug) => `${siteUrl}/will-it-fit/${slug}`
  );

  return [...staticUrls, ...dwellingUrls, ...fitUrls];
}

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export interface IndexNowResult {
  success: boolean;
  status: number;
  message: string;
  submittedCount: number;
  endpoint: string;
}

export async function submitToIndexNow(
  urls: string[],
  options?: {
    key?: string;
    host?: string;
    endpoint?: string;
  }
): Promise<IndexNowResult> {
  const key = options?.key || getIndexNowKey();
  const host = options?.host || getIndexNowHost();
  const endpoint = options?.endpoint || 'https://api.indexnow.org/indexnow';

  if (!urls || urls.length === 0) {
    return {
      success: false,
      status: 400,
      message: 'No URLs provided for submission.',
      submittedCount: 0,
      endpoint,
    };
  }

  // IndexNow supports up to 10,000 URLs per request
  const boundedUrls = urls.slice(0, 10000);

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: boundedUrls,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    // 200 = OK, 202 = Accepted (Key verification pending)
    const isSuccess = response.status === 200 || response.status === 202;

    let responseBodyText = '';
    try {
      responseBodyText = await response.text();
    } catch {
      // Empty response body is standard for 200/202
    }

    const message = isSuccess
      ? `Successfully submitted ${boundedUrls.length} URL(s) to IndexNow (Status ${response.status}).`
      : `IndexNow submission failed with HTTP ${response.status}: ${responseBodyText || response.statusText}`;

    return {
      success: isSuccess,
      status: response.status,
      message,
      submittedCount: isSuccess ? boundedUrls.length : 0,
      endpoint,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: 500,
      message: `Network error connecting to IndexNow endpoint: ${errorMessage}`,
      submittedCount: 0,
      endpoint,
    };
  }
}
