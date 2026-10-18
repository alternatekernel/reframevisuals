import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Builds the admin / dashboard / auth SPA. Assets live under /spa-assets/ so they never
// collide with Astro's /_astro/ output; spa/index.html becomes public/csr-shell.html.
export default defineConfig({
  root,
  base: '/spa-assets/',
  plugins: [react()],
  publicDir: false,
  envPrefix: ['VITE_', 'PUBLIC_'],
  build: {
    outDir: 'spa/dist',
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: 'esbuild',
    rollupOptions: { input: 'spa/index.html' },
  },
});
