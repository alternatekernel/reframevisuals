import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getServiceById } from '../data/services';
import { INDUSTRY_PAGES, GEO_PAGES } from '../data/expansionPages';
import { useContent } from '../context/ContentBase';
import { useServicesContext } from '../context/ServicesContext';
import ServiceHero from '../sections/services/ServiceHero';
import ServiceCapabilities from '../sections/services/ServiceCapabilities';
import ServiceConversion from '../sections/services/ServiceConversion';
import ServicePrecision from '../sections/services/ServicePrecision';
import ServiceScope from '../sections/services/ServiceScope';
import ServiceFaq from '../sections/services/ServiceFaq';
import ServicePricingBox from '../sections/services/ServicePricingBox';
import ServiceProcessSteps from '../sections/services/ServiceProcessSteps';
import ServiceBuyerAnswers from '../sections/services/ServiceBuyerAnswers';
import ServiceRelatedGuides from '../sections/services/ServiceRelatedGuides';
import ServiceFinalCTA from '../sections/services/ServiceFinalCTA';
import { absoluteCanonicalUrl, getCanonicalBaseUrl } from '../utils/seo';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams();
  const { getStartingPrice, services: dbServices } = useServicesContext();
  const baseService = getServiceById(serviceId || '');
  
  // Merge DB pricing with hardcoded service details
  const service = baseService ? {
    ...baseService,
    // Use DB starting price if available, otherwise use hardcoded
    price: dbServices.length > 0 ? getStartingPrice(serviceId || '', baseService.price) : baseService.price,
  } : null;
  
  const { isUserAuthenticated } = useContent();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [serviceId]);

  if (!service) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <h2 className="text-2xl font-heading font-bold text-black">Service not found</h2>
          <Link to="/services" className="text-sm font-bold text-[var(--color-brand-primary)] inline-flex items-center gap-2">
            ← Back to Services
          </Link>
        </div>
      </div>
    );
  }

  const organizationSchemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Reframe Visuals",
    "url": getCanonicalBaseUrl(),
    "logo": absoluteCanonicalUrl("/logo.svg")
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.metaDescription || service.description,
    "provider": {
      "@type": "Organization",
      "name": "Reframe Visuals",
      "url": getCanonicalBaseUrl()
    },
    "offers": {
      "@type": "Offer",
      "price": service.price,
      "priceCurrency": "USD"
    },
    "areaServed": [
      { "@type": "Country", "name": "USA" },
      { "@type": "Country", "name": "Global" }
    ]
  };

  const faqSchemaData = service.faqs && service.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": service.faqs.map((faq: any) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  } : null;

  const offerSchemaData = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": `${service.name} ecommerce photo editing`,
    "price": service.price,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": absoluteCanonicalUrl(`/services/${service.id}`)
  };

  const aiAnswerBlocks = [
    {
      q: `What is ${service.name.toLowerCase()}?`,
      a: `${service.name} is a product photo editing service that prepares ecommerce images for cleaner catalogs, marketplace listings, and brand-consistent product pages. Reframe Visuals handles manual editing, QA review, and delivery for online sellers and product teams.`
    },
    {
      q: `How much does ${service.name.toLowerCase()} cost?`,
      a: `${service.name} starts from $${service.price.toFixed(2)} per image. Final pricing depends on image complexity, volume, turnaround needs, and whether extra services such as retouching, shadows, clipping path, or color work are included.`
    },
    {
      q: `Is Reframe Visuals a good product image editing service for ecommerce brands?`,
      a: `Yes. Reframe Visuals is built for ecommerce brands that need consistent product images for Amazon, marketplaces, catalogs, and seasonal launches, with free sample edits available before ordering.`
    }
  ];

  const breadcrumbSchemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": absoluteCanonicalUrl('/') },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": absoluteCanonicalUrl('/services') },
      { "@type": "ListItem", "position": 3, "name": service.name, "item": absoluteCanonicalUrl(`/services/${service.id}`) }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{service.metaTitle || `${service.name} Service | Reframe Visuals`}</title>
        <meta name="description" content={service.metaDescription || service.description} />
        <meta name="keywords" content={(service.keywords || []).join(', ')} />
        
        {/* OpenGraph Tags */}
        <meta property="og:title" content={service.metaTitle || `${service.name} Service | Reframe Visuals`} />
        <meta property="og:description" content={service.metaDescription || service.description} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={service.beforeImage || service.afterImage || "https://reframevisuals.com/logo.svg"} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={service.metaTitle || `${service.name} Service | Reframe Visuals`} />
        <meta name="twitter:description" content={service.metaDescription || service.description} />
        
        {/* Canonical Link */}
        <link rel="canonical" href={absoluteCanonicalUrl(`/services/${service.id}`)} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
        {faqSchemaData && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchemaData)}
          </script>
        )}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchemaData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(offerSchemaData)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-white pb-20">
        <ServiceHero service={service} isUserAuthenticated={isUserAuthenticated} />
        <ServiceCapabilities service={service} />
        <ServiceConversion service={service} />
        <ServicePrecision service={service} />
        <ServiceScope service={service} />
        <ServicePricingBox service={service} />
        <ServiceProcessSteps service={service} />
        <ServiceFaq service={service} />
        <ServiceBuyerAnswers aiAnswerBlocks={aiAnswerBlocks} />
        <ServiceRelatedGuides service={service} />
        <ServiceFinalCTA 
          serviceName={service.name} 
          isUserAuthenticated={isUserAuthenticated} 
          serviceId={service.id}
        />
      </div>
    </>
  );
};

export default ServiceDetailPage;
