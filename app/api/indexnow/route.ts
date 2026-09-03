import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSiteUrls,
  getIndexNowHost,
  getIndexNowKey,
  submitToIndexNow,
} from '@/lib/seo/indexnow';

export async function GET() {
  const host = getIndexNowHost();
  const key = getIndexNowKey();
  const allUrls = getAllSiteUrls();

  return NextResponse.json({
    status: 'configured',
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    endpoints: [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow',
    ],
    totalCrawlableUrls: allUrls.length,
    sampleUrls: allUrls.slice(0, 5),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Optional Secret Protection (for webhook / CI/CD security)
    const secret = process.env.INDEXNOW_SECRET;
    if (secret) {
      const authHeader = req.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

      let bodySecret: string | undefined;
      try {
        const cloned = req.clone();
        const json = await cloned.json();
        bodySecret = json.secret;
      } catch {
        // Body may not be JSON
      }

      if (bearerToken !== secret && bodySecret !== secret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing INDEXNOW_SECRET.' },
          { status: 401 }
        );
      }
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const { urls, all } = body;

    let targetUrls: string[] = [];

    if (all === true || (!urls && all !== false)) {
      targetUrls = getAllSiteUrls();
    } else if (Array.isArray(urls)) {
      targetUrls = urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
    }

    if (targetUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid URLs provided to submit to IndexNow.' },
        { status: 400 }
      );
    }

    // 3. Dispatch to IndexNow
    const result = await submitToIndexNow(targetUrls);

    return NextResponse.json(
      {
        ...result,
        urlsSubmitted: targetUrls,
      },
      { status: result.success ? 200 : result.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Internal error in IndexNow endpoint: ${message}` },
      { status: 500 }
    );
  }
}
