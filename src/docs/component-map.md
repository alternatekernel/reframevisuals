# Component Map — Which components go on which pages

This document is the source of truth for page composition.
Before building any page, read its row here first.

---

## Shared on every page

- `layouts/BaseLayout.astro` — HTML shell, head, global CSS, Organization JSON-LD
- `layouts/PageLayout.astro` — wraps BaseLayout with Nav + Footer
- `components/seo/PageSEO.astro` — title, meta, canonical, og tags
- `components/JsonLd.astro` — structured data injection
- `components/nav/Nav.astro` — top navigation
- `components/nav/Footer.astro` — footer with link groups

---

## Homepage `/`

| Component | Purpose |
|---|---|
| `hero/HeroCarousel.astro` | Draggable before/after card carousel |
| `common/ScrollReveal.astro` | Entrance animations wrapper |
| `sections/Testimonials.astro` | Client quotes |
| `sections/Workflow.astro` | How it works steps |
| `sections/ReframeCSShowcase.astro` | Case study highlights |
| `ui/AuraBlob.astro` | Ambient gradient background blobs |
| `ui/DotBackground.astro` | Decorative dot grid |
| `widgets/ChatWidget.astro` | Floating CS chat (client:idle) |

---

## Services Hub `/services`

| Component | Purpose |
|---|---|
| `ui/Frame.astro` | Decorative frame on hero area |
| `sections/services/ServicesList.astro` | Grid of all service cards |
| `ui/Button.astro` | CTAs |
| `sections/Testimonials.astro` | Social proof |

---

## Service Category Hub `/services/[category]`

| Component | Purpose |
|---|---|
| `common/CategoryDivider.astro` | Section label |
| `sections/services/ServicesList.astro` | Filtered service cards |
| `ui/Badge.astro` | Category label chip |
| `ui/Button.astro` | CTA |

---

## Service Detail `/services/[category]/[slug]`

| Component | Purpose |
|---|---|
| `sections/services/ServiceHero.astro` | Hero with headline + CTA |
| `sections/services/ServiceCapabilities.astro` | Feature list |
| `sections/services/ServiceConversion.astro` | Mid-page CTA |
| `before-after/BeforeAfterCard.astro` | Interactive before/after (client:visible) |
| `sections/services/ServiceDetailInteractive.astro` | Variant switcher + autoplay (client:visible) |
| `sections/services/ServiceFaq.astro` | FAQ accordion + FAQPage JSON-LD |
| `sections/services/ServiceFinalCTA.astro` | Bottom CTA |
| `blocks/HowToBlock.astro` | Step-by-step (from JSON content) |
| `blocks/PricingBlock.astro` | Pricing (from JSON content) |
| `common/ContinueBrowsing.astro` | Related page links |

---

## Pricing `/pricing`

| Component | Purpose |
|---|---|
| `sections/pricing/PricingTable.astro` | Main pricing table |
| `sections/pricing/PricingBundles.astro` | Bundle cards |
| `sections/pricing/BundleCard.astro` | Individual bundle |
| `sections/pricing/PricingPolicies.astro` | Policy notes |
| `sections/pricing/PricingFaq.astro` | FAQ section |
| `sections/pricing/PricingCTA.astro` | Bottom CTA |
| `sections/pricing/CompetitorComparison.astro` | Comparison table |
| `sections/Testimonials.astro` | Social proof |

---

## Portfolio `/portfolio`

| Component | Purpose |
|---|---|
| `sections/portfolio/PortfolioHero.astro` | Hero |
| `sections/portfolio/PortfolioAbout.astro` | About section |
| `before-after/BeforeAfterCard.astro` | Interactive examples (client:visible) |
| `ui/Frame.astro` | Decorative framing |

---

## Case Studies Hub `/case-studies`

| Component | Purpose |
|---|---|
| `sections/ReframeCSShowcase.astro` | Featured case studies |
| `ui/Badge.astro` | Industry labels |
| `ui/Button.astro` | View case study CTAs |

---

## Case Study Detail `/case-studies/[slug]`

| Component | Purpose |
|---|---|
| `common/ScrollReveal.astro` | Entrance animations |
| `before-after/BeforeAfterCard.astro` | Result showcase (client:visible) |
| `ui/Button.astro` | CTAs to free trial and book meeting |
| `common/ContinueBrowsing.astro` | Related case studies |

