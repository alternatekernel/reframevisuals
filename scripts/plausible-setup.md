# Plausible Analytics — Self-Hosted Setup

Plausible runs on your existing server alongside Coolify at `129.212.234.21`.
Deploy it on a different port (8001) so it doesn't clash with Coolify (8000).

## 1. Deploy Plausible on the server

SSH into `129.212.234.21`, then:

```bash
mkdir -p /opt/plausible && cd /opt/plausible

# Download official docker-compose
curl -L https://raw.githubusercontent.com/plausible/community-edition/v2.1.4/docker-compose.yml -o docker-compose.yml
curl -L https://raw.githubusercontent.com/plausible/community-edition/v2.1.4/plausible-conf.env -o plausible-conf.env
```

Edit `plausible-conf.env`:
```
BASE_URL=http://129.212.234.21:8001
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n')
```

Edit `docker-compose.yml` — map port 8000 → 8001 on the host so it doesn't clash with Coolify:
```yaml
services:
  plausible:
    ports:
      - "8001:8000"   # <-- change left side to 8001
```

Start it:
```bash
docker compose up -d
```

Open `http://129.212.234.21:8001` and register your admin account.

## 2. Add your site

- Log in → click **+ Add a website**
- Domain: `reframevisuals.com`
- Click **Add site**

## 3. Generate a shared link for embedding

- Go to **reframevisuals.com > Settings > Visibility**
- Click **+ New link** under "Shared links"
- Name it `admin-embed` (no password needed — it's internal only)
- Copy the `?auth=XXXXX` token at the end of the shared URL

## 4. Set Coolify environment variables

In Coolify → your app → **Environment Variables**, add:

```
VITE_PLAUSIBLE_HOST=http://129.212.234.21:8001
VITE_PLAUSIBLE_DOMAIN=reframevisuals.com
VITE_PLAUSIBLE_SHARED_AUTH=XXXXX
```

Then redeploy. The Analytics page will show the live Plausible dashboard.

## 5. Add the tracking snippet to your site (optional)

The frontend auto-injects the script when `VITE_PLAUSIBLE_HOST` and `VITE_PLAUSIBLE_DOMAIN`
are set. It excludes `/admin/**` and `/login` routes automatically.

No manual changes to `index.html` needed.

## Notes

- The embed iframe uses Plausible's `embed.host.js` to auto-resize — do not use fixed height CSS.
- The shared link is read-only; it cannot be used to change Plausible settings.
- To update the period shown in the embed, use the period selector in the admin Analytics page header.
