import { absoluteUrl, siteOrigin } from '@/lib/seo';

/* ───────────────────────────────────────────────────────────────────────────
   IndexNow: tell Bing (and every engine sharing the protocol) which URLs
   changed, the moment they change. The key is public by design: engines
   verify it by fetching `/{key}.txt` from this host, so the same value lives
   in `INDEXNOW_KEY` for the client and in `public/{key}.txt` for the check.
   A missing key makes every call a quiet no-op; a failed submission is only
   logged. Indexing hints must never fail the work that triggered them.
   ─────────────────────────────────────────────────────────────────────────── */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : null;
}

/** Submit site-relative paths or absolute URLs. Resolves to the HTTP status,
    or null when IndexNow is not configured or the request failed. */
export async function submitIndexNow(urls: string[]): Promise<number | null> {
  const key = indexNowKey();
  if (!key || urls.length === 0) return null;
  const origin = siteOrigin();
  const host = new URL(origin).host;
  const urlList = Array.from(new Set(urls.map((u) => absoluteUrl(u)))).filter((u) =>
    u.startsWith(`${origin}/`),
  );
  if (urlList.length === 0) return null;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) console.error('IndexNow submission rejected', { status: response.status });
    return response.status;
  } catch (error) {
    console.error(
      'IndexNow submission failed',
      error instanceof Error ? error.message : 'unknown error',
    );
    return null;
  }
}
