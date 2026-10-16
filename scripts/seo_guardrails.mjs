#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const servicesPath = path.join(root, 'frontend', 'src', 'data', 'services.ts');
const indexPath = path.join(root, 'frontend', 'index.html');

const fail = (msg) => {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
};

const warn = (msg) => console.warn(`⚠️ ${msg}`);
const pass = (msg) => console.log(`✅ ${msg}`);

const servicesRaw = await fs.readFile(servicesPath, 'utf-8');
const indexRaw = await fs.readFile(indexPath, 'utf-8');

const titleMatches = [...servicesRaw.matchAll(/metaTitle:\s*'([^']+)'/g)].map((m) => m[1].trim());
const descMatches = [...servicesRaw.matchAll(/metaDescription:\s*'([^']+)'/g)].map((m) => m[1].trim());

const dupes = (arr) => {
  const count = new Map();
  for (const v of arr) count.set(v, (count.get(v) || 0) + 1);
  return [...count.entries()].filter(([, c]) => c > 1).map(([v, c]) => ({ value: v, count: c }));
};

if (!titleMatches.length || !descMatches.length) {
  fail('No service meta titles/descriptions found.');
} else {
  pass(`Parsed ${titleMatches.length} meta titles and ${descMatches.length} meta descriptions`);
}

for (const [label, vals] of [['title', titleMatches], ['description', descMatches]]) {
  const d = dupes(vals);
  if (d.length) {
    fail(`Duplicate service meta ${label}s detected: ${d.slice(0, 5).map((x) => `"${x.value}" x${x.count}`).join('; ')}`);
  } else {
    pass(`All service meta ${label}s are unique`);
  }
}

const malformedChars = ['Â¢', 'â€™', 'â€“', 'â€œ', 'â€'];
for (const char of malformedChars) {
  if (servicesRaw.includes(char) || indexRaw.includes(char)) {
    fail(`Detected mojibake character sequence: ${char}`);
  }
}
pass('No mojibake sequences detected in SEO-critical files');

if (!indexRaw.includes('<meta name="robots" content="index, follow" />')) {
  fail('Missing default index/follow robots tag in frontend/index.html');
} else {
  pass('Default robots tag present in frontend/index.html');
}

if (!indexRaw.includes('canonicalUrl = \'https://reframevisuals.com\' + cleanPath')) {
  warn('Canonical SPA fallback script signature changed; verify canonical behavior manually.');
} else {
  pass('Canonical SPA fallback script detected');
}

if (process.exitCode) {
  console.error('\nSEO guardrails failed.');
  process.exit(process.exitCode);
}

console.log('\nSEO guardrails passed.');
