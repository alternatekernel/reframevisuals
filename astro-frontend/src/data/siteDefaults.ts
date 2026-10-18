// Default CMS section content (moved out of context/ContentContext.tsx so server-rendered pages can use it).
// ─── Default content for all sections ───

const HERO_DEFAULTS = {
  headline: 'Hand-edited product photos for Amazon sellers and ecommerce brands.',
  eyebrow: 'Clean edges. Consistent catalogs. No subscription.',
  subtitle: 'Human editors trace every edge by hand, including hair, lace, glass, and transparencies that automated tools miss. Clean, consistent output for Amazon sellers, apparel brands, jewelry stores, and agencies. Starting at $0.39 per image.',
  cta1Label: 'Get 3 Free Sample Edits',
  cta1Link: '/free-trial',
  cta2Label: 'View Editing Services',
  cta2Link: '/services',
  caption: '✦ Precision Retouched',
};

const TICKER_DEFAULTS = {
  items: [
    'Reframe Visuals',
    'Professional Editing',
    'From $0.30 per image',
    'Background Removal',
    'Ghost Mannequin',
    'Jewelry Retouching',
    '24-72h Turnaround',
    '12h Express Delivery',
    'Global E-commerce',
    'Fashion & Beauty',
    'Automotive Retouching',
    'Human Precision',
    'AI Efficiency',
    'Pixel Perfect',
    'Risk-Free Trial',
    'Free Sample Editing',
  ],
};

const STATS_DEFAULTS = {
  heading: 'Shoppers decide from images',
  subheading: 'before they read the description.',
  footer: 'Customers form their opinion before they read a single word.',
  stats: [
    { value: '77%', label: 'of shoppers say high-quality images are critical to purchase decisions', source: 'Salsify 2025 Consumer Report' },
    { value: '67%', label: 'of shoppers look at product images before reading any description', source: 'Baymard Institute UX Research' },
    { value: '22%', label: 'of products are returned because they look different from photos', source: 'NRF Happy Returns Report' },
  ],
};

const FAQ_DEFAULTS = {
  heading: 'Frequently Asked',
  subheading: 'Questions.',
  description: 'Everything you need to know for seamless production.',
  landing: [
    { category: 'Services', icon: 'Image', question: 'Which image editing service is best for my brand?', answer: "For apparel, start with ghost mannequin. For jewelry, go with jewelry retouching. For marketplace listings, background removal covers most needs. Browse the full services list to find what fits your product type." },
    { category: 'Technology', icon: 'Cpu', question: 'Do you rely on AI for image editing?', answer: 'We use AI for product photography and video generation. For all other services, human editors handle the editing and a QA reviewer checks every file before delivery.' },
    { category: 'Volume', icon: 'Layers', question: 'Can you handle regular bulk image editing orders?', answer: 'Yes. We process large catalog batches for ecommerce brands on recurring schedules. Contact us if you need a dedicated editor or custom volume pricing.' },
    { category: 'Delivery', icon: 'Clock', question: 'How does turnaround work?', answer: 'Choose 12h, 24h, 48h, or 72h at checkout. Pricing adjusts based on your selection. No hidden fees.' },
    { category: 'Billing', icon: 'CreditCard', question: 'Do I need a subscription or contract?', answer: 'Not for standard orders. Pay per image with no commitments. But for larger ongoing projects, our Partnership Program offers dedicated editors, priority support, and volume discounts. Contact us to learn more.' },
    { category: 'Revisions', icon: 'RotateCcw', question: 'How do I request a revision?', answer: 'Use our precision annotation tools directly on the image to highlight exactly what to change.' },
    { category: 'Support', icon: 'MessageCircle', question: 'Can I request physical documentation or in-person assurance?', answer: 'Yes. Reframe Visuals provides 24/7 live chat coordination and dedicated customer support for all orders. Qualified enterprise customers can also request Verified Assurance Support for physical documentation assistance, partner-assisted review, or live meeting coordination.' },
  ],
  insights: [
    { question: 'How does turnaround work?', answer: 'Select 12h, 24h, 48h, 72h, or 7-day turnaround. Each speed tier has transparent per-image pricing. You see the cost before placing the order.' },
    { question: 'Do I pay before results?', answer: 'No. Every job follows a review-first model. You inspect all side-by-side comparisons before approval.' },
    { question: 'How do I request a revision?', answer: 'Click directly on the image to annotate. Mark the exact area and describe the fix. Our editors resolve it within your turnaround window.' },
    { question: 'What file formats are supported?', answer: 'We accept JPG, PNG, TIFF, and PSD up to 50MB per file. Batch uploads of up to 100 images per job are standard.' },
    { question: 'Is Reframe built for photographers?', answer: 'Yes. High-volume studios, eCommerce brands, and agencies all use Reframe to scale their post-production.' },
    { question: 'Do you offer high-volume pricing?', answer: 'For 500+ images per month, contact our enterprise team for custom volume rates and dedicated editor assignments.' },
    { question: 'Can I integrate with my workflow?', answer: 'Connect Google Drive, Dropbox, OneDrive, or upload directly. Storefront, Amazon, and automated app workflows coming soon.' },
    { question: 'What about data security?', answer: 'All files are encrypted in transit and at rest. We are SOC 2 compliant and never share your assets with third parties.' },
  ],
};

