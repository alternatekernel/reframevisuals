import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import '../styles/global.css'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// When the Express server rendered this page with the SSR bundle it marks the
// root container with data-ssr="true"; hydrate that markup instead of
// re-rendering from scratch. Build-time prerendered pages (Playwright) do not
// carry the marker and keep the original client-render path.
if (container.dataset.ssr === 'true' && container.firstElementChild) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}

// ---------------------------------------------------------------------------
// Umami Analytics — privacy-first, no cookies, GDPR compliant.
// Uses Vite env vars (import.meta.env) so no inline <script> is needed in
// index.html, keeping the Content-Security-Policy free of 'unsafe-inline'.
// Set VITE_UMAMI_URL and VITE_UMAMI_WEBSITE_ID in Coolify env vars to activate.
// ---------------------------------------------------------------------------
;(() => {
  const umamiUrl = import.meta.env.VITE_UMAMI_URL as string | undefined
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined
  if (!umamiUrl || !websiteId) return
  // Skip tracking for admin/dashboard routes
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')) return
  const s = document.createElement('script')
  s.defer = true
  s.src = umamiUrl.replace(/\/$/, '') + '/script.js'
  s.setAttribute('data-website-id', websiteId)
  s.setAttribute('data-domains', 'reframevisuals.com')
  s.setAttribute('data-exclude-search', 'true')
  document.head.appendChild(s)
})()
