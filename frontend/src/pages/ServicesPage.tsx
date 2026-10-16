import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import { useServicesContext } from '../context/ServicesContext';
import ServicesHero from '../sections/services/ServicesHero';
import ServicesList from '../sections/services/ServicesList';
import ServicesCTA from '../sections/services/ServicesCTA';

const ServicesPage: React.FC = () => {
  const { getSectionContent, isUserAuthenticated } = useContent();
  const { services } = useServicesContext();
  const content = getSectionContent('servicesPage');

  return (
    <div className="min-h-screen bg-white text-[var(--color-text-primary)]">
      <Helmet>
        <title>Ecommerce Photo Editing Services | Reframe</title>
        <meta
          name="description" content="Explore our ecommerce photo editing services starting from $0.39: background removal, clipping path, ghost mannequin, retouching, and color correction."
        />
        <link rel="canonical" href="https://reframevisuals.com/services" />
        <meta property="og:title" content="Ecommerce Photo Editing Services | Reframe" />
        <meta property="og:description" content="Explore our ecommerce photo editing services starting from $0.39: background removal, clipping path, ghost mannequin, retouching, and color correction." />
        <meta property="og:url" content="https://reframevisuals.com/services" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Ecommerce Photo Editing Services',
          description: 'Professional photo editing services for ecommerce brands including clipping path, background removal, ghost mannequin, retouching, and color correction.',
          url: 'https://reframevisuals.com/services',
          numberOfItems: 9,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Background Removal', url: 'https://reframevisuals.com/services/background-removal' },
            { '@type': 'ListItem', position: 2, name: 'Clipping Path', url: 'https://reframevisuals.com/services/clipping-path' },
            { '@type': 'ListItem', position: 3, name: 'Ghost Mannequin', url: 'https://reframevisuals.com/services/ghost-mannequin' },
            { '@type': 'ListItem', position: 4, name: 'Photo Retouching', url: 'https://reframevisuals.com/services/retouching' },
            { '@type': 'ListItem', position: 5, name: 'Color Correction', url: 'https://reframevisuals.com/services/color-correction' },
            { '@type': 'ListItem', position: 6, name: 'Jewelry Retouching', url: 'https://reframevisuals.com/services/jewelry-retouch' },
            { '@type': 'ListItem', position: 7, name: 'Garment Retouching', url: 'https://reframevisuals.com/services/garment-retouch' },
            { '@type': 'ListItem', position: 8, name: 'Pattern Change', url: 'https://reframevisuals.com/services/pattern-change' },
            { '@type': 'ListItem', position: 9, name: 'Multi-Clipping Path', url: 'https://reframevisuals.com/services/multi-clipping-path' },
          ],
        })}</script>
      </Helmet>
      <ServicesHero content={content} />
      <ServicesList services={services} />
      <ServicesCTA isUserAuthenticated={isUserAuthenticated} />
    </div>
  );
};

export default ServicesPage;
