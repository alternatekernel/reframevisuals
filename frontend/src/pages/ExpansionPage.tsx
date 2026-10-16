import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { INDUSTRY_PAGES, GEO_PAGES, CASE_STUDIES } from '../data/expansionPages';
import { SERVICES } from '../data/services';
import { TESTIMONIALS } from '../data/testimonials';
import { Button } from '../components/ui/button';

const GEO_AREA_SERVED: Record<string, object> = {
  'us-photo-editing-service': { '@type': 'Country', name: 'United States' },
  'uk-photo-editing-service': { '@type': 'Country', name: 'United Kingdom' },
  'canada-photo-editing-service': { '@type': 'Country', name: 'Canada' },
  'australia-photo-editing-service': { '@type': 'Country', name: 'Australia' },
  'uae-photo-editing-service': { '@type': 'Country', name: 'United Arab Emirates' },
  'singapore-photo-editing-service': { '@type': 'Country', name: 'Singapore' },
};

// Which service IDs to show for each expansion page slug
const PAGE_SERVICES: Record<string, string[]> = {
  'amazon-product-image-editing':   ['background-removal', 'clipping-path', 'color-correction'],
  'shopify-product-photo-editing':  ['background-removal', 'color-correction', 'shadow-creation'],
  'woocommerce-product-image-editing': ['background-removal', 'clipping-path', 'garment-retouch'],
  'fashion-photo-retouching-service':  ['garment-retouch', 'ghost-mannequin', 'model-retouch'],
  'jewelry-photo-retouching-service':  ['jewelry-retouch', 'background-removal', 'color-correction'],
  'furniture-photo-editing-service':   ['background-removal', 'shadow-creation', 'color-correction'],
};
const GEO_SERVICE_IDS = ['background-removal', 'clipping-path', 'ghost-mannequin', 'jewelry-retouch', 'garment-retouch'];

// Which case study slugs to show for each expansion page
const PAGE_CASE_STUDIES: Record<string, string[]> = {
  'amazon-product-image-editing':   ['amazon-accessories-sku-cleanup', 'marketplace-compliance-recovery'],
  'shopify-product-photo-editing':  ['shopify-seasonal-launch-sprint'],
  'woocommerce-product-image-editing': ['shopify-seasonal-launch-sprint', 'multi-brand-color-consistency'],
  'fashion-photo-retouching-service':  ['fashion-drop-48-hour-turnaround', 'ghost-mannequin-scale-program'],
  'jewelry-photo-retouching-service':  ['jewelry-retouching-conversion-lift'],
  'furniture-photo-editing-service':   ['furniture-catalog-standardization'],
};

// Which testimonial indices to show for each page (from TESTIMONIALS array)
const PAGE_TESTIMONIALS: Record<string, number[]> = {
  'amazon-product-image-editing':   [1, 3],
  'shopify-product-photo-editing':  [0, 2],
  'woocommerce-product-image-editing': [0, 1],
  'fashion-photo-retouching-service':  [0, 3],
  'jewelry-photo-retouching-service':  [5, 2],
  'furniture-photo-editing-service':   [1, 3],
};

const OG_IMAGE = 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png';

