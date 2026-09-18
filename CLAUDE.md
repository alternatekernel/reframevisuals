# Reframe Visuals — Project Rules for Agents

## What this project is

A **marketing website** for Reframe Visuals (photo editing SaaS), built with Astro on Vercel.

This site is **marketing only** — no customer dashboard, no order flow, no login/signup. Customers contact via email or book a meeting. The customer dashboard lives in a separate Next.js application.

---

## How to work on this project

### Always follow this order. Never skip phases.

**Phase 1 — Design System (do this first)**
- All visual work starts in `src/styles/tokens.css` and `tailwind.config.mjs`
- Every color, shadow, font size, spacing, and radius must be a named token
- Never write a raw hex value or arbitrary pixel size in a component — use a token
- After adding tokens, run `npm run dev` and visually check before moving on

**Phase 2 — Components (only after design system is stable)**
- Build components inside `src/components/`
- Every component must use tokens from `src/styles/tokens.css` and patterns from `src/styles/patterns.css`
- Before writing a new component, check `src/components/` — it may already exist
- Check `src/docs/component-map.md` to see which components belong to which pages

**Phase 3 — Pages (only after components are verified)**
- Before building any page, read its spec in `src/docs/page-specs/[page-name].md`
- That file lists exactly which components to use and in what order
- Do not invent new layouts — follow the spec

---

## What is IN scope (marketing pages only)

```
/                          Homepage
/about
/services                  Hub page
/services/[category]/[slug]  Individual service pages
/pricing
/portfolio
/case-studies
/case-studies/[slug]
/blog
/blog/[slug]
/how-it-works
/ai-product-visuals
/platform
/resources
/compare/[slug]
/free-trial                 Email/contact form (no account creation)
/book-meeting               Calendar booking
/contact
/support
/legal/privacy
/legal/terms
/legal/cookies
/trust/quality-assurance
/trust/turnaround-sla
/[...slug]                  CMS / expansion / geo pages
```

## What is OUT of scope (lives in the Next.js dashboard app)

- `/dashboard` and all dashboard views
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/jobs/*` (order creation flow)
- `/order/*`
- `/quote-builder`
- `/pilot-batch`
- Customer account management

---

## Component rules

**Pure Astro (no JavaScript)** — use for all marketing components:
- Navigation, footer, cards, buttons, badges, section labels, testimonials, FAQs, feature lists
- Use `<details>`/`<summary>` for accordions — no JS needed
- Use CSS `@keyframes` with a small inline `<script>` for scroll-triggered entrance animations

**React islands (use sparingly)** — only when truly needed:
- Hero carousel (drag interaction)
- Before/after image slider (drag interaction)
- Book meeting form (date/time picker state)
- Contact / free trial form (form validation state)
- Cookie consent banner
- Lead magnet popup
- Floating chat widget (ReframeCS)

When mounting a React island, use the laziest directive that works:
- `client:load` — must work immediately (forms above the fold)
- `client:visible` — can wait until scrolled into view (sliders, carousels)
- `client:idle` — non-critical (cookie banner, chat widget, popups)

---

## Content rules

- Blog posts: `src/content/blog/` — `.mdx` files
- Case studies: `src/content/case-studies/` — `.mdx` files
- Service pages: `src/content/services/` — `.json` files (block-based)
- FAQs: `src/content/faqs/` — `.json` files
- All schemas are in `src/content.config.ts` — never add a field without updating the schema

---

## Routing rules

- Service URLs: `/services/[category]/[slug]` — never flat `/services/[slug]`
- Policy pages: `/legal/privacy`, `/legal/terms`, `/legal/cookies`
- No auth gating on any page — this is a public marketing site
- Cross-domain link to the Next.js dashboard: use `https://app.reframevisuals.com` (or configured env var `PUBLIC_APP_URL`)

---

## SEO and GEO rules

- Every page must use `<PageSEO>` with `title`, `description`, and `canonical`
- Every page must include `<JsonLd>` structured data
- Service pages emit: `Service` + `FAQPage` + `BreadcrumbList`
- Blog posts emit: `BlogPosting` + `BreadcrumbList`
- Keep `public/llms.txt` updated when major content changes

---

## File locations

| What | Where |
|---|---|
| Design tokens | `src/styles/tokens.css` |
| Tailwind extensions | `tailwind.config.mjs` |
| Reusable CSS patterns | `src/styles/patterns.css` |
| All components | `src/components/` |
| Content files | `src/content/` |
| Content schemas | `src/content.config.ts` |
| Block type definitions | `src/types/blocks.ts` |
| Page spec documents | `src/docs/page-specs/` |
| Component map | `src/docs/component-map.md` |
| API routes | `src/pages/api/` |

---

## Development commands

```
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview production build locally
```

---

## Docs

- Astro: https://docs.astro.build
- Routing: https://docs.astro.build/en/guides/routing/
- Components: https://docs.astro.build/en/basics/astro-components/
- React islands: https://docs.astro.build/en/guides/framework-components/
- Content collections: https://docs.astro.build/en/guides/content-collections/
- Tailwind in Astro: https://docs.astro.build/en/guides/styling/
