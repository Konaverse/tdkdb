// Submit every URL in the live sitemap to IndexNow (Bing and partners).
// Run: node --env-file=.env.local tools/submit-indexnow.cjs [https://tdkdb.com]
// Pass URLs after the origin to submit only those: ... https://tdkdb.com /en/projects/almond-suites
const key = process.env.INDEXNOW_KEY?.trim();
const [, , originArg, ...only] = process.argv;
const origin = (originArg || process.env.NEXT_PUBLIC_SITE_URL || 'https://tdkdb.com').replace(
  /\/+$/,
  '',
);

(async () => {
  if (!key) {
    console.error('INDEXNOW_KEY is unavailable. Add it to ignored .env.local.');
    process.exitCode = 1;
    return;
  }
  const keyLocation = `${origin}/${key}.txt`;
  const keyFile = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) });
  if (!keyFile.ok || (await keyFile.text()).trim() !== key) {
    console.error(`The key file at ${keyLocation} is missing or does not match INDEXNOW_KEY.`);
    process.exitCode = 1;
    return;
  }

  let urlList;
  if (only.length) {
    urlList = only.map((u) => new URL(u, `${origin}/`).href);
  } else {
    const sitemap = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
    if (!sitemap.ok) throw new Error(`Sitemap fetch failed: HTTP ${sitemap.status}`);
    urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  }
  if (!urlList.length) throw new Error('No URLs to submit.');

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(20000),
  });
  // 200 OK, 202 Accepted (key validation pending), 4xx = fix the request/key.
  console.log(`IndexNow responded ${response.status} for ${urlList.length} URL(s):`);
  urlList.forEach((u) => console.log(`  ${u}`));
  if (!response.ok) process.exitCode = 1;
})().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