const ExpansionPage = () => {
  const { pathname } = useLocation();
  const page = [...INDUSTRY_PAGES, ...GEO_PAGES].find((p) => p.path === pathname);

  if (!page) {
    return <div className="max-w-5xl mx-auto px-6 py-24">Page not found.</div>;
  }

  const canonical = `https://reframevisuals.com${page.path}`;
  const areaServed = GEO_AREA_SERVED[page.slug] ?? 'Worldwide';
  const isGeoPage = page.slug in GEO_AREA_SERVED;

  const serviceIds = PAGE_SERVICES[page.slug] ?? GEO_SERVICE_IDS;
  const relatedServices = serviceIds
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter(Boolean) as typeof SERVICES;

  const caseStudySlugs = PAGE_CASE_STUDIES[page.slug] ?? ['amazon-accessories-sku-cleanup', 'shopify-seasonal-launch-sprint'];
  const relatedCaseStudies = caseStudySlugs
    .map((slug) => CASE_STUDIES.find((c) => c.slug === slug))
    .filter(Boolean);

  const testimonialIndices = PAGE_TESTIMONIALS[page.slug] ?? [0, 1];
  const relatedTestimonials = testimonialIndices.map((i) => TESTIMONIALS[i]).filter(Boolean);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    description: page.description,
    provider: {
      '@type': 'Organization',
      '@id': 'https://reframevisuals.com/#organization',
      name: 'Reframe Visuals',
      url: 'https://reframevisuals.com',
    },
    areaServed,
    url: canonical,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0.39',
      highPrice: '4.00',
      availability: 'https://schema.org/InStock',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Photo Editing Services',
      itemListElement: relatedServices.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, description: s.description },
        price: s.price.toFixed(2),
        priceCurrency: 'USD',
      })),
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://reframevisuals.com/' },
      { '@type': 'ListItem', position: 2, name: page.h1, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.title} />
        <meta name="twitter:description" content={page.description} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <section className="max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <p className="text-xs uppercase tracking-[0.2em] text-black/45 mb-3">
          {isGeoPage ? 'Regional Solution' : 'Industry Solution'}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight mb-4">{page.h1}</h1>
        <p className="text-black/70 max-w-3xl leading-relaxed text-lg">{page.intro}</p>

        {/* Key capabilities */}
        <div className="grid md:grid-cols-3 gap-4 my-10">
          {page.bullets.map((b) => (
            <div key={b} className="border border-black/10 rounded-2xl p-4 text-[16px] text-black/75 font-medium">{b}</div>
          ))}
        </div>

        {/* Services section — pulled from existing service data */}
        {relatedServices.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">Services included</h2>
            <div className="space-y-4">
              {relatedServices.map((s) => (
                <div key={s.id} className="border border-black/10 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-[18px]">{s.name}</h3>
                    <span className="text-sm font-semibold text-black/60 whitespace-nowrap">from ${s.price.toFixed(2)}/image</span>
                  </div>
                  <p className="text-[15px] text-black/65 leading-relaxed mb-3">{s.detail || s.description}</p>
                  {s.includes && (
                    <ul className="flex flex-wrap gap-2">
                      {s.includes.map((inc) => (
                        <li key={inc} className="text-xs bg-black/5 rounded-full px-3 py-1 text-black/60">{inc}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to={`/services/${s.id}`}
                    className="inline-block mt-3 text-[13px] font-semibold underline text-black/70 hover:text-black"
                  >
                    View {s.name} details →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Frequently asked questions</h2>
          <div className="space-y-4">
            {page.faq.map((f) => (
              <article key={f.q} className="border border-black/10 rounded-2xl p-5">
                <h3 className="font-semibold text-[18px] mb-2">{f.q}</h3>
                <p className="text-[15px] text-black/70 leading-relaxed">{f.a}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Case studies */}
        {relatedCaseStudies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">Case studies</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedCaseStudies.map((cs) => cs && (
                <Link
                  key={cs.slug}
                  to={cs.path}
                  className="border border-black/10 rounded-2xl p-5 hover:border-black/30 transition-colors block"
                >
                  <h3 className="font-semibold text-[16px] mb-2">{cs.h1}</h3>
                  <p className="text-[14px] text-black/60 leading-relaxed">{cs.outcome ?? cs.description}</p>
                  <span className="inline-block mt-3 text-[13px] font-semibold underline text-black/70">Read case study →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {relatedTestimonials.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">What clients say</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedTestimonials.map((t) => t && (
                <blockquote key={t.name} className="border border-black/10 rounded-2xl p-5">
                  <p className="text-[15px] text-black/75 leading-relaxed mb-3">"{t.quote}"</p>
                  <footer className="text-[13px] font-semibold text-black/60">
                    {t.name} — {t.company}
                    {t.metric && <span className="ml-2 text-xs bg-black/5 rounded-full px-2 py-0.5">{t.metric}</span>}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-black/10">
          <Button asChild size="compact" variant="default" className="font-semibold">
            <Link to="/free-trial">{page.ctaLabel}</Link>
          </Button>
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/pricing">View pricing</Link>
          </Button>
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/book-meeting">Book meeting</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ExpansionPage;