const DIFFERENTIATORS_DEFAULTS = {
  heading: 'Where standard services fail.',
  subheading: 'How we handle it differently.',
  points: [
    { old: 'Week-long turnarounds', new: '24-48 hour delivery standard' },
    { old: 'Hidden fees and surprise charges', new: 'Transparent, complexity-based pricing' },
    { old: 'Generic quality, random editors', new: 'Dedicated experts per project type' },
    { old: 'Email chains and revision hell', new: 'Visual annotation, instant feedback' },
    { old: 'One-size-fits-all service tiers', new: 'Customizable workflows per project' },
    { old: 'Static pricing, no volume benefits', new: 'Progressive discounts up to 40% off' },
  ],
};

const WORKFLOW_DEFAULTS = {
  heading: 'Three steps to',
  subheading: 'publish-ready.',
  description: 'Upload your images. We edit and QA each one before delivery.',
  steps: [
    { id: '01', title: 'Connect.', body: 'Upload directly, link your storage, or email us. No lengthy onboarding.' },
    { id: '02', title: 'Process.', body: 'Our editing team starts on your images right away. Human QA runs on every file.' },
    { id: '03', title: 'Approve.', body: 'Review the batch, ship what you approve, and request tweaks on anything else.' },
  ],
};

const INTEGRATIONS_DEFAULTS = {
  heading: 'Connect your',
  subheading: 'workspace.',
  description: 'No migrations required. Link your existing storage and start reframing instantly.',
  ctaLabel: 'Connect Storage',
  comingSoon: 'Coming: Storefront · Amazon · App Sync',
  items: [
    { name: 'Drive', color: '#4285F4' },
    { name: 'Dropbox', color: '#0061FF' },
    { name: 'OneDrive', color: '#0078D4' },
    { name: 'Upload', color: '#34A853' },
    { name: 'Share', color: '#409FFF' },
    { name: 'Link', color: '#EA4335' },
  ],
};

const CTA_DEFAULTS = {
  heading: 'Start with 3',
  subheading: 'free edits.',
  description: 'Send 3 images. See the edit quality. Order the rest only when you approve.',
  buttonLabel: '✦ Start Free',
  discount: '20% off your first true order.',
};

const NAVIGATION_DEFAULTS = {
  brandName: 'REFRAME',
  brandNameSub: 'VISUAL',
  ctaLabel: 'Sign Up',
  navItems: [
    { label: 'Services', path: '/services' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'About', path: '/about' },
    { label: 'Blog', path: '/blog' },
  ],
  dropdownFooter: 'Every image reviewed by a human editor before delivery.',
  dropdownCta: 'Explore All Services',
  whatsappLink: 'https://wa.me/',
  telegramLink: 'https://t.me/',
  emailLink: 'mailto:hello@reframevisuals.com',
};