---

## Blog Hub `/blog`

| Component | Purpose |
|---|---|
| `sections/insights/InsightsHero.astro` | Hero |
| `sections/insights/InsightsGrid.astro` | Post grid |
| `sections/insights/InsightsCTA.astro` | Subscribe/contact CTA |

---

## Blog Post `/blog/[slug]`

| Component | Purpose |
|---|---|
| `blog/BlogPost.astro` | MDX content renderer |
| `ui/Badge.astro` | Topic tag |
| `ui/AnswerCapsule.astro` | Key answer block for AI parsers |
| `common/ContinueBrowsing.astro` | Related posts |
| `sections/insights/InsightsCTA.astro` | Bottom CTA |

---

## How It Works `/how-it-works`

| Component | Purpose |
|---|---|
| `sections/Workflow.astro` | Step-by-step process |
| `sections/Integrations.astro` | Platform integrations |
| `before-after/BeforeAfterCard.astro` | Visual example (client:visible) |
| `ui/Button.astro` | CTA |

---

## AI Product Visuals `/ai-product-visuals`

| Component | Purpose |
|---|---|
| `common/ScrollReveal.astro` | Entrance animations |
| `sections/Workflow.astro` | Process steps |
| `sections/Testimonials.astro` | Social proof |
| `before-after/BeforeAfterCard.astro` | Before/after examples (client:visible) |
| `ui/Button.astro` | CTAs |

---

## Free Trial `/free-trial`

| Component | Purpose |
|---|---|
| `ui/Frame.astro` | Decorative frame |
| `ui/AuraBlob.astro` | Background glow |
| `react/FreeTrialForm.tsx` | File upload + email form (client:load) |

---

## Book Meeting `/book-meeting`

| Component | Purpose |
|---|---|
| `ui/Frame.astro` | Decorative frame |
| `ui/AuraBlob.astro` | Background glow |
| `react/BookMeetingForm.tsx` | Date/time picker form (client:load) |

---

## Contact `/contact`

| Component | Purpose |
|---|---|
| `react/ContactForm.tsx` | Contact form (client:load) |
| `ui/Button.astro` | Email + book meeting links |

---

## About `/about`

| Component | Purpose |
|---|---|
| `sections/about/AboutCTA.astro` | CTA section |
| `sections/about/AboutExpertise.astro` | Expertise section |
| `sections/about/AboutFAQ.astro` | FAQ section |
| `sections/about/AboutPhilosophy.astro` | Philosophy section |

---

## Platform `/platform`

| Component | Purpose |
|---|---|
| `sections/Integrations.astro` | Integration logos and descriptions |
| `ui/Button.astro` | CTAs |

---

## Compare `/compare/[slug]`

| Component | Purpose |
|---|---|
| `sections/services/ServicesList.astro` | Related services |
| `ui/Button.astro` | CTA to free trial |

---

## Legal pages `/legal/*`

| Component | Purpose |
|---|---|
| `common/ScrollReveal.astro` | Entrance |
| Markdown content rendered inline | Policy body |

---

## Trust pages `/trust/*`

| Component | Purpose |
|---|---|
| `ui/AnswerCapsule.astro` | Key answer blocks |
| `common/ScrollReveal.astro` | Entrance |
| `ui/Button.astro` | CTA |

---

## Catch-all `[...slug]` (expansion / geo / CMS pages)

| Component | Purpose |
|---|---|
| `blocks/BlockRenderer.astro` | Renders typed block array from content |
| `sections/Testimonials.astro` | Social proof |
| `ui/Button.astro` | CTAs to free trial / book meeting |
| `sections/services/ServiceFinalCTA.astro` | Bottom CTA |

---

## Widgets (present on all or most pages)

| Component | Directive | Purpose |
|---|---|---|
| `widgets/ChatWidget.astro` | `client:idle` | Floating CS chat |
| `widgets/FeedbackWidget.astro` | `client:idle` | Feedback button |
| `common/LeadMagnet.astro` | `client:idle` | Exit-intent popup |
| `common/CookieConsent.astro` | `client:idle` | Cookie banner |
| `common/MobileStickyContact.astro` | static | Fixed bottom bar on mobile |
