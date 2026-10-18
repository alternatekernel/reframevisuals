import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';

const SITE = process.env.PUBLIC_SITE_URL || 'https://reframevisuals.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: vercel(),
  integrations: [react(), sitemap()],
  vite: {
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
