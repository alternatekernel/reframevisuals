export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Reframe Visuals?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reframe Visuals is an ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
      },
    },
    {
      '@type': 'Question',
      name: 'What services does Reframe Visuals provide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reframe Visuals provides manual Pen Tool clipping path, background removal, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, pattern change, image manipulation, AI product photography, and AI-assisted image refinement.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Reframe Visuals cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Clipping path and background removal start at $0.39 per image. Pricing varies by service complexity and selected turnaround.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do you offer 12-hour turnaround?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Reframe Visuals offers 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy turnaround options.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I try Reframe Visuals before paying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can send 3 images for free sample edits and review the quality before placing a paid order.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Reframe Visuals use AI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reframe Visuals uses AI-assisted workflows to speed up production while human Photoshop editors review images by hand for quality control.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Reframe Visuals a video reframing tool?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Reframe Visuals is an ecommerce photo editing service business, not an AI video reframing software tool.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is the quality of edits guaranteed?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We guarantee quality by routing every image through a dual-stage manual inspection workflow. Senior visual editors verify all assets against rigorous QA checklists before final delivery.',
      },
    },
  ],
};

export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://reframevisuals.com/#organization',
  name: 'Reframe Visuals',
  alternateName: 'Reframe Visuals LLC',
  url: 'https://reframevisuals.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://reframevisuals.com/logo.svg',
    width: 300,
    height: 100,
  },
  image: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png',
  email: 'hello@reframevisuals.com',
  foundingDate: '2024',
  description:
    'Reframe Visuals is a professional e-commerce photo editing studio offering background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, and AI-assisted image refinement for online brands and marketplace sellers. Starting at $0.39/image with 24-hour turnaround and 3 free sample edits.',
  address: { '@type': 'PostalAddress', addressCountry: 'US' },
  areaServed: { '@type': 'WorldArea', name: 'Worldwide' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'hello@reframevisuals.com',
    availableLanguage: ['English'],
    areaServed: 'Worldwide',
  },
  sameAs: [
    'https://www.linkedin.com/company/reframe-visuals/',
    'https://www.instagram.com/reframevisualsstudio/',
    'https://www.trustpilot.com/review/reframevisuals.com',
    'https://x.com/ReframeVisual',
    'https://www.pinterest.com/reframevisuals/',
    'https://www.behance.net/reframevisuals',
    'https://www.tiktok.com/@reframe_visuals',
  ],
  knowsAbout: [
    'Ecommerce photo editing',
    'Manual Pen Tool clipping path',
    'Background removal',
    'Ghost mannequin editing',
    'Jewelry retouching',
    'Garment retouching',
    'Model retouching',
    'Color correction',
    'Shadow creation',
    'Pattern change',
    'AI product photography',
    'AI-assisted image refinement',
    'AI-ready image editing workflow',
    'Zapier photo automation workflows',
    'E-commerce photo editing API',
    'Image delivery webhooks',
    'Automated image post-production pipelines',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '14',
    reviewCount: '14',
  },
  review: [
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Nigel', description: 'Fashion Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'The best in the game when it comes to getting work done. Humble, understanding, and consistently on point.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Nigel', description: 'Fashion Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Always on time and very patient. Service is on point and affordable.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Nigel', description: 'Fashion Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Goes above and beyond in everything. Very responsive as well.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Nigel', description: 'Fashion Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'The most efficient service — delivers exactly what I ask for. Will definitely recommend to others.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Nigel', description: 'Fashion Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Patient and gives more than just what you ask for — even good advice on the work.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Verified Client', description: 'Online Retailer' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Fantastic job with my order. Very skilled and made the small adjustments I requested in a timely manner.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Verified Client', description: 'Online Retailer' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Excellent retouching and communication. Thank you very much!',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Surreal', description: 'Ecommerce Brand' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Great communication, very efficient and excellent job every time. Handled everything exceptionally and went above and beyond.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Surreal', description: 'Ecommerce Brand' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Perfect as usual. Delivers very quickly and completed work amazingly. Will continue working together.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Todd', description: 'Product Seller, NY' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Prompt and quality work. I look forward to working with Reframe many times in the future.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Jamie', description: 'puppack.co — Pet Accessories, USA' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Amazing job, as always. Third time repeat customer. Very responsive and always overdelivers!',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Buza', description: 'Online Retailer' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Very efficient and communicated quickly and effectively.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Sol', description: 'Freelance Photographer' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Appreciate the prompt work and reply.',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Gino', description: 'Jewelry Seller' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody: 'Fast work, excellent quality, and great attention to detail. Thank you.',
    },
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://reframevisuals.com/#website',
  name: 'Reframe Visuals',
  url: 'https://reframevisuals.com',
  publisher: { '@id': 'https://reframevisuals.com/#organization' },
  description:
    'Professional ecommerce photo editing from $0.39/image, including clipping path, background removal, ghost mannequin, retouching, color correction, AI-assisted workflows, and AI-ready workflow support.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://reframevisuals.com/blog?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Get Your Product Images Edited by Reframe Visuals',
  description: 'Upload your product images, receive catalog-ready edits with human QA review, and download within 12–72 hours.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Upload Your Images',
      text: 'Connect via Google Drive, Dropbox, Amazon, or Zapier and upload your raw product images.',
      position: 1,
    },
    {
      '@type': 'HowToStep',
      name: 'Set Your Brief',
      text: 'Specify background style, turnaround window, and service type. Human editors follow your exact brief.',
      position: 2,
    },
    {
      '@type': 'HowToStep',
      name: 'QA Review',
      text: 'Senior editors inspect every image against quality checklists before delivery.',
      position: 3,
    },
    {
      '@type': 'HowToStep',
      name: 'Download Catalog-Ready Files',
      text: 'Receive finished images within your selected turnaround window: 12h, 24h, 48h, or 72h.',
      position: 4,
    },
  ],
  totalTime: 'PT12H',
  supply: [{ '@type': 'HowToSupply', name: 'Product photos (RAW, JPEG, or PNG)' }],
  tool: [{ '@type': 'HowToTool', name: 'Reframe Visuals platform' }],
};

