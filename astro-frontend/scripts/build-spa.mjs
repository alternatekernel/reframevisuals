import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';

execSync('npx vite build --config spa/vite.config.ts', { stdio: 'inherit' });
rmSync('public/spa-assets', { recursive: true, force: true });
mkdirSync('public/spa-assets', { recursive: true });
for (const entry of readdirSync('spa/dist')) {
  if (entry === 'spa') continue;
  cpSync(`spa/dist/${entry}`, `public/spa-assets/${entry}`, { recursive: true });
}
copyFileSync('spa/dist/spa/index.html', 'public/csr-shell.html');
const shell = readFileSync('public/csr-shell.html', 'utf8').replace('<title>', '<script src="/security-bootstrap.js" defer></script>\n    <title>');
writeFileSync('public/csr-shell.html', shell);
console.log('SPA built -> public/csr-shell.html + public/spa-assets/');
