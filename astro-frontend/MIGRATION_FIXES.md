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
