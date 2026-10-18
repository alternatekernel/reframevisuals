import { defineConfig, sessionDrivers } from 'astro/config';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';
import { copyFileSync, rmSync } from 'node:fs';
import emdash, { s3 } from 'emdash/astro';
import { postgres } from 'emdash/db';

// EmDash CMS (Postgres + S3-compatible storage, e.g. Supabase). Off unless EMDASH_DATABASE_URL is set.
const EMDASH_ON = Boolean(process.env.EMDASH_DATABASE_URL);

// Anything importing 'emdash' needs the integration's virtual modules, so those files are generated per mode.
copyFileSync(EMDASH_ON ? 'emdash/cms-emdash.on.ts' : 'emdash/cms-emdash.off.ts', 'src/lib/cms-emdash.ts');
if (EMDASH_ON) copyFileSync('emdash/live.config.ts.template', 'src/live.config.ts');
else rmSync('src/live.config.ts', { force: true });

// The EmDash admin ships Tailwind 4 CSS, which our Tailwind 3 pipeline rejects. Run our PostCSS chain on everything except it.
const siteCss = {
  postcssPlugin: 'site-css-without-emdash',
  async Once(root, { result }) {
    const from = result.opts.from ?? '';
    if (from.includes('@emdash-cms')) return;
    const out = await postcss([tailwindcss, autoprefixer]).process(root.toString(), { from, map: false });
    root.removeAll();
    root.append(postcss.parse(out.css, { from }).nodes);
  },
};

const SITE = process.env.PUBLIC_SITE_URL || 'https://reframevisuals.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: vercel(),
  // EmDash keeps admin sign-ins in the Astro session; Vercel has no built-in driver, so use Redis (e.g. Upstash).
  ...(EMDASH_ON && process.env.REDIS_URL ? { session: { driver: sessionDrivers.redis({ url: process.env.REDIS_URL }) } } : {}),
  integrations: [
    react(),
    ...(EMDASH_ON ? [emdash({ database: postgres({ connectionString: process.env.EMDASH_DATABASE_URL, ssl: true }), storage: s3({}) })] : []),
    sitemap({ filter: (page) => !page.includes('/case-studies/') && !page.endsWith('/404') })],
  vite: {
    css: { postcss: { plugins: [siteCss] } },
    resolve: {
      alias: {
        'react-router-dom': fileURLToPath(new URL('./src/shims/react-router-dom.tsx', import.meta.url)),
        'react-helmet-async': fileURLToPath(new URL('./src/shims/react-helmet-async.tsx', import.meta.url)),
      },
    },
    envPrefix: ['VITE_', 'PUBLIC_'],
    ssr: { noExternal: ['framer-motion', 'lucide-react', 'hugeicons-react'] },
  },
});
