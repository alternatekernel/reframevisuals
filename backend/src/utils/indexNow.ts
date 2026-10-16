import https from 'https';

const INDEX_NOW_KEY = 'e98f70ffefc446b5bad6e9da8da4e631';
const SITE_URL = 'https://reframevisuals.com';

export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;

  const body = JSON.stringify({
    host: 'reframevisuals.com',
    key: INDEX_NOW_KEY,
    keyLocation: `${SITE_URL}/${INDEX_NOW_KEY}.txt`,
    urlList: urls.map((u) => (u.startsWith('http') ? u : `${SITE_URL}${u}`)),
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.indexnow.org',
        path: '/IndexNow',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            console.warn(`[IndexNow] Ping returned ${res.statusCode} for ${urls.length} URLs`);
          } else {
            console.log(`[IndexNow] Pinged ${urls.length} URL(s) — status ${res.statusCode}`);
          }
          resolve();
        });
      }
    );
    req.on('error', (err) => {
      console.warn('[IndexNow] Ping failed:', err.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

export const CORE_URLS = [
  '/',
  '/services',
  '/pricing',
  '/about',
  '/portfolio',
  '/blog',
  '/contact',
  '/free-trial',
];