export const priceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Ecommerce Photo Editing',
  serviceType: 'Ecommerce photo editing and post-production',
  description:
    'Manual and AI-assisted ecommerce image editing services with human Photoshop editor review, free sample edits, and flexible 12h, 24h, 48h, or 72h turnaround options.',
  provider: {
    '@type': 'Organization',
    name: 'Reframe Visuals',
    url: 'https://reframevisuals.com',
  },
  areaServed: 'Worldwide',
  termsOfService: 'https://reframevisuals.com/pricing',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '0.35',
    highPrice: '4.00',
    offerCount: '9',
    availability: 'https://schema.org/InStock',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Photo Editing Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Background Removal' },
        price: '0.39',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Clipping Path' },
        price: '0.39',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.39', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Ghost Mannequin Editing' },
        price: '0.85',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.85', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Jewelry Retouching' },
        price: '0.80',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.80', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Color Correction' },
        price: '0.35',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.35', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Shadow Creation' },
        price: '0.35',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.35', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Garment Retouching' },
        price: '0.55',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '0.55', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Model Retouching' },
        price: '1.20',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '1.20', priceCurrency: 'USD', unitText: 'per image' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'High-End Retouching' },
        price: '4.00',
        priceCurrency: 'USD',
        priceSpecification: { '@type': 'UnitPriceSpecification', price: '4.00', priceCurrency: 'USD', unitText: 'per image' },
      },
    ],
  },
};

export const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Reframe Visuals Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Any',
  description: 'Enterprise ecommerce image operations platform featuring API integrations, dual-stage QA checklists, automated delivery pipelines, and dedicated editor pod management.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: {
    '@type': 'Organization',
    name: 'Reframe Visuals',
    url: 'https://reframevisuals.com',
  },
};