export const FOOTER_DEFAULTS = {
  brandName: 'Reframe Visuals',
  brandDescription: 'Reliable e-commerce image editing with clear pricing, human QA, and fast turnaround.',
  trustNumber: '500+',
  trustLabel: 'Industry Leaders',
  ctaLabel: 'Visual Sprint',
  ctaTitle: 'Try 3 images free.',
  copyright: '© 2026 REFRAME VISUALS',
  status: 'Operational',
  version: 'Global v4.2',
  socialLinks: [
    { platform: 'Instagram', url: 'https://www.instagram.com/reframevisualsstudio/' },
    { platform: 'Linkedin', url: 'https://www.linkedin.com/company/reframe-visuals/' },
    { platform: 'Pinterest', url: 'https://www.pinterest.com/reframevisuals/' },
    { platform: 'Behance', url: 'https://www.behance.net/reframevisuals' },
    { platform: 'X', url: 'https://x.com/ReframeVisual' },
    { platform: 'Trustpilot', url: 'https://www.trustpilot.com/review/reframevisuals.com' },
    { platform: 'TikTok', url: 'https://www.tiktok.com/@reframe_visuals' },
  ],
  linkGroups: [
    {
      title: 'PLATFORM',
      links: [
        { label: 'All Services', path: '/services' },
        { label: 'Pricing', path: '/pricing' },
        { label: 'Free Trial', path: '/free-trial' },
        { label: 'Design System', path: '/design-system' },
      ],
    },
    {
      title: 'COMPANY',
      links: [
        { label: 'About', path: '/about' },
        { label: 'Portfolio', path: '/portfolio' },
        { label: 'Testimonials', path: '/testimonials' },
        { label: 'Blog', path: '/blog' },
        { label: 'Book Meeting', path: '/book-meeting' },
        { label: 'Careers', path: '#' },
      ],
    },
    {
      title: 'LEGAL',
      links: [
        { label: 'Privacy', path: '/privacy' },
        { label: 'Terms', path: '/terms' },
        { label: 'Cookies', path: '/cookies' },
        { label: 'Security', path: '/security' },
      ],
    },
    {
      title: 'MARKETS',
      links: [
        { label: 'Amazon Sellers', path: '/amazon-product-image-editing' },
        { label: 'Shopify Brands', path: '/shopify-product-photo-editing' },
        { label: 'WooCommerce', path: '/woocommerce-product-image-editing' },
        { label: 'Fashion', path: '/fashion-photo-retouching-service' },
        { label: 'Jewelry', path: '/jewelry-photo-retouching-service' },
        { label: 'US Brands', path: '/us-photo-editing-service' },
        { label: 'UK Brands', path: '/uk-photo-editing-service' },
        { label: 'Canada', path: '/canada-photo-editing-service' },
        { label: 'Australia', path: '/australia-photo-editing-service' },
        { label: 'UAE', path: '/uae-photo-editing-service' },
        { label: 'Singapore', path: '/singapore-photo-editing-service' },
      ],
    },
  ],
};

const CHAT_WIDGET_DEFAULTS = {
  title: 'Reframe AI',
  status: 'Online',
  welcomeMessage: 'Hi, I\'m here to help. Ask me about services, pricing, or turnaround times.',
  quickReplies: [
    'What services do you offer?',
    'How much does it cost?',
    'How fast is turnaround?',
  ],
  systemPrompt: 'You are a Reframe Support Bot. Pricing starts at $0.19/image. 19 human expert services available. AI runs the workflow, humans do the editing. Respond in JSON format: { "answer": "your response" }. Tone: Technical, Precise, Helpful.',
  inputPlaceholder: 'Tell me what to refine...',
  errorMessage: 'ERR_SIGNAL_LOST: Reconnecting...',
  typingLabel: 'thinking',
};

const SERVICES_PAGE_DEFAULTS = {
  badge: '19 Services',
  heading: 'Every editing service',
  subheading: 'reviewed by hand.',
  description: 'Background removal, clipping paths, ghost mannequin, retouching, and color correction for ecommerce brands at any volume.',
  trustItems: ['24h Turnaround', 'QA Reviewed', 'Review First'],
  ctaLabel: 'GET 3 IMAGE EDITS FREE',
  footerText: 'No credit card required • Review first, always • JPG, PNG, TIFF',
};

