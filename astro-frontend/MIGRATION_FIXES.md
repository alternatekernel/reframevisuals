# Migration fixes and open items

Parity baseline = `SEO_META_BY_PATH` / `resolvePageSeo` copied into `src/data/seoMeta.ts` (live site unreachable from the build container).

## Proposed fixes (need your OK; not applied)
1. `/privacy`, `/terms`, `/cookies`, `/security`, `/how-it-works`, `/platform`, `/about-reframe-visuals`, `/reframe-visuals-services`, InsightAndTrust pages and more are not in `SEO_META_BY_PATH`, so production's server HTML gets the generic fallback title ("Reframe Visuals | Professional Photo Editing Services..."). Their React views set better titles via Helmet, but only after hydration. Proposal: use the view's own title/description at build time.
2. Expansion pages: map title ("Amazon Product Image Editing | Reframe Visuals") differs from the page data title ("...& Compliance Service | Reframe Visuals"). Currently using the map for parity.

## Known gaps (not yet ported)
- Boot loader, Lenis scroll wiring, ContinueBrowsing, CookieConsent, ReframeCS assistant widget.
- Test site is `noindex` on every page (set `PUBLIC_NOINDEX=false` to lift at cutover).
- Views currently hydrate with `client:load` so Framer Motion entrance animations run; JS trimming is Phase 9.
- Screenshot baselines need either the live site or a local build of `frontend/`.

## Update
- Applied (you approved): pages missing from the map now use their own Helmet title/description, collected at build time (`src/lib/collectHead.tsx`).
- Boot loader ported but OFF by default (`PUBLIC_BOOT_LOADER=true` enables): with pre-rendered HTML it would cover content that already painted and hurt LCP. Your call at review.
- Lenis now initialises once from `src/lib/lenis.ts` (the SPA created one per provider tree).
- Structured data parity: Express injected FAQPage/Organization/WebSite/Service/ItemList JSON-LD for `/` and `/services/*` (index.ts L1342-1693); Astro currently only has what each view's Helmet emits. Still to port.
- Still to build: blog (SSR), `/p/:slug`, conversion pages, SPA embedding, sitemap/robots/llms, `/api` rewrite (needs the production API host).

## Build status (end of build phase)
- Done: 115 sitemap URLs / ~117 static pages, SSR blog + topic + series + `/p/:slug` (cache `s-maxage=300, swr=3600`, 404 for unknown), conversion pages, admin/dashboard/auth SPA (`src/spa`, built by `scripts/build-spa.mjs` into `public/csr-shell.html` + `public/spa-assets/`), robots/sitemap/llms, redirects/rewrites/headers in `vercel.json`.
- Checks: `node scripts/check-meta.mjs` (39 mapped routes, 0 diffs; `/contact-us`, `/order/dedicated`, `/blog` are not static files), `node scripts/smoke.mjs [paths]` (Chromium load + console errors + screenshots to `tests/shots/`).
- Fixes applied: hydration mismatch on `/contact` (`new Date()` inside JSON-LD; script tags now `suppressHydrationWarning`); duplicate `/theme`+`/sections` requests across islands deduped via in-flight GET sharing in `src/services/api.ts`.

## Vercel project setup (you)
Root Directory `astro-frontend`; env vars: `PUBLIC_SITE_URL` (test domain, https), `PUBLIC_NOINDEX=true`, `API_BASE=https://reframevisuals.com/api`, `VITE_API_URL=/api`, `VITE_GOOGLE_CLIENT_ID` (same as production). `/api/*` is rewritten to the production API, so no CORS change is needed.

## Not done / needs a decision
- Visual parity: only spot-checked in Chromium (design renders correctly); no pixel diff vs production (live site unreachable from the build container).
- Blog seed ships full post bodies as island props on blog pages (payload cost); candidate for Phase 9.
- `/contact-us` has an SEO map entry but no route in the SPA either; left unrouted.
- Landing/service JSON-LD uses each view's own output (you chose "Astro default").
- Cutover (Phase 10) untouched: Express HTML/SEO code, `ssrRenderer.ts`, root `vercel.json` all still in place.

