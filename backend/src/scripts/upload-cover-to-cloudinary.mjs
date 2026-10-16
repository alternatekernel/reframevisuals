/**
 * Upload a single image to Cloudinary via a signed REST request and print the
 * resulting secure URL. Standalone (no repo deps) so it can run anywhere Node 18+
 * and outbound HTTPS to api.cloudinary.com are available.
 *
 * Credentials come from the environment — never hardcode or commit them:
 *   CLOUDINARY_CLOUD_NAME=dnmj4altq \
 *   CLOUDINARY_API_KEY=*** CLOUDINARY_API_SECRET=*** \
 *   node backend/src/scripts/upload-cover-to-cloudinary.mjs ./reframe-support-images-cover.jpg
 *
 * Optional: CLOUDINARY_FOLDER (default reframe/cms), PUBLIC_ID to pin the public_id.
 * Copy the printed URL into the publisher as COVER_URL.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'dnmj4altq';
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = process.env.CLOUDINARY_FOLDER || 'reframe/cms';
const PUBLIC_ID = process.env.PUBLIC_ID || '';

const file = process.argv[2];
if (!file) { console.error('Usage: node upload-cover-to-cloudinary.mjs <image-path>'); process.exit(1); }
if (!KEY || !SECRET) { console.error('Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the environment.'); process.exit(1); }

const buf = readFileSync(file);
const ext = (file.split('.').pop() || 'jpg').toLowerCase();
const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
const timestamp = Math.floor(Date.now() / 1000);

// Sign only the params Cloudinary requires: sorted key=value joined by &, then secret, SHA-1.
const signed = { folder: FOLDER, timestamp, ...(PUBLIC_ID ? { public_id: PUBLIC_ID } : {}) };
const toSign = Object.keys(signed).sort().map((k) => `${k}=${signed[k]}`).join('&');
const signature = createHash('sha1').update(toSign + SECRET).digest('hex');

const form = new URLSearchParams();
form.append('file', `data:${mime};base64,${buf.toString('base64')}`);
form.append('api_key', KEY);
form.append('timestamp', String(timestamp));
form.append('folder', FOLDER);
if (PUBLIC_ID) form.append('public_id', PUBLIC_ID);
form.append('signature', signature);

const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: form,
});

const data = await res.json();
if (!res.ok) { console.error('Upload failed:', data?.error?.message || res.status); process.exit(1); }

console.log(`✅ Uploaded ${basename(file)}`);
console.log(`   public_id: ${data.public_id}`);
console.log(`   URL:       ${data.secure_url}`);
console.log(`\nNext: pass this to the publisher as COVER_URL="${data.secure_url}"`);
