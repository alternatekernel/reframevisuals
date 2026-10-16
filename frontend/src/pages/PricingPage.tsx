import { Helmet } from 'react-helmet-async';
import { useContent } from '../context/ContentBase';
import PricingBundles from '../sections/pricing/PricingBundles';
import PricingTable from '../sections/pricing/PricingTable';
import PricingPolicies from '../sections/pricing/PricingPolicies';
import PricingFaq from '../sections/pricing/PricingFaq';
import PricingPilot from '../sections/pricing/PricingPilot';
import CompetitorComparison from '../sections/pricing/CompetitorComparison';
import PricingCTA from '../sections/pricing/PricingCTA';

const PricingPage = () => {
  const { getSectionContent } = useContent();
  const bundleData = getSectionContent('bundles');
  const bundles = bundleData.bundles || [];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Photo Editing Pricing starting from $0.39 | Reframe</title>
        <meta
          name="description" content="Transparent per-image photo editing pricing from $0.39. Compare clipping path, retouching, and ghost mannequin costs with no subscription or minimums."
        />
        <link rel="canonical" href="https://reframevisuals.com/pricing" />
        <meta property="og:title" content="Photo Editing Pricing starting from $0.39 | Reframe" />
        <meta property="og:description" content="Transparent per-image photo editing pricing from $0.39. Compare clipping path, retouching, and ghost mannequin costs with no subscription or minimums." />
        <meta property="og:url" content="https://reframevisuals.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Ecommerce Photo Editing Services',
          url: 'https://reframevisuals.com/pricing',
          provider: { '@type': 'Organization', name: 'Reframe Visuals', url: 'https://reframevisuals.com' },
          description: 'Professional photo editing services for ecommerce brands. Clipping path, background removal, ghost mannequin, retouching, and color correction with guaranteed turnaround.',
          areaServed: 'Worldwide',
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Photo Editing Pricing',
            itemListElement: [
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Background Removal' }, price: '0.39', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Clipping Path' }, price: '0.39', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Ghost Mannequin' }, price: '1.50', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '1.50', priceCurrency: 'USD', unitText: 'per image' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Photo Retouching' }, price: '0.99', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.99', priceCurrency: 'USD', unitText: 'per image' } },
              { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Color Correction' }, price: '0.59', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.59', priceCurrency: 'USD', unitText: 'per image' } },
            ],
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'What is the minimum order?', acceptedAnswer: { '@type': 'Answer', text: 'There is no minimum order. You can order a single image or thousands. Pricing is per image with no monthly commitment.' } },
            { '@type': 'Question', name: 'How does the 12-hour turnaround work?', acceptedAnswer: { '@type': 'Answer', text: 'Select the 12-hour express option at checkout. Your completed images will be delivered within 12 hours of order confirmation.' } },
            { '@type': 'Question', name: 'Do you offer bulk discounts?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Volume bundles are available for 500+ images per month. Contact us or see the bundle options on this page.' } },
            { '@type': 'Question', name: 'What is included in the free trial?', acceptedAnswer: { '@type': 'Answer', text: 'The free trial includes 3 images edited at no cost. You can also choose the $19 starter test batch for up to 15 images with defined success criteria.' } },
          ],
        })}</script>
      </Helmet>
      <PricingTable />
      <PricingPilot />
      <CompetitorComparison />
      <PricingBundles bundles={bundles} />
      <PricingPolicies />
      <PricingFaq />
      <PricingCTA />
    </div>
  );
};

export default PricingPage;