const SERVICES_LANDING_DEFAULTS = {
  heading: 'Editing services',
  subheading: 'for every product type.',
};

const PRICING_PAGE_DEFAULTS = {
  heading: 'Pricing that',
  subheading: 'respects detail.',
  description: 'Starting at $0.27/image. No subscription. No contract.',
  badge: '',
  footerText: 'Pay per image • 1 free revision per service • Review first, always • JPG, PNG, TIFF',
  landingHeading: '',
  landingSubheading: '',
  landingDescription: 'No minimum order. Pay per image. Order in minutes.',
};

const SERVICES_DEFAULTS = {
  services: [
    { id: 'bg-removal', name: 'Background Removal', categoryId: 'Foundation', price: 0.35, description: 'Clean background removal with precise edge detection' },
    { id: 'clipping-path', name: 'Clipping Path', categoryId: 'Foundation', price: 0.35, description: 'Hand-drawn clipping paths for sharp cutouts' },
    { id: 'multi-clipping', name: 'Multi-Clipping Path', categoryId: 'Foundation', price: 0.81, description: 'Complex multi-path selections for detailed products' },
    { id: 'color-correction', name: 'Color Correction', categoryId: 'Foundation', price: 0.32, description: 'Accurate color matching and white balance' },
    { id: 'color-change', name: 'Color Change', categoryId: 'Foundation', price: 0.27, description: 'Product color variations from a single shot' },
    { id: 'shadow-creation', name: 'Shadow Creation', categoryId: 'Enhancement', price: 0.32, description: 'Natural shadows that ground your products' },
    { id: 'manipulation', name: 'Manipulation', categoryId: 'Enhancement', price: 3.59, description: 'Creative image manipulation and compositing' },
    { id: 'pattern-change', name: 'Pattern Change', categoryId: 'Enhancement', price: 1.13, description: 'Swap textures and patterns on products' },
    { id: 'retouching', name: 'Retouching', categoryId: 'Retouch', price: 0.50, description: 'Professional photo retouching and cleanup' },
    { id: 'jewelry-retouch', name: 'Jewelry Retouch', categoryId: 'Retouch', price: 0.72, description: 'Specialized jewelry enhancement and sparkle' },
    { id: 'garment-retouch', name: 'Garment Retouch', categoryId: 'Retouch', price: 0.50, description: 'Fabric smoothing and wrinkle removal' },
    { id: 'model-retouch', name: 'Model Retouch', categoryId: 'Retouch', price: 1.08, description: 'Portrait retouching for model photography' },
    { id: 'ghost-mannequin', name: 'Ghost Mannequin', categoryId: 'Advanced', price: 0.77, description: 'Invisible mannequin effect for apparel' },
  ],
};

const BUNDLES_DEFAULTS = {
  bundles: [
    { id: 'marketplace', name: 'Marketplace Ready', services: ['Background Removal', 'Shadow Creation', 'Color Correction'], description: 'Background removal, shadows, and color correction', savings: 'Save 15%', price: 0.49, highlight: false },
    { id: 'ghost-mannequin', name: 'Ghost Mannequin Complete', services: ['Ghost Mannequin', 'Garment Retouch', 'Color Correction', 'Background Removal'], description: 'Full ghost mannequin with retouch and corrections', savings: 'Save 11%', price: 1.54, highlight: true },
    { id: 'jewelry', name: 'Jewelry Essentials', services: ['Background Removal', 'Jewelry Retouch', 'Shadow Creation'], description: 'Background removal, jewelry retouch, and shadows', savings: 'Save 12%', price: 1.54, highlight: false },
    { id: 'garment', name: 'Garment Perfection', services: ['Garment Retouch', 'Background Removal', 'Color Correction'], description: 'Garment retouch, background removal, and color correction', savings: 'Save 10%', price: 0.89, highlight: false },
    { id: 'editorial', name: 'High-End Editorial', services: ['High-End Retouch', 'Manipulation', 'Color Correction', 'Background Removal'], description: 'High-end retouch, manipulation, and full corrections', savings: 'Save 18%', price: 2.99, highlight: false },
    { id: 'volume', name: 'Custom Volume', services: ['Custom service mix', 'Dedicated editor', 'Priority turnaround', 'Volume discounts'], description: 'Custom service mix with dedicated editor', savings: 'Best value', price: null, highlight: false },
  ],
};

