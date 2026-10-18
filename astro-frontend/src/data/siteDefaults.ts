// Copied from context/ContentContext.tsx so server-rendered Astro components can use CMS defaults without React context.
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
