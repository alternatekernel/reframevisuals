# Umami Analytics — Self-Hosted Setup on Coolify

Umami is a privacy-first, open-source analytics platform (MIT, 24k+ GitHub stars).
No cookies, GDPR-compliant by design. Self-hosted on your existing Coolify server.

## Why Umami (not Plausible)

- **Sessions log** — built-in visitor log showing who visited, from where, what device, how long.
  Plausible Community Edition does not have this; it is paywalled in Plausible Cloud.
- **Full REST API** — every metric is queryable so they appear in this admin dashboard.
- **Same tech stack** — Node.js + Prisma + MySQL, same as this platform.
- **Lightweight** — 2.3 KB tracking script, no cookies.

---

## Step 1 — Deploy Umami in Coolify

1. Open Coolify at `http://129.212.234.21:8000` → **New Resource → Docker Compose**
2. Paste this compose config:

```yaml
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:mysql-latest
    ports:
      - "3002:3000"
    environment:
      DATABASE_URL: mysql://umami:${UMAMI_DB_PASSWORD}@umami-db:3306/umami
      DATABASE_TYPE: mysql
      APP_SECRET: ${UMAMI_APP_SECRET}
    depends_on:
      umami-db:
        condition: service_healthy
    restart: unless-stopped

  umami-db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: umami
      MYSQL_USER: umami
      MYSQL_PASSWORD: ${UMAMI_DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${UMAMI_DB_ROOT_PASSWORD}
    volumes:
      - umami-db:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  umami-db:
```

3. In Coolify → **Environment Variables** for this service, add:
   ```
   UMAMI_DB_PASSWORD=<generate a strong password>
   UMAMI_DB_ROOT_PASSWORD=<generate another strong password>
   UMAMI_APP_SECRET=<run: openssl rand -hex 32>
   ```

4. Deploy. Umami starts at `http://129.212.234.21:3002`.

5. (Optional) Point a subdomain like `analytics.reframevisuals.com` to port 3002 via Coolify's
   Traefik proxy by setting the domain in the service settings.

---

## Step 2 — First-time Umami setup

1. Open `http://129.212.234.21:3002` (or your subdomain).
2. Log in with default credentials: **admin / umami** — change the password immediately.
3. Go to **Settings → Websites → Add website**.
4. Name: `Reframe Visuals`, Domain: `reframevisuals.com`.
5. Click **Add** — Umami shows a **Website ID** (UUID). Copy it.

---

## Step 3 — Generate an API key

1. In Umami → **Settings → API Keys → Create API Key**.
2. Name it `reframe-admin-dashboard`.
3. Copy the key shown (it is only shown once).

---

## Step 4 — Set environment variables in Coolify (main app)

In your **main reframevisuals app** in Coolify → Environment Variables, add:

```
# Backend (keeps the API key server-side, never exposed to browsers)
UMAMI_URL=https://analytics.reframevisuals.com
UMAMI_API_KEY=<the API key from Step 3>
UMAMI_WEBSITE_ID=<the Website ID UUID from Step 2>

# Frontend (build-time — used to inject the tracking script)
VITE_UMAMI_URL=https://analytics.reframevisuals.com
VITE_UMAMI_WEBSITE_ID=<the Website ID UUID from Step 2>
```

Then **redeploy** the main app. The tracking script injects automatically into every public
page (admin/dashboard routes are excluded).

---

## Step 5 — Verify tracking is active

1. Open `https://reframevisuals.com` in a browser (not admin).
2. In browser DevTools → Network → filter for `script.js` — you should see a 200 from Umami.
3. In Umami dashboard → your site → you should see the visit appear within seconds.

---

## Step 6 — Admin dashboard

Navigate to **Admin → Visitors** in the sidebar. The page shows:

- **Active Now** — visitors in the last 5 minutes (auto-refreshes every 60s)
- **Trend chart** — daily visitors + pageviews for the selected period
- **Top Pages** — highest-traffic URLs
- **Traffic Sources** — where visitors come from
- **Countries** — geographic breakdown with horizontal bars
- **Devices / Browsers** — device type and browser split
- **Conversion Events** — fires when visitors click CTAs, subscribe, submit forms
- **Sessions Log** — paginated table: timestamp, location flag, device, browser, duration, pages, referrer

Date range: Today / 7d / 30d / 90d selector in the page header.

---

## Notes

- The tracking script is **2.3 KB** and loads asynchronously — zero impact on Core Web Vitals.
- No cookies are set; no personal data is stored. GDPR/CCPA compliant by design.
- Admin and dashboard routes (`/admin/**`, `/dashboard/**`) are excluded from tracking.
- Umami's data is stored in its own MySQL database (separate from the app's database).
- The admin dashboard uses a backend proxy (`/api/visitor-analytics/*`) so the Umami API key
  never reaches the browser.
