import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import OrderFlowView from '../components/dashboard/OrderFlowView';
import { OrderFlowData } from '../components/order/types';

type OrderPageVariant = 'default' | 'new';

interface PublicOrderPageProps {
  variant?: OrderPageVariant;
}

const ORDER_PAGE_CONFIG: Record<OrderPageVariant, {
  title: string;
  description: string;
  canonical: string;
  heading: string;
  subheading: string;
  draftKey: string;
  initialOrderData: Partial<OrderFlowData>;
}> = {
  default: {
    title: 'Order Details | Reframe Visuals',
    description: 'View and manage your photo editing order details, upload files, and track progress with Reframe Visuals.',
    canonical: 'https://reframevisuals.com/order',
    heading: 'New Project',
    subheading: 'Configure your project requirements and upload assets.',
    draftKey: 'reframe_order_draft',
    initialOrderData: {},
  },
  new: {
    title: 'Place a Photo Editing Order | Reframe Visuals',
    description: 'Upload product images, set editing requirements, and submit an order to Reframe Visuals. Background removal, retouching, and color correction from $0.39/image. Turnaround from 12 hours.',
    canonical: 'https://reframevisuals.com/order/new',
    heading: 'New Order',
    subheading: 'Upload assets and set your editing requirements.',
    draftKey: 'reframe_order_draft_new',
    initialOrderData: {
      projectName: '',
      selectedServices: ['retouching', 'background-removal', 'color-correction'],
      cropRatio: '1:1',
      outputFormat: 'jpg',
      deliveryVector: 'Dashboard',
      instructions: '',
    },
  },
};

const newOrderSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://reframevisuals.com/order/new#webpage',
    url: 'https://reframevisuals.com/order/new',
    name: 'Place a Photo Editing Order | Reframe Visuals',
    description: 'Upload product images, set editing requirements, and submit an order to Reframe Visuals. Background removal, retouching, and color correction from $0.39/image.',
    isPartOf: { '@id': 'https://reframevisuals.com/#website' },
    breadcrumb: { '@id': 'https://reframevisuals.com/order/new#breadcrumb' },
    inLanguage: 'en-US',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': 'https://reframevisuals.com/order/new#breadcrumb',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://reframevisuals.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Place an Order',
        item: 'https://reframevisuals.com/order/new',
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': 'https://reframevisuals.com/order/new#service',
    name: 'Ecommerce Photo Editing Order',
    description: 'Submit product images to Reframe Visuals for background removal, retouching, color correction, clipping path, and ghost mannequin editing. Human Photoshop editors handle every image. Turnaround from 12 hours.',
    url: 'https://reframevisuals.com/order/new',
    provider: {
      '@type': 'Organization',
      '@id': 'https://reframevisuals.com/#organization',
      name: 'Reframe Visuals',
      url: 'https://reframevisuals.com',
      logo: 'https://reframevisuals.com/logo.svg',
      email: 'hello@reframevisuals.com',
    },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    serviceType: 'Ecommerce photo editing',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0.39',
      offerCount: '6',
      availability: 'https://schema.org/InStock',
      itemOffered: [
        { '@type': 'Service', name: 'Background Removal', description: 'Manual Pen Tool cutout. White, transparent, or custom background.' },
        { '@type': 'Service', name: 'Clipping Path', description: 'Precision path for print and production workflows.' },
        { '@type': 'Service', name: 'Photo Retouching', description: 'Skin, product, and garment retouching by human editors.' },
        { '@type': 'Service', name: 'Color Correction', description: 'Exposure, white balance, and tone correction across batches.' },
        { '@type': 'Service', name: 'Ghost Mannequin Editing', description: 'Neck joint and sleeve join composite for apparel photography.' },
        { '@type': 'Service', name: 'Shadow Creation', description: 'Drop shadow and reflection shadow for ecommerce product shots.' },
      ],
    },
    termsOfService: 'https://reframevisuals.com/pricing',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': 'https://reframevisuals.com/order/new#howto',
    name: 'How to Submit a Photo Editing Order to Reframe Visuals',
    description: 'Select services, upload your images, set specs, and submit. Edited files are ready within your chosen turnaround window.',
    totalTime: 'PT5M',
    supply: [
      { '@type': 'HowToSupply', name: 'Product photos in JPG, PNG, TIFF, or RAW format' },
    ],
    tool: [
      { '@type': 'HowToTool', name: 'Reframe Visuals order form' },
    ],
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Select services',
        text: 'Choose from background removal, retouching, color correction, clipping path, ghost mannequin, or shadow creation.',
        url: 'https://reframevisuals.com/order/new',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Upload images',
        text: 'Upload files directly or link a Google Drive or Dropbox folder.',
        url: 'https://reframevisuals.com/order/new',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Set specs',
        text: 'Specify output format, crop ratio, background, turnaround window, and any custom instructions.',
        url: 'https://reframevisuals.com/order/new',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Submit and receive delivery',
        text: 'Submit the order. Human editors complete every image and deliver within 12, 24, 48, or 72 hours depending on your selected turnaround.',
        url: 'https://reframevisuals.com/order/new',
      },
    ],
  },
];

const PublicOrderPage: React.FC<PublicOrderPageProps> = ({ variant = 'default' }) => {
  const config = ORDER_PAGE_CONFIG[variant] || ORDER_PAGE_CONFIG.default;
  const initialOrderData = useMemo(() => config.initialOrderData, [config]);
  const isNewVariant = variant === 'new';

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={config.canonical} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={config.canonical} />
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:site_name" content="Reframe Visuals" />
        <meta property="og:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.description} />
        <meta name="twitter:image" content="https://res.cloudinary.com/dnmj4altq/image/upload/v1781548471/reframe-visuals-your-editing-partner_xzvgbl.png" />

        {/* Robots */}
        {isNewVariant && <meta name="robots" content="index, follow" />}

        {/* JSON-LD schemas */}
        {isNewVariant && newOrderSchemas.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>
      <div className="pt-6 pb-16">
        <div className="max-w-[1080px] mx-auto px-4">
          <OrderFlowView
            pageTitle={config.heading}
            pageDescription={config.subheading}
            initialOrderData={initialOrderData}
            draftKey={config.draftKey}
            isPublicPage
          />
        </div>
      </div>
    </div>
  );
};

export default PublicOrderPage;
