# Section Map — Reframe Visuals Astro

Every reusable section pre-built before page assembly.
All sections consume only CSS custom properties from `tokens.css` + pattern classes from `patterns.css`.
Changing a token updates every section that uses it.

---

## Design system wiring contract

Every section must follow these rules so token changes propagate:

| Rule | Details |
|---|---|
| Colors | Only `var(--brand)`, `var(--color-text-*)`, `var(--color-bg-*)`, `var(--cat-*)`, etc. Never raw hex |
| Typography | Only `var(--font-heading)`, `var(--font-body)`, `var(--text-*)` scale vars |
| Shadows | Only `var(--shadow-card)`, `var(--shadow-hover)` etc. |
| Radius | Only `var(--radius-card)`, `var(--radius-pill)` etc. |
| Transitions | Only `var(--transition-fast)`, `var(--transition-base)`, `var(--transition-slow)` |
| Spacing | Prefer `--space-*` tokens; fallback to `rem` multiples of 0.25 |
| Motion | IntersectionObserver `.reveal` / `.reveal-left` / `.reveal-scale` classes — no framer-motion |
| Buttons | `.btn-primary`, `.btn-secondary`, `.btn-brand`, `.btn-brand-outline` pattern classes |
| Cards | `.card-surface`, `.card-feature`, `.card-dark` pattern classes |
| Badges | `.badge`, `.badge-brand` pattern classes |

---

## Section inventory

### GLOBAL (used on 3+ pages)

| File | Source | Used on |
|---|---|---|
| `sections/global/SectionHero.astro` | custom | homepage, services, pricing, portfolio, insights, about, how-it-works |
| `sections/global/StatsBar.astro` | `Stats.tsx` | homepage, about, how-it-works |
| `sections/global/Testimonials.astro` | `Testimonials.tsx` | homepage, portfolio, pricing, service detail |
| `sections/global/Workflow.astro` | `Workflow.tsx` | homepage, how-it-works, service detail |
| `sections/global/Integrations.astro` | `Integrations.tsx` | homepage, how-it-works, platform |
| `sections/global/PreFooterCTA.astro` | `PreFooter.tsx` | homepage, pricing, services, about, portfolio |
| `sections/global/Faq.astro` | `Faq.tsx` | homepage, pricing, services, about |
| `sections/global/ClientCategoryStrip.astro` | `ClientCategoryStrip.tsx` | homepage, services |
| `sections/global/InsightsPreview.astro` | `InsightsPreview.tsx` | homepage, services hub, about |
| `sections/global/ReframeCSShowcase.astro` | `ReframeCSShowcase.tsx` | homepage, platform, how-it-works |
| `sections/global/AIProductShowcase.astro` | `AIProductShowcase.tsx` | homepage, ai-product-visuals |
| `sections/global/Ticker.astro` | `Ticker.tsx` | homepage, portfolio |
| `sections/global/BeatPixelzBanner.astro` | `BeatPixelzBanner.tsx` | homepage, pricing, compare pages |
| `sections/global/Differentiation.astro` | `Differentiation.tsx` | homepage, about, how-it-works |
| `sections/global/TargetAudienceProof.astro` | `TargetAudienceProof.tsx` | homepage, services hub |

---

### HOMEPAGE-SPECIFIC

| File | Source | Notes |
|---|---|---|
| `sections/home/HomepageHero.astro` | `Hero.tsx` | Rotating headlines, HeroCards carousel (React island) |
| `sections/home/InstantDropZone.astro` | `InstantDropZone.tsx` | Pure Astro drop-zone teaser (links to /free-trial) |
| `sections/home/ImageGridSection.astro` | `ImageGridSection.tsx` | Masonry image grid |

---

### SERVICES

| File | Source | Notes |
|---|---|---|
| `sections/services/ServicesHero.astro` | `ServicesHero.tsx` | Hub page hero |
| `sections/services/ServicesList.astro` | `ServicesList.tsx` | Grid of service cards linking to detail pages |
| `sections/services/ServiceHero.astro` | `ServiceHero.tsx` | Per-service hero — props: title, category, price, heroImage |
| `sections/services/ServiceCapabilities.astro` | `ServiceCapabilities.tsx` | What's included, use cases |
| `sections/services/ServicePricingBox.astro` | `ServicePricingBox.tsx` | Per-service price card with trial CTA |
| `sections/services/ServiceProcessSteps.astro` | `ServiceProcessSteps.tsx` | How the service works, step list |
| `sections/services/ServiceScope.astro` | `ServiceScope.tsx` | In/out scope checklist |
| `sections/services/ServicePrecision.astro` | `ServicePrecision.tsx` | Before/after + precision claims |
| `sections/services/ServiceBuyerAnswers.astro` | `ServiceBuyerAnswers.tsx` | GEO-optimized Q&A block |
| `sections/services/ServiceRelatedGuides.astro` | `ServiceRelatedGuides.tsx` | Related blog posts / case studies |
| `sections/services/ServiceConversion.astro` | `ServiceConversion.tsx` | Mid-page CTA strip |
| `sections/services/ServiceFaq.astro` | `ServiceFaq.tsx` | details/summary accordion |
| `sections/services/ServiceFinalCTA.astro` | `ServiceFinalCTA.tsx` | Bottom CTA — "Start with 3 free edits" |
| `sections/services/ServicesCTA.astro` | `ServicesCTA.tsx` | Hub bottom CTA |