const PRICING_MATRIX_DEFAULTS = {
  rows: [
    { service: 'Background Removal', tier: 'S', tierLabel: 'Simple', procMin: '3', procMax: '5', '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '5', procMax: '12', '12h': 1.01, '24h': 0.78, '48h': 0.70, '72h': 0.66, '7d': 0.62 },
    { service: '', tier: 'A', tierLabel: 'Advanced', procMin: '12', procMax: '25', '12h': 1.62, '24h': 1.25, '48h': 1.12, '72h': 1.06, '7d': 1.00 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '25', procMax: '1h 20m', '12h': 3.24, '24h': 2.50, '48h': 2.25, '72h': 2.12, '7d': 2.00 },

    { service: 'Clipping Path', tier: 'S', tierLabel: 'Simple', procMin: '5', procMax: '7', '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '8', procMax: '15', '12h': 0.66, '24h': 0.51, '48h': 0.46, '72h': 0.43, '7d': 0.41 },
    { service: '', tier: 'A', tierLabel: 'Advanced', procMin: '15', procMax: '45', '12h': 1.22, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '45', procMax: '1h 20m', '12h': 1.71, '24h': 1.90, '48h': 1.71, '72h': 1.62, '7d': 1.52 },
    { service: '', tier: 'SC', tierLabel: 'Super Complex', procMin: '1h 20m', procMax: '2h', '12h': 3.84, '24h': 2.99, '48h': 2.69, '72h': 2.54, '7d': 2.39 },

    { service: 'Multi-Clipping Path', tier: 'S', tierLabel: 'Simple', procMin: '8', procMax: '12', '12h': 1.17, '24h': 0.90, '48h': 0.81, '72h': 0.77, '7d': 0.72 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '12', procMax: '25', '12h': 2.16, '24h': 1.67, '48h': 1.50, '72h': 1.42, '7d': 1.33 },
    { service: '', tier: 'A', tierLabel: 'Advanced', procMin: '25', procMax: '45', '12h': 2.93, '24h': 2.25, '48h': 2.03, '72h': 1.91, '7d': 1.80 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '45', procMax: '1h 30m', '12h': 4.98, '24h': 3.83, '48h': 3.45, '72h': 3.26, '7d': 3.06 },
    { service: '', tier: 'SC', tierLabel: 'Super Complex', procMin: '1h 30m', procMax: '2h 30m', '12h': 6.73, '24h': 5.18, '48h': 4.66, '72h': 4.40, '7d': 4.14 },

    { service: 'Color Correction', tier: 'Single', tierLabel: 'Single', procMin: '5', procMax: '8', '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 },
    { service: '', tier: 'Multiple', tierLabel: 'Multiple', procMin: '8', procMax: '15', '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 },

    { service: 'Color Change', tier: 'Single', tierLabel: 'Single', procMin: '5', procMax: '8', '12h': 0.39, '24h': 0.30, '48h': 0.27, '72h': 0.26, '7d': 0.24 },
    { service: '', tier: 'Multiple', tierLabel: 'Multiple', procMin: '8', procMax: '15', '12h': 0.91, '24h': 0.70, '48h': 0.63, '72h': 0.60, '7d': 0.56 },

    { service: 'Pattern Change', tier: 'Single', tierLabel: 'Single', procMin: '20', procMax: '30', '12h': 1.63, '24h': 1.25, '48h': 1.13, '72h': 1.06, '7d': 1.00 },
    { service: '', tier: 'Multicolor', tierLabel: 'Multicolor', procMin: '40', procMax: '50', '12h': 0.50, '24h': 0.50, '48h': 0.50, '72h': 0.50, '7d': 0.50 },
    { service: '', tier: 'Multiple', tierLabel: 'Multiple', procMin: '50', procMax: '1h 30m', '12h': 3.64, '24h': 2.80, '48h': 2.52, '72h': 2.38, '7d': 2.24 },
    { service: '', tier: 'Multicolor', tierLabel: 'Multicolor', procMin: '1h 30m', procMax: '2h 30m', '12h': 1.00, '24h': 1.00, '48h': 1.00, '72h': 1.00, '7d': 1.00 },

    { service: 'Shadow Creation', tier: 'S', tierLabel: 'Simple', procMin: '3', procMax: '5', '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '5', procMax: '10', '12h': 0.77, '24h': 0.59, '48h': 0.53, '72h': 0.50, '7d': 0.47 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '10', procMax: '20', '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },

    { service: 'Manipulation', tier: 'S', tierLabel: 'Simple', procMin: '30', procMax: '1h', '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '1h', procMax: '2h 30m', '12h': 11.69, '24h': 8.99, '48h': 8.09, '72h': 7.64, '7d': 7.19 },

    { service: 'Retouching', tier: 'Basic', tierLabel: 'Basic', procMin: '6', procMax: '10', '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 },
    { service: '', tier: 'Advanced', tierLabel: 'Advanced', procMin: '10', procMax: '25', '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
    { service: '', tier: 'High-end', tierLabel: 'High-end / Editorial', procMin: '25', procMax: '1h 20m', '12h': 5.20, '24h': 4.00, '48h': 3.60, '72h': 3.40, '7d': 3.20 },

    { service: 'Jewelry Retouch', tier: 'Basic', tierLabel: 'Basic', procMin: '6', procMax: '10', '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 },
    { service: '', tier: 'Advanced', tierLabel: 'Advanced', procMin: '10', procMax: '25', '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
    { service: '', tier: 'High-end', tierLabel: 'High-end / Editorial', procMin: '25', procMax: '1h 20m', '12h': 6.50, '24h': 5.00, '48h': 4.50, '72h': 4.25, '7d': 4.00 },

    { service: 'Garment Retouch', tier: 'S', tierLabel: 'Simple', procMin: '5', procMax: '7', '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '7', procMax: '15', '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '15', procMax: '30', '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },

    { service: 'Model Retouch', tier: 'S', tierLabel: 'Simple', procMin: '5', procMax: '7', '12h': 1.56, '24h': 1.20, '48h': 1.08, '72h': 1.02, '7d': 0.96 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '7', procMax: '30', '12h': 2.86, '24h': 2.20, '48h': 1.98, '72h': 1.87, '7d': 1.76 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '30', procMax: '1h', '12h': 4.67, '24h': 3.59, '48h': 3.23, '72h': 3.05, '7d': 2.87 },

    { service: 'Ghost Mannequin', tier: 'S', tierLabel: 'Simple', procMin: '10', procMax: '20', '12h': 1.11, '24h': 0.85, '48h': 0.77, '72h': 0.72, '7d': 0.68 },
    { service: '', tier: 'M', tierLabel: 'Medium', procMin: '20', procMax: '40', '12h': 2.46, '24h': 1.89, '48h': 1.70, '72h': 1.61, '7d': 1.51 },
    { service: '', tier: 'C', tierLabel: 'Complex', procMin: '40', procMax: '1h 20m', '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 },
  ],
};

const PRICING_PLANS_DEFAULTS = {
  plans: [
    { name: 'Marketplace Ready', price: 0.49, perUnit: 'per image', services: ['Background Removal', 'Shadow Creation', 'Color Correction'], savings: 'Save ~15%', popular: false },
    { name: 'Ghost Mannequin Complete', price: 1.54, perUnit: 'per image', services: ['Ghost Mannequin', 'Garment Retouch', 'Color Correction', 'Background Removal'], savings: 'Save ~11%', popular: true },
    { name: 'Jewelry Essentials', price: 1.54, perUnit: 'per image', services: ['Background Removal', 'Jewelry Retouch', 'Shadow Creation'], savings: 'Save ~12%', popular: false },
    { name: 'Garment Perfection', price: 0.89, perUnit: 'per image', services: ['Garment Retouch', 'Background Removal', 'Color Correction'], savings: 'Save ~10%', popular: false },
    { name: 'High-End Editorial', price: 2.99, perUnit: 'per image', services: ['High-End Retouch', 'Manipulation', 'Color Correction', 'Background Removal'], savings: 'Save ~18%', popular: false },
    { name: 'Custom Volume', price: null, perUnit: '500+ images/mo', services: ['Custom service mix', 'Dedicated editor', 'Priority turnaround', 'Volume discounts'], savings: 'Best value', popular: false },
  ],
};

const ABOUT_PAGE_DEFAULTS = {
  heading: 'Built different.',
  subheading: 'On purpose.',
  description: "Image editing hasn't changed in 20 years. Reframe looked at all of it and started over.",
  values: [
    { title: 'Transparency', desc: 'Review-first model. Side-by-side comparison. Complete control.' },
    { title: 'Human Craft', desc: 'Every image is edited by a trained specialist. AI assists, humans perfect.' },
    { title: 'Quality Obsessed', desc: 'Triple-checked QA pipeline. Every image passes through 2+ lead editors before delivery.' },
    { title: 'Your Timeline', desc: 'You choose the turnaround: 24h, 48h, or 72h. Your schedule, your pricing.' },
  ],
};

const INSIGHTS_PAGE_DEFAULTS = {
  heading: 'Blog &',
  subheading: 'answers.',
  description: 'The data, the details, the everything.',
};

const FREE_TRIAL_DEFAULTS = {
  heading: 'Start Your',
  subheading: 'Trial.',
  ctaLabel: 'Start Your Free Task',
  ctaSubtext: '24h Turnaround Guaranteed',
  successHeading: 'All Set.',
  successText: 'Returning you back to the platform...',
  successButton: 'Back to Website',
};

const BOOK_MEETING_DEFAULTS = {
  label: 'Schedule',
  heading: "Let's",
  subheading: 'Connect.',
  description: 'Book a walkthrough with our systems team. No commitment, just clarity.',
  ctaLabel: 'Book a Meeting',
  ctaSubtext: 'Free · No commitment · 30 min call',
  successHeading: 'Booked.',
  successText: "We'll reach out within 24 hours to schedule your walkthrough.",
  successButton: 'Back to Website',
};

const SERVICE_DETAIL_DEFAULTS = {
  ctaLabel: 'Try Free - 3 Image Edits',
  relatedHeading: 'Related Services',
  bottomHeading: 'Professional editing.',
  bottomSubheading: 'Ready when you are.',
  bottomDescription: 'Human editors, QA review, and unlimited revisions on every order.',
  bottomCta: 'Get 3 Image Edits Free',
  trustItems: ['Manual Masking', 'QA Verification', 'Bulk Processing', '7d Saver Option'],
};

const IMAGES_DEFAULTS = {
  heroImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop',
  ctaBackground: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2000',
  footerBackground: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000',
  aboutImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
};

// ─── Combine all defaults ───

export const ALL_SECTION_DEFAULTS: Record<string, Record<string, any>> = {
  hero: HERO_DEFAULTS,
  ticker: TICKER_DEFAULTS,
  stats: STATS_DEFAULTS,
  faq: FAQ_DEFAULTS,
  differentiators: DIFFERENTIATORS_DEFAULTS,
  workflow: WORKFLOW_DEFAULTS,
  integrations: INTEGRATIONS_DEFAULTS,
  cta: CTA_DEFAULTS,
  navigation: NAVIGATION_DEFAULTS,
  footer: FOOTER_DEFAULTS,
  chatWidget: CHAT_WIDGET_DEFAULTS,
  servicesPage: SERVICES_PAGE_DEFAULTS,
  pricingPage: PRICING_PAGE_DEFAULTS,
  aboutPage: ABOUT_PAGE_DEFAULTS,
  insightsPage: INSIGHTS_PAGE_DEFAULTS,
  freeTrial: FREE_TRIAL_DEFAULTS,
  bookMeeting: BOOK_MEETING_DEFAULTS,
  serviceDetail: SERVICE_DETAIL_DEFAULTS,
  images: IMAGES_DEFAULTS,
  services: SERVICES_DEFAULTS,
  bundles: BUNDLES_DEFAULTS,
  pricingMatrix: PRICING_MATRIX_DEFAULTS,
  pricingPlans: PRICING_PLANS_DEFAULTS,
  servicesLanding: SERVICES_LANDING_DEFAULTS,
};

