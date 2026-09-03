/**
 * IndexNow Batch Submission Script
 * Submits all active programmatic & static URLs to api.indexnow.org
 * Participating search engines: Bing, Yandex, Seznam, Naver, etc.
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://trucksizer.com').replace(/\/$/, '');
const KEY = process.env.INDEXNOW_KEY || '7d5b128532f64ab896e30bca238a8e52';

const DWELLING_SLUGS = [
  'studio-apartment',
  '1-bedroom-apartment',
  '2-bedroom-apartment',
  '3-bedroom-home',
  '4-bedroom-house',
];

const FIT_SLUGS = [
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

const STATIC_URLS = [
  SITE_URL,
  `${SITE_URL}/how-we-calculate`,
  `${SITE_URL}/privacy`,
  `${SITE_URL}/terms`,
];

const allUrls = [
  ...STATIC_URLS,
  ...DWELLING_SLUGS.map((slug) => `${SITE_URL}/truck-size/${slug}`),
  ...FIT_SLUGS.map((slug) => `${SITE_URL}/will-it-fit/${slug}`),
];

async function submit() {
  const host = new URL(SITE_URL).hostname;
  const keyLocation = `${SITE_URL}/${KEY}.txt`;

  console.log(`[IndexNow] Preparing submission for ${host}`);
  console.log(`[IndexNow] Key: ${KEY}`);
  console.log(`[IndexNow] Key Location: ${keyLocation}`);
  console.log(`[IndexNow] Total URLs to submit: ${allUrls.length}`);

  const payload = {
    host,
    key: KEY,
    keyLocation,
    urlList: allUrls,
  };

  const endpoint = 'https://api.indexnow.org/indexnow';

  try {
    console.log(`[IndexNow] Dispatching POST to ${endpoint}...`);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[IndexNow] Response Status: ${res.status} ${res.statusText}`);

    if (res.status === 200) {
      console.log('✓ Success: All URLs successfully submitted and indexed by IndexNow engines.');
    } else if (res.status === 202) {
      console.log('✓ Accepted (202): Request accepted; IndexNow key verification is in progress.');
    } else {
      const text = await res.text();
      console.warn(`⚠ Notice (HTTP ${res.status}):`, text || 'Check domain and key verification.');
    }
  } catch (err) {
    console.error('✗ Network error during IndexNow submission:', err.message);
  }
}

submit();