---

### PRICING

| File | Source | Notes |
|---|---|---|
| `sections/pricing/PricingHero.astro` | `PricingHero.tsx` | Headline + price anchor badges |
| `sections/pricing/PricingTable.astro` | `PricingTable.tsx` | Full per-image price matrix |
| `sections/pricing/PricingBundles.astro` | `PricingBundles.tsx` | Volume bundle cards |
| `sections/pricing/PricingPilot.astro` | `PricingPilot.tsx` | $19 starter test batch callout |
| `sections/pricing/PricingPolicies.astro` | `PricingPolicies.tsx` | Revision, turnaround, refund policies |
| `sections/pricing/CompetitorComparison.astro` | `CompetitorComparison.tsx` | vs Pixelz, vs Remove.bg etc. |
| `sections/pricing/PricingFaq.astro` | `PricingFaq.tsx` | details/summary accordion |
| `sections/pricing/PricingCTA.astro` | `PricingCTA.tsx` | Bottom CTA |
| `sections/pricing/PricingTrust.astro` | `PricingTrust.tsx` | Trust icons strip (NDA, QA, revision) |

---

### PORTFOLIO

| File | Source | Notes |
|---|---|---|
| `sections/portfolio/PortfolioHero.astro` | `PortfolioHero.tsx` | B/A grid preview + category tabs |
| `sections/portfolio/PortfolioAbout.astro` | `PortfolioAbout.tsx` | Studio story callout |

---

### ABOUT

| File | Source | Notes |
|---|---|---|
| `sections/about/AboutHero.astro` | `AboutHero.tsx` | Mission statement + team photo |
| `sections/about/AboutPhilosophy.astro` | `AboutPhilosophy.tsx` | 3 pillars: human, quality, transparency |
| `sections/about/AboutExpertise.astro` | `AboutExpertise.tsx` | Services expertise grid |
| `sections/about/AboutScale.astro` | `AboutScale.tsx` | Numbers — images/month, editors, turnaround |
| `sections/about/AboutFAQ.astro` | `AboutFAQ.tsx` | details/summary accordion |
| `sections/about/AboutCTA.astro` | `AboutCTA.tsx` | Bottom CTA |

---

### INSIGHTS (BLOG)

| File | Source | Notes |
|---|---|---|
| `sections/insights/InsightsHero.astro` | `InsightsHero.tsx` | Featured post spotlight |
| `sections/insights/InsightsGrid.astro` | `InsightsGrid.tsx` | Post grid, category filter tabs |
| `sections/insights/InsightsCTA.astro` | `InsightsCTA.tsx` | Newsletter / contact CTA |

---

### FREE TRIAL / BOOK MEETING

| File | Source | Notes |
|---|---|---|
| `sections/freetrial/FreeTrialInfo.astro` | `FreeTrialInfo.tsx` | Left panel — what to expect |
| `sections/bookmeeting/BookMeetingInfo.astro` | custom | Left panel — meeting details |

---

### LANDING / COMPARISON (CMS-driven)

| File | Source | Notes |
|---|---|---|
| `sections/landing/LandingHero.astro` | `LandingPage.tsx` | CMS-driven landing hero |
| `sections/landing/ImageGridSection.astro` | `ImageGridSection.tsx` | Full-width image grid |

---

## React islands (still needed — interactive)

| File | Directive | Why React |
|---|---|---|
| `islands/HeroCarousel.tsx` | `client:visible` | Drag + spring physics |
| `islands/BeforeAfterSlider.tsx` | `client:visible` | Drag slider interaction |
| `islands/FreeTrialForm.tsx` | `client:load` | File upload + form state |
| `islands/ContactForm.tsx` | `client:load` | Form validation state |
| `islands/BookMeetingForm.tsx` | `client:load` | Date/time picker state |
| `islands/CookieConsent.tsx` | `client:idle` | Non-critical, deferred |
| `islands/ChatWidget.tsx` | `client:idle` | ReframeCS chat |
| `islands/FeedbackWidget.tsx` | `client:idle` | Global feedback popup |
| `islands/LeadMagnet.tsx` | `client:idle` | Exit-intent popup |

---

## Build priority order

### Tier 1 — Used on 4+ pages (build first)
1. `StatsBar` — numbers that anchor trust on every main page
2. `Testimonials` — marquee + expandable cards
3. `PreFooterCTA` — bottom-of-page conversion strip
4. `Faq` — generic accordion wrapper (reused everywhere)
5. `Workflow` — 4-step process diagram
6. `ClientCategoryStrip` — logo/category marquee
7. `Differentiation` — 3-column "why Reframe" block

### Tier 2 — Core page sections (build second)
8. `ServicesHero` + `ServicesList` (services hub)
9. `PricingTable` + `PricingBundles` + `CompetitorComparison`
10. `PortfolioHero` + `PortfolioAbout`
11. `HomepageHero` + `InsightsPreview`

### Tier 3 — Service detail sections (build with data-driven pages)
- `ServiceHero`, `ServiceCapabilities`, `ServiceScope`, `ServicePricingBox`, `ServiceFaq`, `ServiceFinalCTA`

### Tier 4 — Supporting sections
- About, Blog, Free Trial, Book Meeting, Integrations, ReframeCS, AI Showcase
