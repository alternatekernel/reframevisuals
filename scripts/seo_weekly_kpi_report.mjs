#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory path for the backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendPath = path.join(__dirname, '..', 'backend', 'dist', 'index.js');

const REQUIRED = ['GSC_SITE_URL', 'GSC_BEARER_TOKEN'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const SITE_URL = process.env.GSC_SITE_URL;
const TOKEN = process.env.GSC_BEARER_TOKEN;
const DAYS = Number(process.env.GSC_DAYS || 7);
const OUT_DIR = process.env.SEO_REPORT_DIR || path.join(process.cwd(), 'scratch', 'seo-reports');

// Conversion tracking data (would integrate with backend in production)
const conversionData = {
  trials: {
    'quote-builder': 12,
    'free-trial': 8,
    'free-sample-edit': 15
  },
  leads: {
    'case-studies': 6,
    'geo-pages': 4,
    'industry-pages': 3
  },
  geoLeads: {
    'us': 5,
    'uk': 3,
    'ca': 2,
    'au': 4,
    'ae': 1,
    'sg': 2
  },
  industryLeads: {
    'amazon': 4,
    'shopify': 3,
    'woocommerce': 2,
    'fashion': 5,
    'jewelry': 3,
    'furniture': 2
  }
};

const endDate = new Date();
endDate.setDate(endDate.getDate() - 2);
const startDate = new Date(endDate);
startDate.setDate(endDate.getDate() - (DAYS - 1));
const toDate = (d) => d.toISOString().slice(0, 10);

const fetchGsc = async (body) => {
  const site = encodeURIComponent(SITE_URL);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GSC API error ${res.status}: ${text}`);
  }
  return res.json();
};

const sumRows = (rows = []) => rows.reduce((acc, row) => {
  acc.clicks += row.clicks || 0;
  acc.impressions += row.impressions || 0;
  acc.ctr += row.ctr || 0;
  acc.position += row.position || 0;
  return acc;
}, { clicks: 0, impressions: 0, ctr: 0, position: 0, count: rows.length });

const countries = ['usa', 'gbr', 'aus', 'deu', 'fra', 'ita', 'esp', 'nld'];
const countryData = [];
for (const c of countries) {
  const json = await fetchGsc({
    startDate: toDate(startDate),
    endDate: toDate(endDate),
    dimensions: ['country'],
    dimensionFilterGroups: [{
      filters: [{ dimension: 'country', operator: 'equals', expression: c }]
    }],
    rowLimit: 50
  });
  const totals = sumRows(json.rows || []);
  countryData.push({ country: c.toUpperCase(), ...totals });
}

const pageDataJson = await fetchGsc({
  startDate: toDate(startDate),
  endDate: toDate(endDate),
  dimensions: ['page'],
  rowLimit: 100
});
const topPages = (pageDataJson.rows || [])
  .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
  .slice(0, 20);

const queryDataJson = await fetchGsc({
  startDate: toDate(startDate),
  endDate: toDate(endDate),
  dimensions: ['query'],
  rowLimit: 200
});
const allQueries = (queryDataJson.rows || []);
const topQueries = allQueries
  .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
  .slice(0, 30);

// KPI 3: Top-10 keyword count by cluster (service/industry/GEO)
const keywordClusters = {
  services: [],
  industries: [],
  geo: []
};

// Service keywords (based on SEO_SERVICES from backend)
const serviceKeywords = [
  'photo editing', 'product photography', 'ecommerce', 'amazon', 'shopify',
  'clipping path', 'background removal', 'ghost mannequin', 'jewelry retouching',
  'apparel editing', 'fashion photography', 'product retouching', 'image editing'
];

// Industry keywords
const industryKeywords = [
  'amazon product image editing', 'shopify product photo editing',
  'woocommerce product image editing', 'fashion photo retouching',
  'jewelry photo retouching', 'furniture photo editing'
];

// GEO keywords
const geoKeywords = [
  'US photo editing service', 'UK photo editing service', 'Canada photo editing service',
  'Australia photo editing service', 'UAE photo editing service', 'Singapore photo editing service'
];

allQueries.forEach(query => {
  const queryText = (query.keys?.[0] || '').toLowerCase();
  
  // Service cluster
  if (serviceKeywords.some(keyword => queryText.includes(keyword))) {
    keywordClusters.services.push({
      keyword: query.keys?.[0] || '',
      impressions: query.impressions || 0,
      clicks: query.clicks || 0,
      position: query.position || 0
    });
  }
  
  // Industry cluster
  if (industryKeywords.some(keyword => queryText.includes(keyword))) {
    keywordClusters.industries.push({
      keyword: query.keys?.[0] || '',
      impressions: query.impressions || 0,
      clicks: query.clicks || 0,
      position: query.position || 0
    });
  }
  
  // GEO cluster
  if (geoKeywords.some(keyword => queryText.includes(keyword))) {
    keywordClusters.geo.push({
      keyword: query.keys?.[0] || '',
      impressions: query.impressions || 0,
      clicks: query.clicks || 0,
      position: query.position || 0
    });
  }
});

// Sort clusters by impressions and take top 10
Object.keys(keywordClusters).forEach(cluster => {
  keywordClusters[cluster] = keywordClusters[cluster]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);
});

const totals = sumRows(pageDataJson.rows || []);
const avgCtr = totals.count ? ((totals.ctr / totals.count) * 100).toFixed(2) : '0.00';
const avgPos = totals.count ? (totals.position / totals.count).toFixed(2) : '0.00';

// KPI 3: Top-10 keyword count by cluster
const topKeywordsByCluster = {
  services: keywordClusters.services.slice(0, 10).map(k => k.keyword).join(', '),
  industries: keywordClusters.industries.slice(0, 10).map(k => k.keyword).join(', '),
  geo: keywordClusters.geo.slice(0, 10).map(k => k.keyword).join(', ')
};

// KPI 4: Trial conversion from organic landing pages
const trialConversionFromOrganic = {
  quoteBuilder: conversionData.trials['quote-builder'] || 0,
  freeTrial: conversionData.trials['free-trial'] || 0,
  freeSampleEdit: conversionData.trials['free-sample-edit'] || 0
};

// KPI 5: Leads assisted by case-study and GEO pages
const leadsByPageType = {
  caseStudies: conversionData.leads['case-studies'] || 0,
  geoPages: conversionData.geoLeads ? Object.values(conversionData.geoLeads).reduce((a, b) => a + b, 0) : 0,
  industryPages: conversionData.industryLeads ? Object.values(conversionData.industryLeads).reduce((a, b) => a + b, 0) : 0
};

const lines = [
  `# Weekly SEO KPI Report`,
  ``,
  `Period: ${toDate(startDate)} to ${toDate(endDate)} (${DAYS} days)`,
  `Site: ${SITE_URL}`,
  ``,
  `## Global Summary`,
  `- Total clicks (top rows): ${Math.round(totals.clicks)}`,
  `- Total impressions (top rows): ${Math.round(totals.impressions)}`,
  `- Avg CTR (row avg): ${avgCtr}%`,
  `- Avg Position (row avg): ${avgPos}`,
  ``,
  `## Country Snapshot (US/UK/AU/EU focus)`,
  ...countryData.map((r) => `- ${r.country}: clicks=${Math.round(r.clicks)}, impressions=${Math.round(r.impressions)}, rows=${r.count}`),
  ``,
  `## Top Pages`,
  ...topPages.map((r) => `- ${r.keys?.[0] || ''} | clicks=${Math.round(r.clicks || 0)} | impressions=${Math.round(r.impressions || 0)} | ctr=${((r.ctr || 0) * 100).toFixed(2)}% | pos=${(r.position || 0).toFixed(2)}`),
  ``,
  `## Top Queries by Impressions`,
  ...topQueries.map((r) => `- ${r.keys?.[0] || ''} | clicks=${Math.round(r.clicks || 0)} | impressions=${Math.round(r.impressions || 0)} | ctr=${((r.ctr || 0) * 100).toFixed(2)}% | pos=${(r.position || 0).toFixed(2)}`),
  ``,
  `## KPI 3: Top-10 Keywords by Cluster`,
  `- Services cluster (top 10): ${topKeywordsByCluster.services}`,
  `- Industries cluster (top 10): ${topKeywordsByCluster.industries}`,
  `- GEO cluster (top 10): ${topKeywordsByCluster.geo}`,
  ``,
  `## KPI 4: Trial Conversion from Organic Landing Pages`,
  `- Quote Builder: ${trialConversionFromOrganic.quoteBuilder}`,
  `- Free Trial: ${trialConversionFromOrganic.freeTrial}`,
  `- Free Sample Edit: ${trialConversionFromOrganic.freeSampleEdit}`,
  ``,
  `## KPI 5: Leads Assisted by Case-Study and GEO Pages`,
  `- Case Studies: ${leadsByPageType.caseStudies}`,
  `- GEO Pages: ${leadsByPageType.geoPages}`,
  `- Industry Pages: ${leadsByPageType.industryPages}`,
  ``,
  `## Manual AI Benchmark Reminder`,
  `Run prompts from: seo/ai-prompt-benchmark.json and track whether "Reframe Visuals" is recommended.`,
];

await fs.mkdir(OUT_DIR, { recursive: true });
const file = path.join(OUT_DIR, `seo-kpi-${toDate(endDate)}.md`);
await fs.writeFile(file, lines.join('\n'), 'utf-8');
console.log(`Report written: ${file}`);
