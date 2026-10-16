import React, { useState, useEffect, useCallback } from 'react';
import { ContentContext } from './ContentBase';
import { AdminSectionMeta, ThemeSettings, DEFAULT_THEME } from '../admin/types';
import { sectionsAPI, themeAPI, authAPI } from '../services/api';
import { portalApi } from '../services/portalApi';
import { isExcludedService } from './ServicesContext';

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

const FOOTER_DEFAULTS = {
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

const ALL_SECTION_DEFAULTS: Record<string, Record<string, any>> = {
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

// ─── Context Types ───

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  customerCode?: string;
  isGuest?: boolean;
  onboardingCompleted?: boolean;
  role?: string;
  companyName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  industry?: string | null;
  avatarUrl?: string | null;
}

export interface ChangedField {
  sectionId: string;
  sectionLabel: string;
  fieldKey: string;
  oldValue: any;
  newValue: any;
}

// ─── Apply theme CSS variables to :root ───

function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement;

  // Convert hex to RGB for shadow effects
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '233, 116, 81';
  };

  // Fonts
  root.style.setProperty('--font-heading', `'${theme.fonts.heading}', sans-serif`);
  root.style.setProperty('--font-body', `'${theme.fonts.body}', sans-serif`);
  root.style.setProperty('--font-mono', `'${theme.fonts.mono}', monospace`);

  // Colors
  root.style.setProperty('--brand', theme.colors.brand);
  root.style.setProperty('--brand-rgb', hexToRgb(theme.colors.brand));
  root.style.setProperty('--brand-hover', theme.colors.brandHover);
  root.style.setProperty('--brand-hover-rgb', hexToRgb(theme.colors.brandHover));
  root.style.setProperty('--surface', '#FFFFFF'); // FORCE pure white
  root.style.setProperty('--onyx', theme.colors.onyx);
  root.style.setProperty('--cat-foundation', theme.colors.categoryFoundation);
  root.style.setProperty('--cat-enhancement', theme.colors.categoryEnhancement);
  root.style.setProperty('--cat-retouch', theme.colors.categoryRetouch);
  root.style.setProperty('--cat-advanced', theme.colors.categoryAdvanced);
  root.style.setProperty('--ambient-orb', theme.colors.ambientOrb);
  root.style.setProperty('--chat-bubbles', theme.colors.chatBubbles);
  root.style.setProperty('--footer-dark', theme.colors.footerDark);
  root.style.setProperty('--accent-lavender', theme.colors.accentLavender);

  // Typography
  root.style.setProperty('--base-font-size', `${theme.typography.baseFontSize}px`);
  root.style.setProperty('--heading-scale', String(theme.typography.headingScale));
  root.style.setProperty('--line-height', String(theme.typography.lineHeight));
  root.style.setProperty('--letter-spacing', `${theme.typography.letterSpacing}em`);

  // Radius
  root.style.setProperty('--radius-sm', `${theme.radius.sm}px`);
  root.style.setProperty('--radius-md', `${theme.radius.md}px`);
  root.style.setProperty('--radius-lg', `${theme.radius.lg}px`);
  root.style.setProperty('--radius-xl', `${theme.radius.xl}px`);

  // Dynamically load fonts from Google Fonts (only for Google Fonts, not Fontshare)
  const googleFonts = ['Google Sans', 'DM Sans', 'JetBrains Mono', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Raleway', 'Oswald', 'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Ubuntu', 'PT Sans', 'Crimson Text', 'Work Sans', 'Karla', 'Libre Baskerville'];
  
  const allFonts = [
    theme.fonts.heading,
    theme.fonts.body,
    theme.fonts.mono,
  ];
  
  const fontsToLoad = allFonts
    .filter((f, i, arr) => arr.indexOf(f) === i)
    .filter(f => googleFonts.some(gf => f.toLowerCase().includes(gf.toLowerCase())));
  
  if (fontsToLoad.length === 0) return; // Skip if all fonts are from Fontshare
  
  const weights = '300;400;500;600;700;800;900';
  const fontFamilies = fontsToLoad
    .map(f => `family=${f.replace(/ /g, '+')}:wght@${weights}`)
    .join('&');

  const href = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

  const existing = document.getElementById('dynamic-fonts');
  if (existing) existing.remove();

  const link = document.createElement('link');
  link.id = 'dynamic-fonts';
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// ─── Provider ───

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<Record<string, Record<string, any>>>(() => {
    try {
      const saved = localStorage.getItem('reframe-content');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<string, Record<string, any>> = {};
        for (const [key, defaults] of Object.entries(ALL_SECTION_DEFAULTS)) {
          merged[key] = { ...defaults, ...(parsed[key] || {}) };
        }
        for (const [key, value] of Object.entries(parsed)) {
          if (!merged[key]) {
            merged[key] = value as Record<string, any>;
          }
        }
        if (merged.hero?.cta1Label === 'Get 3 Image Edits Free' || merged.hero?.cta1Label === 'Get your Free trial') {
          merged.hero.cta1Label = 'Get Your Free Trial';
        }
        if (merged.services?.services && Array.isArray(merged.services.services)) {
          merged.services.services = merged.services.services.filter((s: any) => !isExcludedService(s));
        }
        if (merged.pricingMatrix?.rows && Array.isArray(merged.pricingMatrix.rows)) {
          let currentService = '';
          merged.pricingMatrix.rows = merged.pricingMatrix.rows.filter((row: any) => {
            if (row.service) currentService = row.service;
            return !isExcludedService({ name: currentService });
          });
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load content from localStorage:', e);
    }
    return { ...ALL_SECTION_DEFAULTS };
  });

  const [theme, setThemeState] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('reframe-theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force update old surface color to new one
        if (parsed.colors?.surface === '#F8F9FD' || parsed.colors?.surface === '#F5F2ED') {
          parsed.colors.surface = '#FFFFFF';
          localStorage.setItem('reframe-theme', JSON.stringify(parsed));
        }
        return {
          fonts: { heading: 'Google Sans', body: 'Google Sans', mono: 'JetBrains Mono' },
          colors: { 
            ...DEFAULT_THEME.colors, 
            ...parsed.colors,
            surface: '#FFFFFF', // Always force pure white
          },
          typography: { ...DEFAULT_THEME.typography, ...parsed.typography },
          radius: { ...DEFAULT_THEME.radius, ...parsed.radius },
        };
      }
    } catch (e) {
      console.warn('Failed to load theme from localStorage:', e);
    }
    return {
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        surface: '#FFFFFF', // Force pure white
      },
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  // Initial session validation
  useEffect(() => {
    if (isAdminRoute) {
      setIsAuthChecking(false);
      return;
    }

    const validateSession = async () => {
      const adminToken = localStorage.getItem('reframe-token');
      const portalToken = localStorage.getItem('portal_token');
      const savedUser = localStorage.getItem('reframe-current-user');
      
      if (!adminToken && !portalToken) {
        localStorage.removeItem('reframe-current-user');
        localStorage.removeItem('reframe-auth');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsAuthChecking(false);
        return;
      }

      try {
        // Do not trust cached users before backend validation. A stale saved
        // user was making first-time/guest visitors look logged in.

        if (portalToken) {
          const response = await portalApi.getMe();
          if (response.data && response.data.success && response.data.data && !response.data.data.isGuest) {
            const user = response.data.data;
            const cached = savedUser ? JSON.parse(savedUser) : {};
            setCurrentUser({ ...cached, ...user });
            setIsAuthenticated(true);
            localStorage.setItem('reframe-current-user', JSON.stringify({ ...cached, ...user }));
          } else {
            throw new Error('Invalid portal session');
          }
        } else if (adminToken && savedUser) {
          setCurrentUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } else {
          throw new Error('Invalid session');
        }
      } catch (err) {
        console.warn('Session validation failed, clearing stale auth:', err);
        localStorage.removeItem('reframe-token');
        localStorage.removeItem('portal_token');
        localStorage.removeItem('reframe-current-user');
        localStorage.removeItem('reframe-auth');
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    validateSession();
  }, [isAdminRoute]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserAuthenticated = !!currentUser;

  const [registeredSections, setRegisteredSections] = useState<AdminSectionMeta[]>([]);

  // Auto-discover adminMeta from all modules (admin routes only).
  // Running this on public routes forces loading every page/admin chunk,
  // which can cause blank screens on low-memory mobile browsers.
  useEffect(() => {
    if (!isAdminRoute) {
      setRegisteredSections([]);
      return;
    }

    const discoverSections = async () => {
      try {
        // Only scan relevant directories to save memory/time
        const modules = import.meta.glob(['../sections/*.tsx', '../admin/pages/*.tsx', '../pages/*.tsx']);
        const discovered: AdminSectionMeta[] = [];

        for (const path in modules) {
          try {
            const mod = await modules[path]() as any;
            if (mod && mod.adminMeta) {
              discovered.push(mod.adminMeta);
            }
          } catch (err) {
            // Silently skip modules that fail to load or have side effects
          }
        }
        setRegisteredSections(discovered);
      } catch (e) {
        console.warn('Auto-discovery failed:', e);
      }
    };

    discoverSections();
  }, [isAdminRoute]);

  // Check for portal session on mount
  useEffect(() => {
    if (isAdminRoute) return;

    const checkSession = async () => {
      // If user explicitly logged out, don't try to restore session
      if (localStorage.getItem('portal_logged_out') === 'true') return;
      // Auth lives in an httpOnly cookie — always call /me so a valid cookie
      // restores the session even if localStorage was cleared between reloads.
      try {
        const response = await portalApi.getMe();
        if (response.data.success && response.data.data && !response.data.data.isGuest) {
          setCurrentUser(response.data.data);
          setIsAuthenticated(true);
          localStorage.setItem('reframe-current-user', JSON.stringify(response.data.data));
          if (response.data.data.token) {
            localStorage.setItem('portal_token', response.data.data.token);
          }
        }
      } catch (err) {
        // Not logged in or session expired — silently ignore
      }
    };
    checkSession();
  }, [isAdminRoute]);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync with backend on mount (public theme loading)
  useEffect(() => {
    syncThemeWithBackend();
  }, []);

  // Sync with backend on mount if authenticated (full sync)
  useEffect(() => {
    if (isAuthenticated) {
      syncWithBackend();
    }
  }, [isAuthenticated]);

  const syncThemeWithBackend = useCallback(async () => {
    // Always try to load theme from backend (public endpoint)
    try {
      const themeResponse = await themeAPI.get();
      if (themeResponse.success && themeResponse.data) {
        // Backend now returns properly nested ThemeSettings structure
        setThemeState(themeResponse.data);
      }
    } catch (error) {
      console.warn('Failed to load theme from backend, using defaults:', error);
    }
  }, []);

  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch sections from backend
      const sectionsResponse = await sectionsAPI.getAll();
      if (sectionsResponse.success) {
        const backendSections: Record<string, Record<string, any>> = {};
        for (const section of sectionsResponse.data) {
          backendSections[section.sectionId] = section.content;
        }
        
        // Merge with defaults
        const merged: Record<string, Record<string, any>> = {};
        for (const [key, defaults] of Object.entries(ALL_SECTION_DEFAULTS)) {
          merged[key] = { ...defaults, ...(backendSections[key] || {}) };
        }
        if (merged.services?.services && Array.isArray(merged.services.services)) {
          merged.services.services = merged.services.services.filter((s: any) => !isExcludedService(s));
        }
        if (merged.pricingMatrix?.rows && Array.isArray(merged.pricingMatrix.rows)) {
          let currentService = '';
          merged.pricingMatrix.rows = merged.pricingMatrix.rows.filter((row: any) => {
            if (row.service) currentService = row.service;
            return !isExcludedService({ name: currentService });
          });
        }
        setSections(merged);
      }

      // Fetch theme from backend
      const themeResponse = await themeAPI.get();
      if (themeResponse.success) {
        const backendTheme = themeResponse.data;
        setThemeState(prev => ({
          fonts: { 
            heading: 'Google Sans',
            body: 'Google Sans',
            mono: 'JetBrains Mono',
          },
          colors: {
            brand: backendTheme.brand || prev.colors.brand,
            brandHover: backendTheme.brandHover || prev.colors.brandHover,
            surface: '#FFFFFF', // Force pure white
            onyx: backendTheme.onyx || prev.colors.onyx,
            categoryFoundation: backendTheme.categoryFoundation || prev.colors.categoryFoundation,
            categoryEnhancement: backendTheme.categoryEnhancement || prev.colors.categoryEnhancement,
            categoryRetouch: backendTheme.categoryRetouch || prev.colors.categoryRetouch,
            categoryAdvanced: backendTheme.categoryAdvanced || prev.colors.categoryAdvanced,
            ambientOrb: backendTheme.ambientOrb || prev.colors.ambientOrb,
            chatBubbles: backendTheme.chatBubbles || prev.colors.chatBubbles,
            footerDark: backendTheme.footerDark || prev.colors.footerDark,
            accentLavender: backendTheme.accentLavender || prev.colors.accentLavender,
          },
          typography: {
            baseFontSize: backendTheme.baseFontSize || prev.typography.baseFontSize,
            headingScale: backendTheme.headingScale || prev.typography.headingScale,
            lineHeight: backendTheme.lineHeight || prev.typography.lineHeight,
            letterSpacing: backendTheme.letterSpacing || prev.typography.letterSpacing,
          },
          radius: {
            sm: backendTheme.radiusSm || prev.radius.sm,
            md: backendTheme.radiusMd || prev.radius.md,
            lg: backendTheme.radiusLg || prev.radius.lg,
            xl: backendTheme.radiusXl || prev.radius.xl,
          },
        }));
      }
    } catch (err: any) {
      console.error('Failed to sync with backend:', err);
      setError(err.message || 'Failed to sync with backend');
      // Fallback to localStorage
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const getSectionContent = useCallback((id: string) => {
    return sections[id] || ALL_SECTION_DEFAULTS[id] || {};
  }, [sections]);

  const setSectionContent = useCallback((id: string, content: Record<string, any>) => {
    setSections(prev => ({ ...prev, [id]: content }));
    setIsDirty(true);
  }, []);

  const resetSection = useCallback((id: string) => {
    setSections(prev => ({
      ...prev,
      [id]: ALL_SECTION_DEFAULTS[id] ? { ...ALL_SECTION_DEFAULTS[id] } : {},
    }));
    setIsDirty(true);
  }, []);

  const setTheme = useCallback((partial: Partial<ThemeSettings>) => {
    setThemeState(prev => ({
      fonts: { ...prev.fonts, ...(partial.fonts || {}) },
      colors: { ...prev.colors, ...(partial.colors || {}) },
      typography: { ...prev.typography, ...(partial.typography || {}) },
      radius: { ...prev.radius, ...(partial.radius || {}) },
    }));
    setIsDirty(true);
  }, []);

  const resetTheme = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setIsDirty(true);
  }, []);


  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('reframe-auth');
    localStorage.removeItem('reframe-token');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('reframe-current-user');
  }, []);

  const userLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // 1. Try Portal Login (Customers)
      try {
        const portalResponse = await portalApi.login(email, password);
        if (portalResponse.data.success) {
          const user = portalResponse.data.data;
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('reframe-current-user', JSON.stringify(user));
          if (user.token) {
            localStorage.setItem('portal_token', user.token);
          }
          if (user.customerCode) {
            localStorage.setItem('customer_code', user.customerCode);
          }
          localStorage.removeItem('portal_logged_out');
          return { success: true };
        }
      } catch (portalErr: any) {
        // If it's a 401/403, it might be the wrong credentials for a customer, 
        // but we still want to try the Staff API.
      }

      // 2. Try Backend Auth API (Staff)
      const response = await authAPI.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('reframe-token', token);
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        
        setTimeout(() => syncWithBackend(), 100);
        return { success: true };
      }
      return { success: false, message: 'Invalid email or password' };
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: errorMessage };
    }
  }, [syncWithBackend]);

  const googleLogin = useCallback(async (credential: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.googleAuth(credential);
      if (response.data.success) {
        const user = response.data.data;
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('portal_token', user.token);
        }
        if (user.customerCode) {
          localStorage.setItem('customer_code', user.customerCode);
        }
        localStorage.removeItem('portal_logged_out');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Google sign-in failed' };
    } catch (err: any) {
      console.error('Google login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Google sign-in failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.register({ name, email, password });
      if (response.data.success) {
        const user = response.data.data;
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        if (user.token) {
          localStorage.setItem('portal_token', user.token);
        }
        if (user.customerCode) {
          localStorage.setItem('customer_code', user.customerCode);
        }
        localStorage.removeItem('portal_logged_out');
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Signup failed' };
    } catch (err: any) {
      console.error('Signup failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.forgotPassword(email);
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Request failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await portalApi.resetPassword(token, newPassword);
      return { success: response.data.success, message: response.data.message };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Reset failed';
      return { success: false, message: errorMessage };
    }
  }, []);

  const userLogout = useCallback(async () => {
    try {
      await portalApi.logout();
    } catch (err) {
      console.warn('Portal logout failed:', err);
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('reframe-current-user');
    localStorage.removeItem('reframe-token');
    localStorage.removeItem('portal_token');
    localStorage.removeItem('reframe-auth');
    localStorage.removeItem('customer_code');
    localStorage.removeItem('portal_guest_id');
    localStorage.removeItem('reframe_cs_conv_id');
    localStorage.removeItem('reframe_cs_messages');
    localStorage.removeItem('reframe_cs_last_admin_msg_id');
    localStorage.removeItem('reframe_cs_identity');
    localStorage.removeItem('reframe_cs_contact_captured');
    localStorage.setItem('portal_logged_out', 'true');
    window.dispatchEvent(new Event('portal-logout'));
  }, []);

  // ─── Global change tracking ───

  // Optimized deep equality check to replace expensive JSON.stringify
  const isEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
      return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) return false;
    }
    return true;
  }, []);

  const [savedSnapshot, setSavedSnapshot] = useState<{ sections: Record<string, Record<string, any>>; theme: ThemeSettings }>({
    sections: JSON.parse(JSON.stringify(sections)),
    theme: JSON.parse(JSON.stringify(theme)),
  });

  const hasUnsavedChanges = React.useMemo(() => {
    return isDirty;
  }, [isDirty]);

  const SECTION_LABELS: Record<string, string> = {
    hero: 'Hero Banner', ticker: 'Scrolling Bar', stats: 'Statistics',
    faq: 'Questions & Answers', differentiators: 'Why Us', workflow: 'How It Works',
    integrations: 'Integrations', cta: 'Call to Action', navigation: 'Top Menu',
    footer: 'Footer', chatWidget: 'Chat Assistant', services: 'All Services',
    bundles: 'Service Bundles', pricingMatrix: 'Price Table', pricingPlans: 'Pricing Cards',
    servicesPage: 'Services Page', pricingPage: 'Pricing Page', aboutPage: 'About Page',
    insightsPage: 'Blog Page', freeTrial: 'Free Trial Page', bookMeeting: 'Book Meeting Page',
    serviceDetail: 'Service Detail', images: 'Images & Links', usecases: 'Customer Scenarios',
  };

  const getChangedFields = useCallback((): ChangedField[] => {
    const changes: ChangedField[] = [];

    for (const [sectionId, current] of Object.entries(sections)) {
      const original = savedSnapshot.sections[sectionId];
      if (!original) {
        changes.push({ sectionId, sectionLabel: SECTION_LABELS[sectionId] || sectionId, fieldKey: '(entire section)', oldValue: null, newValue: current });
        continue;
      }
      for (const key of new Set([...Object.keys(current), ...Object.keys(original)])) {
        if (!isEqual(current[key], original[key])) {
          changes.push({
            sectionId,
            sectionLabel: SECTION_LABELS[sectionId] || sectionId,
            fieldKey: key,
            oldValue: original[key],
            newValue: current[key],
          });
        }
      }
    }

    if (!isEqual(theme, savedSnapshot.theme)) {
      for (const key of Object.keys(theme)) {
        const k = key as keyof ThemeSettings;
        if (!isEqual(theme[k], savedSnapshot.theme[k])) {
          changes.push({
            sectionId: 'theme',
            sectionLabel: 'Look & Feel',
            fieldKey: key,
            oldValue: savedSnapshot.theme[k],
            newValue: theme[k],
          });
        }
      }
    }

    return changes;
  }, [sections, theme, savedSnapshot, isEqual]);

  const saveAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Save to backend if authenticated and token exists
      const token = localStorage.getItem('reframe-token');
      if (token && isAuthenticated) {
        // Save all sections
        for (const [sectionId, content] of Object.entries(sections)) {
          try {
            await sectionsAPI.save(sectionId, SECTION_LABELS[sectionId] || sectionId, content);
          } catch (err) {
            console.warn(`Failed to save section ${sectionId} to backend:`, err);
          }
        }

        // Save theme
        try {
          await themeAPI.update({
            fontHeading: theme.fonts.heading,
            fontBody: theme.fonts.body,
            fontMono: theme.fonts.mono,
            brand: theme.colors.brand,
            brandHover: theme.colors.brandHover,
            surface: theme.colors.surface,
            onyx: theme.colors.onyx,
            categoryFoundation: theme.colors.categoryFoundation,
            categoryEnhancement: theme.colors.categoryEnhancement,
            categoryRetouch: theme.colors.categoryRetouch,
            categoryAdvanced: theme.colors.categoryAdvanced,
            ambientOrb: theme.colors.ambientOrb,
            chatBubbles: theme.colors.chatBubbles,
            footerDark: theme.colors.footerDark,
            accentLavender: theme.colors.accentLavender,
            baseFontSize: theme.typography.baseFontSize,
            headingScale: theme.typography.headingScale,
            lineHeight: theme.typography.lineHeight,
            letterSpacing: theme.typography.letterSpacing,
            radiusSm: theme.radius.sm,
            radiusMd: theme.radius.md,
            radiusLg: theme.radius.lg,
            radiusXl: theme.radius.xl,
          });
        } catch (err) {
          console.warn('Failed to save theme to backend:', err);
        }
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('reframe-content', JSON.stringify(sections));
      localStorage.setItem('reframe-theme', JSON.stringify(theme));
      applyTheme(theme);
      
      setSavedSnapshot({
        sections: JSON.parse(JSON.stringify(sections)),
        theme: JSON.parse(JSON.stringify(theme)),
      });
      setIsDirty(false);
    } catch (err: any) {
      console.error('Failed to save:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  }, [sections, theme, isAuthenticated]);

  const discardChanges = useCallback(() => {
    setSections(savedSnapshot.sections);
    setThemeState(savedSnapshot.theme);
    applyTheme(savedSnapshot.theme);
    setIsDirty(false);
  }, [savedSnapshot]);

  return (
    <ContentContext.Provider
      value={{
        sections,
        theme,
        isAuthenticated,
        currentUser,
        isUserAuthenticated,
        isAuthChecking,
        getSectionContent,
        setSectionContent,
        resetSection,
        setTheme,
        resetTheme,
        logout,
        signup,
        userLogin,
        googleLogin,
        userLogout,
        forgotPassword,
        resetPassword,
        setCurrentUser,
        registeredSections,
        allDefaults: ALL_SECTION_DEFAULTS,
        hasUnsavedChanges,
        getChangedFields,
        saveAll,
        discardChanges,
        savedSnapshot,
        isLoading,
        error,
        syncWithBackend,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};


