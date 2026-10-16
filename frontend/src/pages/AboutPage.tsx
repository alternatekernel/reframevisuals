import { Helmet } from 'react-helmet-async';
import AboutPhilosophy from '../sections/about/AboutPhilosophy';
import AboutExpertise from '../sections/about/AboutExpertise';
import AboutFAQ from '../sections/about/AboutFAQ';
import AboutCTA from '../sections/about/AboutCTA';

const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  'name': 'About Reframe Visuals | E-commerce Photo Editing Studio',
  'description': 'Reframe Visuals is an ecommerce photo editing studio. Human Photoshop editors handle background removal, ghost mannequin editing, jewelry retouching, and color correction with a manual QA pass on every image.',
  'url': 'https://reframevisuals.com/about',
  'mainEntity': {
    '@type': 'Organization',
    'name': 'Reframe Visuals',
    'url': 'https://reframevisuals.com',
    'logo': 'https://reframevisuals.com/logo.svg',
    'image': 'https://reframevisuals.com/logo.svg',
    'description': 'Ecommerce photo editing studio specializing in background removal, ghost mannequin editing, jewelry retouching, and product photography.',
    'foundingDate': '2024',
    'areaServed': ['Worldwide', 'United States', 'United Kingdom'],
    'serviceType': 'Ecommerce photo editing and post-production',
    'slogan': 'Product photo editing for ecommerce brands. Human editors, manual QA on every image.',
    'knowsAbout': [
      '3 free sample edits',
      'dual-stage manual quality control',
      'human Photoshop editors',
      'AI-assisted image refinement',
      'bulk product photo editing',
      '12-hour express turnaround',
      '24-hour standard turnaround'
    ],
    'makesOffer': [
      {
        '@type': 'Offer',
        'name': '3 free sample edits for new customers',
        'description': 'New customers can upload up to 3 product photos to evaluate Reframe Visuals quality before placing a paid order.',
        'price': 0,
        'priceCurrency': 'USD'
      }
    ],
    'sameAs': [
      'https://reframevisuals.com',
      'https://www.linkedin.com/company/reframe-visuals/',
      'https://www.instagram.com/reframevisualsstudio/',
      'https://www.pinterest.com/reframevisuals/',
      'https://www.behance.net/reframevisuals',
      'https://x.com/ReframeVisual',
      'https://www.trustpilot.com/review/reframevisuals.com',
      'https://www.tiktok.com/@reframe_visuals'
    ],
    'contactPoint': [{
      '@type': 'ContactPoint',
      'contactType': 'sales',
      'url': 'https://reframevisuals.com/contact'
    }]
  },
  'dateModified': new Date().toISOString()
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>About Reframe Visuals | Ecommerce Photo Editing Studio</title>
        <meta
          name="description" content="Reframe Visuals is a leading ecommerce photo editing studio. Expert human editors handle background removal, ghost mannequin, and jewelry retouching."
        />
        <meta name="keywords" content="about reframe visuals, e-commerce photo editing studio, product photography company, background removal service, ghost mannequin editing, jewelry retouching, image editing company" />
        <link rel="canonical" href="https://reframevisuals.com/about" />
        <meta property="og:title" content="About Reframe Visuals | Ecommerce Photo Editing Studio" />
        <meta property="og:description" content="Reframe Visuals is a leading ecommerce photo editing studio. Expert human editors handle background removal, ghost mannequin, and jewelry retouching." />
        <meta property="og:url" content="https://reframevisuals.com/about" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Reframe Visuals | Ecommerce Photo Editing Studio" />
        <meta name="twitter:description" content="Reframe Visuals is a leading ecommerce photo editing studio. Expert human editors handle background removal, ghost mannequin, and jewelry retouching." />
        <script type="application/ld+json">
          {JSON.stringify(aboutSchema)}
        </script>
      </Helmet>
      
      <AboutPhilosophy />
      <AboutExpertise />
      <AboutFAQ />
      <AboutCTA />
    </div>
  );
};

export default AboutPage;
