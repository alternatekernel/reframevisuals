#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use fileURLToPath to correctly resolve paths on Windows (M23 fix).
// new URL(import.meta.url).pathname returns '/C:/...' on Windows which breaks path.resolve.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const servicesPath = path.join(repoRoot, 'frontend/src/data/services.ts');
const insightsPath = path.join(repoRoot, 'frontend/src/data/insightsData.ts');

const SERVICE_SLUG_REDIRECTS = {
  'model-retouching': 'model-retouch',
  'jewelry-retouching': 'jewelry-retouch',
  'brand-alignment': 'retouching',
  'enterprise': 'ai-product-photography',
  'image-editing': 'retouching',
  'product-editing': 'retouching',
};

function extractServiceIds(text) {
  return new Set([...text.matchAll(/id:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]));
}

function extractLinkedServiceSlugs(text) {
  return [...text.matchAll(/\(\/services\/([a-z0-9-]+)\)/g)].map((m) => m[1]);
}

const servicesText = fs.readFileSync(servicesPath, 'utf8');
const insightsText = fs.readFileSync(insightsPath, 'utf8');

const serviceIds = extractServiceIds(servicesText);
const linkedSlugs = extractLinkedServiceSlugs(insightsText);

const problems = [];
for (const slug of linkedSlugs) {
  if (serviceIds.has(slug)) continue;
  if (slug in SERVICE_SLUG_REDIRECTS) continue;
  problems.push(slug);
}

const uniqueProblems = [...new Set(problems)].sort();

if (uniqueProblems.length > 0) {
  console.error('❌ Service slug validation failed. Unknown slugs found in insights content:');
  for (const slug of uniqueProblems) console.error(`  - /services/${slug}`);
  process.exit(1);
}

console.log(`✅ Service slug validation passed. Checked ${linkedSlugs.length} service links.`);
