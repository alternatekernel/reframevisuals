import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getServiceById } from '../data/services';
import { absoluteCanonicalUrl } from '../utils/seo';
import { cx, typography } from '../utils/theme';

type IntentKind = 'best-for-ecommerce' | 'pricing-guide' | 'turnaround-quality';

const isIntent = (value: string | undefined): value is IntentKind => {
  return value === 'best-for-ecommerce' || value === 'pricing-guide' || value === 'turnaround-quality';
};

const ServiceIntentPage: React.FC = () => {
  const { serviceId, intent } = useParams();
  const service = getServiceById(serviceId || '');

  if (!service || !isIntent(intent)) {
    return <Navigate to="/services" replace />;
  }

  const basePath = `/services/${service.id}/${intent}`;
  const canonical = absoluteCanonicalUrl(basePath);

  const titleMap: Record<IntentKind, string> = {
    'best-for-ecommerce': `Best ${service.name} Service for E-commerce Brands | Reframe Visuals`,
    'pricing-guide': `${service.name} Pricing Guide (US/UK/AU/EU) | Reframe Visuals`,
    'turnaround-quality': `${service.name} Turnaround + Quality Standards | Reframe Visuals`,
  };

  const descriptionMap: Record<IntentKind, string> = {
    'best-for-ecommerce': `How Reframe Visuals delivers ${service.name.toLowerCase()} for ecommerce brands with consistent quality, bulk capacity, and conversion-ready outputs.`,
    'pricing-guide': `Practical ${service.name.toLowerCase()} pricing guide for ecommerce teams: scope drivers, turnaround tradeoffs, and ways to optimize cost at scale.`,
    'turnaround-quality': `Review Reframe Visuals ${service.name.toLowerCase()} turnaround benchmarks, QA workflow, and delivery standards for ecommerce production teams.`,
  };

  const h1Map: Record<IntentKind, string> = {
    'best-for-ecommerce': `Best ${service.name} Service for E-commerce`,
    'pricing-guide': `${service.name} Pricing Guide`,
    'turnaround-quality': `${service.name} Turnaround + Quality Standards`,
  };

  const introMap: Record<IntentKind, string> = {
    'best-for-ecommerce': `For ecommerce brands, ${service.name.toLowerCase()} quality has direct impact on click-through, conversion, and returns. Reframe Visuals provides production-grade delivery designed for marketplace compliance, catalog consistency, and scale.`,
    'pricing-guide': `Pricing for ${service.name.toLowerCase()} depends on complexity, volume, turnaround SLA, and revision policy. This guide helps procurement and operations teams estimate budget and choose service scope without sacrificing quality.`,
    'turnaround-quality': `Turnaround speed without quality controls creates hidden costs. Reframe Visuals combines speed with multi-step QA so ecommerce teams can publish on schedule with fewer rework cycles.`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Who is ${service.name} best for?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: service.bestFor,
        },
      },
      {
        '@type': 'Question',
        name: `What is the starting price for ${service.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Starting price is from $${service.price.toFixed(2)} per image, depending on complexity and volume.`,
        },
      },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteCanonicalUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Services', item: absoluteCanonicalUrl('/services') },
      { '@type': 'ListItem', position: 3, name: service.name, item: absoluteCanonicalUrl(`/services/${service.id}`) },
      { '@type': 'ListItem', position: 4, name: h1Map[intent], item: canonical },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{titleMap[intent]}</title>
        <meta name="description" content={descriptionMap[intent]} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={titleMap[intent]} />
        <meta property="og:description" content={descriptionMap[intent]} />
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className={cx(typography.eyebrow, "text-[#7C3AED] mb-3")}>Reframe Visuals • Service Intelligence</p>
        <h1 className="mt-3 text-3xl font-bold text-black md:text-4xl">{h1Map[intent]}</h1>
        <p className="mt-4 text-base leading-7 text-black/80">{introMap[intent]}</p>

        <div className="mt-8 space-y-4 text-base leading-7 text-black/80">
          <p><strong>Primary use case:</strong> {service.bestFor}</p>
          <p><strong>Starting price:</strong> ${service.price.toFixed(2)} per image</p>
          <p><strong>Core deliverables:</strong> {service.includes.join(', ')}</p>
          <p><strong>Operational focus:</strong> predictable quality, production-safe turnaround, and ecommerce-ready outputs across US/UK/AU/EU markets.</p>
        </div>

        <div className="mt-10 rounded-xl border border-black/10 p-5">
          <h2 className="text-xl font-semibold text-black">Related Pages</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link to={`/services/${service.id}`} className="text-[#7C3AED] hover:underline">View {service.name} service page</Link>
            <Link to={`/services/${service.id}/best-for-ecommerce`} className="text-[#7C3AED] hover:underline">Best for ecommerce</Link>
            <Link to={`/services/${service.id}/pricing-guide`} className="text-[#7C3AED] hover:underline">Pricing guide</Link>
            <Link to={`/services/${service.id}/turnaround-quality`} className="text-[#7C3AED] hover:underline">Turnaround + quality standards</Link>
            <Link to="/compare/in-house-vs-outsourcing" className="text-[#7C3AED] hover:underline">In-house vs outsourcing comparison</Link>
            <Link to="/pricing" className="text-[#7C3AED] hover:underline">View pricing</Link>
            <Link to="/free-trial" className="text-[#7C3AED] hover:underline">Start free trial</Link>
            <Link to="/book-meeting" className="text-[#7C3AED] hover:underline">Book a meeting</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServiceIntentPage;
