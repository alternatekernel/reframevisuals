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

## Pure Astro conversion (status: public site is 100% Astro)
**Every public page is a real `.astro` page with no React.** React remains only in (a) the chat assistant (ReframeCS + order flow), (b) the isolated admin/dashboard/login SPA (`spa/`, built to `public/csr-shell.html`), and (c) the EmDash admin when enabled.

**How**: `scripts/codemod-astro.mjs` converted the stateless sections/views; everything with state was ported by hand to `.astro` markup plus a small vanilla module in `src/lib/ui/` (one `<script>` import per component, bundled by Vite, no framework):
`accordion`, `currency` (+ `currency-selector`), `forms` (email inquiry posts to `/api/portal/inquiry`), `drop-zone` (home + `/start`, multipart `/api/portal/freetrial`), `free-trial` (direct upload then `/api/portal/freetrial`), `pilot-batch`, `book-meeting`, `contact`, `quote-builder`, `before-after` (sweep animation, sequence mode, drag), `service-detail`, `pricing-table`, `expand`, `count-up`, `testimonials` (marquee clones, modal, `/api/portal/feedback`), `workflow` (SVG connectors on resize), `hero` (spring-physics carousel, headline rotation), `cs-showcase`, `image-grid`, `blog-listing`, `blog-post` (progress, TOC, prefs, save/share/copy, newsletter), `ft-success`, `links`.
Blog markdown is rendered on the server (`src/lib/markdown.ts`: remark + rehype, same element classes as the old react-markdown components; reader prefs are CSS variables).

**Rendering model**
- Prerendered at build: all static marketing pages, service intent pages, comparisons, case studies, policy pages (about 60 routes).
- Server-rendered with `Cache-Control: s-maxage=300, stale-while-revalidate=3600`: `/`, `/services`, `/pricing`, `/services/:id`, `/blog`, `/blog/:slug`, `/p/:slug`, `sitemap-blog.xml`. They read content through `src/lib/content.ts`, `serviceData.ts`, `blogSeed.ts` (3s/8s timeouts, bundled defaults as fallback), so an admin/EmDash edit shows within 5 minutes without a deploy.
- Navigation/footer content on the prerendered pages is baked at build time (refresh needs a redeploy or Vercel ISR); on server-rendered pages it follows the 5 minute cache.
- `/blog/topic/:t` and `/blog/series/:s` are now real 301 redirects to `/blog?topic=` / `?series=` (the React view redirected client-side).

**JavaScript per page (before -> after)**: static pages 985 KB -> 42 KB; `/pricing` 734 KB -> 46 KB; `/services` 702 KB -> 44 KB; home about 1 MB -> 56 KB; forms about 50 KB. `/contact` still loads the chat bundle (about 880 KB) because the live chat is embedded in the page.

**Pixel parity** (`scripts/diff-shots.mjs`, 1440 and 390, vs a local build of the original): 27 routes, worst 0.46% (marquee/carousel animation phase, live chat). Static pages: `/start`, `/free-trial`, `/pilot-batch` are 0.00%. Interaction tests: `scripts/nav-test.mjs` (18 checks) and `scripts/ui-test.mjs` (about 60 checks: accordion, pricing table, before/after drag, hero carousel, currency, every form payload, drop-zone upload, testimonials modal, blog tools). Server-rendered routes are captured/tested against `astro dev` (`--url`/`ASTRO_URL`).

**Tools**: `capture.mjs` (`--url` for a running server), `diff-shots.mjs`, `diff-bands.mjs` (where a diff is), `crop-pair.mjs`, `geom-diff.mjs`, `js-weight.mjs`, `nav-test.mjs`, `ui-test.mjs`, `check-meta.mjs` (zero title/description diffs vs production meta), `unused.mjs` (dead-file finder).

**Deliberate behavior differences (please review)**
1. Contact popover validation/network errors show an inline message instead of the React modal (`showAlert`).
2. Nav/footer/CTA buttons detect login from `localStorage` after load (`portal_token`, `reframe-current-user`) and confirm with `GET /portal/auth/me`; first paint is always signed-out (same for the pilot-batch banner, pricing/bundle/about CTA labels).
3. Footer mobile link groups use native `<details name>`; FAQs use `data-acc-*` grid-rows panels.
4. Entrance animations are CSS transitions (same end states); the hero intro runs once per session (flag set by an inline script) like before.
5. The chat is not hydrated until first interaction, so before that the floating bar shows its server-rendered collapsed state (no typed placeholder). On `/contact` the embedded chat hydrates when scrolled into view.
6. Boot loader remains off by default.
7. Product cards on `/services` and the hero carousel: each card is a real link instead of an `onClick` div.
8. Blog listing filters/sort/search are URL driven and server-filtered (live search debounces then replaces the URL); "Load more" reveals already-rendered posts.

**Bugs found in the original while porting (not changed in `frontend/`)**
- `frontend/index.html` has an unclosed `<a>` skip link, so the plain SPA shell nests the whole app in a 1px clipped anchor (production avoids it by serving prerendered HTML).
- `/free-trial` collects "Support / Reference Files" but never uploads or sends them. Ported as-is; say if they should be uploaded with `category=support` like `/pilot-batch` does.
- `/blog/:slug` sub-form "Was this useful?", the resource buttons and the newsletter topic chips have no handlers (kept as inert UI).
- Codemod bug fixed along the way: `key={`...${x}`}` removal produced a broken attribute (it dropped `class` on service process steps).

**Remaining React on purpose**: chat widget + embedded chat (`src/islands/ChatIsland.tsx`, `wrapped/EmbeddedChat.tsx`, `components/ReframeCS.tsx`, with the `routed()`/`Providers` shims), the admin SPA (`src/spa`, `src/admin`, `src/spa-pages`), dashboard components. Content for CMS-driven sections still comes from the existing API (EmDash site-sections wiring is not done).
