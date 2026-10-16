#!/usr/bin/env node
const SITE_URL = process.env.GSC_SITE_URL;
const GSC_TOKEN = process.env.GSC_BEARER_TOKEN;
const SITEMAP_URL = process.env.SITEMAP_URL || 'https://reframevisuals.com/sitemap.xml';
const BING_ENDPOINT = process.env.BING_ENDPOINT;
const BING_API_KEY = process.env.BING_API_KEY;

if (!SITE_URL || !GSC_TOKEN) {
  console.error('Missing GSC_SITE_URL or GSC_BEARER_TOKEN');
  process.exit(1);
}

const submitGsc = async () => {
  const site = encodeURIComponent(SITE_URL);
  const sitemap = encodeURIComponent(SITEMAP_URL);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps/${sitemap}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${GSC_TOKEN}` }
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GSC submit failed ${res.status}: ${t}`);
  }
  console.log(`GSC sitemap submitted: ${SITEMAP_URL}`);
};

const submitBing = async () => {
  if (!BING_ENDPOINT || !BING_API_KEY) {
    console.log('Bing submit skipped (set BING_ENDPOINT and BING_API_KEY)');
    return;
  }
  const url = `${BING_ENDPOINT}?apikey=${encodeURIComponent(BING_API_KEY)}&siteUrl=${encodeURIComponent('https://reframevisuals.com')}&feedpath=${encodeURIComponent(SITEMAP_URL)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Bing submit failed ${res.status}: ${t}`);
  }
  console.log(`Bing sitemap submitted: ${SITEMAP_URL}`);
};

await submitGsc();
await submitBing();