## EmDash CMS (blog, pages; sections not yet)
- Integration is opt-in: set `EMDASH_DATABASE_URL` (+ `REDIS_URL`, `S3_*`) and the build adds EmDash (admin at `/_emdash/admin`); unset, the site uses the REST API / bundled posts exactly as before. Both modes build.
- Content layer `src/lib/cms.ts`: posts feed the blog pages, topic/series pages and `sitemap-blog.xml`; `pages` feed `/p/:slug`. Fields are in `scripts/build-emdash-seed.ts` (post body is a Markdown `text` field so the existing renderer keeps working; switching to rich text later needs a Markdown to Portable Text conversion).
- Setup order: `CREATE SCHEMA IF NOT EXISTS emdash;` in Supabase, set the env vars in Vercel, `npx tsx scripts/build-emdash-seed.ts`, `node scripts/export-prod-content.mjs --pages slug1,slug2` (needs production API access), then `npx emdash seed seed/emdash.json` against the same env, then open `/_emdash/admin` to create the first user (passkey sign-in).
- Gotchas found: EmDash admin sign-in needs a session driver and Vercel has none, so Redis is required; the EmDash admin CSS is Tailwind 4, so `astro.config.mjs` runs our Tailwind 3 chain on everything except `@emdash-cms`; files importing `emdash` are generated per mode (`emdash/*.template`, git-ignored outputs) because its virtual modules only exist when the integration is on.
- Not verified: a real Supabase connection, migrations, admin login, and the seed run (no credentials or network here). Site sections (`/api/sections` into `site_sections`) are modelled in the seed but not wired into the pages yet; the old admin stays the source for them until then.

## Pure Astro conversion (progress)
**Method**: `scripts/codemod-astro.mjs` converts stateless React sections/views to `.astro` (Framer entrance props become `data-reveal` + `src/styles/reveal.css` + `src/lib/reveal.ts`; `<Button asChild>` links become `<a class={buttonVariants(..)}>`; routing hooks become `Astro.url`/`Astro.params`). `scripts/fix-astro-imports.mjs` wires imports and wraps still-interactive children as provider islands. Files with state/handlers are skipped and stay React.

**Converted to `.astro` (about 40 files)**: About, AboutReframeVisuals, ReframeVisualsServices, Platform, Policy, CaseStudiesHub, Comparison, Expansion, Resources, Portfolio, Testimonials, ServiceIntent, ServiceComparison, NotFound + their sections (about/*, portfolio/*, pricing Trust/Policies/Bundles, services CTA/Hero/Scope/..., Integrations, PreFooter, TargetAudienceProof, ...).
**Shell now server-rendered, no React**: Navigation (`Navigation.astro` + `src/lib/nav.ts`), Footer (`Footer.astro`), ContinueBrowsing, cookie banner (`CookieBanner.astro` + `src/lib/cookie-banner.ts`), logo/social icons, reveal animations, smooth scroll. Chat widget hydrates lazily via the custom `client:interaction` directive (first pointer/focus/keyboard on it, the `reframe-cs:open` event, or after 15s). Currency selector only loads on `/pricing`.
**Result**: `/privacy` ships 41 KB of JS and no React (was about 985 KB); pages that are still React views (forms, pricing, services lists, home, blog post) still load React for their own islands.

**Tools**: `capture.mjs` + `diff-shots.mjs` (pixel diff vs a local build of the original `frontend/`; tall pages are captured in chunks because Chromium cannot rasterize more than 16384px), `geom-diff.mjs` (element geometry), `js-weight.mjs`, `nav-test.mjs` (18 interaction checks), `check-meta.mjs`, `check-live.mjs`.

**Deliberate behavior differences (please review)**
1. Contact popover validation/network errors show an inline message instead of the React modal (`showAlert`).
2. Footer CTA and nav detect login from `localStorage` (`portal_token`, `reframe-current-user`) and confirm with `GET /portal/auth/me` like the React provider; the very first paint is always the signed-out state.
3. Footer mobile link groups use native `<details name>` (exclusive accordion) instead of React state.
4. Entrance animations use CSS transitions (0.5s ease-out) instead of Framer springs/easing; end states are identical.
5. Chat widget bar is server-rendered but inert until first interaction (about one extra tap latency the first time).
6. Boot loader remains off by default.

**Found in the original (not touched)**: `frontend/index.html` has an unclosed `<a>` skip link, so the plain SPA shell nests the whole app in a 1px clipped anchor (production avoids it by serving prerendered HTML). Worth fixing there separately.

**Still React (needs per-component work)**: home page sections (Hero, Services, Pricing, Testimonials, Workflow, ImageGrid, InstantDropZone, Stats, Faq...), Pricing page table/FAQ/CTA, services list/detail, forms (FreeTrial, Start, QuoteBuilder, PilotBatch, BookMeeting, Contact), blog listing/post/topic/series, AI product visuals, HowItWorks, InsightAndTrust, CaseStudyDetail. Content for CMS-driven sections still comes from the React ContentProvider defaults (EmDash sections wiring not done).
