import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

const UMAMI_URL  = (process.env.UMAMI_URL    || '').replace(/\/$/, '');
const UMAMI_KEY  = process.env.UMAMI_API_KEY  || '';
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || '';

let cachedToken = '';
let tokenExpires = 0;

function umamiConfigured(): boolean {
  return Boolean(UMAMI_URL && UMAMI_KEY && WEBSITE_ID);
}

function getUmamiToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpires) {
    return Promise.resolve(cachedToken);
  }
  return new Promise((resolve) => {
    const url = new URL(UMAMI_URL + '/api/auth/login');
    const lib = url.protocol === 'https:' ? https : http;
    const payload = JSON.stringify({ username: 'admin', password: UMAMI_KEY });
    
    const req = lib.request(
      {
        hostname: url.hostname,
        port:     url.port || undefined,
        path:     url.pathname,
        method:   'POST',
        headers:  {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const resData = JSON.parse(data);
              if (resData.token) {
                cachedToken = resData.token;
                tokenExpires = Date.now() + 115 * 60 * 1000; // 1 hour 55 mins
                resolve(cachedToken);
                return;
              }
            } catch {}
          }
          resolve('');
        });
      }
    );
    req.on('error', () => resolve(''));
    req.write(payload);
    req.end();
  });
}

async function umamiGet(path: string): Promise<any> {
  const token = await getUmamiToken();
  return new Promise((resolve, reject) => {
    const url = new URL(UMAMI_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-umami-api-key'] = UMAMI_KEY;
    }

    const req = lib.get(
      {
        hostname: url.hostname,
        port:     url.port || undefined,
        path:     url.pathname + url.search,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid JSON from Umami')); }
        });
      },
    );
    req.on('error', reject);
  });
}

function rangeFromQuery(query: any): { startAt: number; endAt: number } {
  const days    = parseInt(query.days || '30');
  const endAt   = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;
  return { startAt, endAt };
}

// ── GET /api/visitor-analytics/status ──────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: umamiConfigured(), websiteId: WEBSITE_ID || null });
});

// ── GET /api/visitor-analytics/stats ───────────────────────────────────────
router.get('/stats', async (req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json({ _mock: true, pageviews: { value: 0 }, visitors: { value: 0 }, visits: { value: 0 }, bounces: { value: 0 }, totaltime: { value: 0 } });
    return;
  }
  try {
    const { startAt, endAt } = rangeFromQuery(req.query);
    const data = await umamiGet(`/api/websites/${WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

// ── GET /api/visitor-analytics/pageviews ───────────────────────────────────
router.get('/pageviews', async (req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json({ pageviews: [], sessions: [] });
    return;
  }
  try {
    const { startAt, endAt } = rangeFromQuery(req.query);
    const unit = (req.query.unit as string) || 'day';
    const data = await umamiGet(
      `/api/websites/${WEBSITE_ID}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=UTC`,
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

// ── GET /api/visitor-analytics/metrics ─────────────────────────────────────
// type: url | referrer | device | country | browser | os | region | city | language
router.get('/metrics', async (req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json([]);
    return;
  }
  try {
    const { startAt, endAt } = rangeFromQuery(req.query);
    const type  = (req.query.type  as string) || 'url';
    const limit = parseInt((req.query.limit as string) || '20');
    const data  = await umamiGet(
      `/api/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=${type}&limit=${limit}`,
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

// ── GET /api/visitor-analytics/active ──────────────────────────────────────
// Visitors active in the last 5 minutes.
router.get('/active', async (_req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json({ x: 0 });
    return;
  }
  try {
    const data = await umamiGet(`/api/websites/${WEBSITE_ID}/active`);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

// ── GET /api/visitor-analytics/events ──────────────────────────────────────
// Custom conversion event breakdown.
router.get('/events', async (req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json([]);
    return;
  }
  try {
    const { startAt, endAt } = rangeFromQuery(req.query);
    const data = await umamiGet(
      `/api/websites/${WEBSITE_ID}/metrics?startAt=${startAt}&endAt=${endAt}&type=event`,
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

// ── GET /api/visitor-analytics/sessions ────────────────────────────────────
// Paginated session list with device, location, referrer, duration, page count.
router.get('/sessions', async (req: Request, res: Response) => {
  if (!umamiConfigured()) {
    res.json({ data: [], count: 0, page: 1, pageSize: 20 });
    return;
  }
  try {
    const { startAt, endAt } = rangeFromQuery(req.query);
    const page     = parseInt((req.query.page     as string) || '1');
    const pageSize = parseInt((req.query.pageSize as string) || '20');
    const data = await umamiGet(
      `/api/websites/${WEBSITE_ID}/sessions?startAt=${startAt}&endAt=${endAt}&page=${page}&pageSize=${pageSize}`,
    );
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Umami unreachable', detail: err.message });
  }
});

export default router;
