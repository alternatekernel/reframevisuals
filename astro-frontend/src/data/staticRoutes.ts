import { INDUSTRY_PAGES, GEO_PAGES, CASE_STUDIES } from './expansionPages';

export type StaticRoute = { path: string; view: string; noindex?: boolean };

const direct: Record<string, string[]> = {
  "AboutPage": [
    "/about"
  ],
  "AboutReframeVisualsPage": [
    "/about-reframe-visuals"
  ],
  "ReframeVisualsServicesPage": [
    "/reframe-visuals-services"
  ],
  "HowItWorksPage": [
    "/how-it-works"
  ],
  "PlatformPage": [
    "/platform"
  ],
  "PolicyPage": [
    "/privacy",
    "/terms",
    "/cookies",
    "/security"
  ],
  "CaseStudiesHubPage": [
    "/case-studies"
  ],
  "ResourcesPage": [
    "/resources"
  ],
  "ComparisonPage": [
    "/pixelz-alternative",
    "/clipping-path-india-alternative",
    "/cutoutwiz-alternative"
  ]
};

export const STATIC_ROUTES: StaticRoute[] = [
  ...Object.entries(direct).flatMap(([view, paths]) => paths.map((path) => ({ path, view }))),
  ...["quality-assurance-process", "turnaround-sla", "who-is-reframe-visuals", "reframe-visuals-brand-facts", "free-sample-edit", "reframe-visuals-pricing", "reframe-visuals-reviews", "reframe-visuals-for-shopify-brands", "reframe-visuals-for-amazon-sellers"].map((s) => ({ path: `/${s}`, view: 'InsightAndTrustPage' })),
  ...["amazon-image-compliance-checklist-2026", "shopify-product-photography-conversion-playbook", "ghost-mannequin-vs-flat-lay-when-to-use-each", "how-to-scale-photo-editing-for-10000-skus", "jewelry-retouching-quality-checklist", "ecommerce-image-sla-framework-for-growth-teams", "best-ecommerce-photo-editing-services-shopify-brands", "ghost-mannequin-editing-cost-guide", "background-removal-service-pricing-guide", "how-to-prepare-product-photos-for-amazon", "jewelry-retouching-checklist-for-ecommerce", "clipping-path-vs-background-removal", "in-house-vs-outsourced-product-photo-editing"].map((s) => ({ path: `/resources/${s}`, view: 'InsightAndTrustPage' })),
  ...[...INDUSTRY_PAGES, ...GEO_PAGES].map((p) => ({ path: p.path, view: 'ExpansionPage' })),
  ...CASE_STUDIES.map((c) => ({ path: c.path, view: 'CaseStudyDetailPage', noindex: true })),
];
