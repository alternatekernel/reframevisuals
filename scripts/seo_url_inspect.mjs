#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const GSC_SITE_URL = process.env.GSC_SITE_URL;
const GSC_BEARER_TOKEN = process.env.GSC_BEARER_TOKEN;
const URLS_FILE = process.env.SEO_URLS_FILE || path.join(process.cwd(), 'seo', 'priority-urls.json');
const OUT_FILE = process.env.SEO_INSPECT_OUT || path.join(process.cwd(), 'scratch', 'seo-reports', `url-inspection-${new Date().toISOString().slice(0,10)}.json`);

if (!GSC_SITE_URL || !GSC_BEARER_TOKEN) {
  console.error('Missing GSC_SITE_URL or GSC_BEARER_TOKEN');
  process.exit(1);
}

const raw = await fs.readFile(URLS_FILE, 'utf-8');
let urls = [];
if (URLS_FILE.endsWith('.json')) {
  const parsed = JSON.parse(raw);
  urls = Array.isArray(parsed?.urls) ? parsed.urls : [];
} else {
  urls = raw.split('\n').map((s) => s.trim()).filter(Boolean).filter((s) => !s.startsWith('#'));
}
if (!urls.length) {
  console.error(`No URLs found in ${URLS_FILE}`);
  process.exit(1);
}

const inspectOne = async (inspectionUrl) => {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GSC_BEARER_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl: GSC_SITE_URL,
      languageCode: 'en-US'
    })
  });
  const body = await res.json();
  return { inspectionUrl, ok: res.ok, status: res.status, body };
};

const results = [];
for (const u of urls) {
  try {
    const r = await inspectOne(u);
    results.push(r);
    console.log(`${u} => ${r.status}`);
  } catch (err) {
    results.push({ inspectionUrl: u, ok: false, status: 0, error: String(err) });
    console.log(`${u} => error`);
  }
}

await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
await fs.writeFile(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), siteUrl: GSC_SITE_URL, results }, null, 2), 'utf-8');
console.log(`Inspection report written: ${OUT_FILE}`);
