// Copied verbatim from backend/src/index.ts (SEO_META_BY_PATH, resolvePageSeo). Production meta source of truth.
import { SEO_SERVICES } from './seoServices';

export const SEO_META_BY_PATH: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Ecommerce Product Photo Editing for Catalog-Ready Images | Reframe Visuals',
    description: 'Get 3 free sample edits from Reframe Visuals. Human Photoshop editors and AI-assisted workflows for Amazon, apparel, jewelry, agencies, and ecommerce catalogs.',
  },
  '/services': {
    title: 'Services for Ecommerce Brands | Reframe Visuals',
    description: 'Explore ecommerce photo editing services built for consistent visual quality, faster launches, and stronger conversion performance across product catalogs.',
  },
  '/pricing': {
    title: 'Pricing for Ecommerce Brands | Reframe Visuals',
    description: 'View transparent pricing for ecommerce image editing with predictable quality, quick turnaround options, and scalable support for growing SKU volume.',
  },
  '/about': {
    title: 'About Reframe Visuals | E-commerce Photo Editing Team',
    description: 'Meet the Reframe Visuals team helping e-commerce brands ship high-converting product imagery with consistent quality, transparent process, and fast turnaround.',
  },
  '/portfolio': {
    title: 'Portfolio & Testimonials | Reframe Visuals',
    description: 'Explore before-and-after ecommerce photo edits and client feedback across background removal, clipping path, retouching, and color services.',
  },
  '/contact': {
    title: 'Contact Reframe Visuals | Start Your Editing Workflow',
    description: 'Contact Reframe Visuals to discuss image editing requirements, turnaround times, and quality standards for your brand.',
  },
  '/contact-us': {
    title: 'Contact Reframe Visuals | Start Your Editing Workflow',
    description: 'Reach out to Reframe Visuals for custom quotes, onboarding help, and support for high-volume product image editing.',
  },
  '/free-trial': {
    title: '3 Free Sample Edits for Ecommerce Product Photos | Reframe Visuals',
    description: 'Upload up to 3 product photos and review free sample edits before ordering. Built for Amazon, apparel, jewelry, agencies, and catalog teams.',
  },
  '/pilot-batch': {
    title: 'Test Batch Review | Reframe Visuals',
    description: 'Submit a paid test batch for service-specific review, output-format preferences, and complexity-based pricing confirmation.',
  },
  '/order/dedicated': {
    title: 'Dedicated Order Page | Reframe Visuals',
    description: 'Start a dedicated photo editing order with Reframe Visuals. Upload assets, set requirements, and submit a focused project brief from the same order flow.',
  },
  '/book-meeting': {
    title: 'Book Meeting for Ecommerce Brands | Reframe Visuals',
    description: 'Book a meeting to plan your ecommerce image workflow, service mix, QA standards, and turnaround requirements with the Reframe Visuals team.',
  },
  '/quote-builder': {
    title: 'Quote Builder for Ecommerce Brands | Reframe Visuals',
    description: 'Build a custom ecommerce photo editing quote by volume, complexity, and turnaround target to get a production-ready estimate for your team.',
  },
  '/case-studies': {
    title: 'Ecommerce Photo Editing Case Studies | Reframe Visuals',
    description: 'Explore real ecommerce image editing case studies with measurable outcomes in turnaround, quality consistency, and production scale.',
  },
  '/quality-assurance-process': {
    title: 'Quality Assurance Process for Ecommerce Image Editing | Reframe Visuals',
    description: 'Understand the quality assurance process Reframe Visuals uses to maintain consistent ecommerce image editing output at scale.',
  },
  '/turnaround-sla': {
    title: 'Turnaround SLA for Ecommerce Image Editing | Reframe Visuals',
    description: 'Review standard and rush turnaround SLA options for ecommerce product image editing workflows, including priority queues, quality checkpoints, and delivery expectations.',
  },
  '/who-is-reframe-visuals': {
    title: 'Who Is Reframe Visuals? | Ecommerce Photo Editing Studio',
    description: 'Reframe Visuals is a product photo editing and creative operations company for ecommerce brands, Amazon sellers, agencies, and studios.',
  },
  '/reframe-visuals-brand-facts': {
    title: 'Reframe Visuals Brand Facts | Official Entity Profile',
    description: 'Official Reframe Visuals entity facts: ecommerce photo editing studio, services, audiences, free sample edits, contact details, and disambiguation.',
  },
  '/free-sample-edit': {
    title: 'Free Sample Edit for Product Photos | Reframe Visuals',
    description: 'New Reframe Visuals customers can request 3 free sample product photo edits to review quality before placing a paid order.',
  },
  '/resources': {
    title: 'Ecommerce Photo Editing Resources | Reframe Visuals',
    description: 'Explore practical ecommerce image editing resources, checklists, pricing guides, and production workflows from Reframe Visuals.',
  },
  '/pixelz-alternative': {
    title: 'Pixelz Alternative | Human-Reviewed Ecommerce Photo Editing',
    description: 'Looking for a Pixelz alternative? Reframe Visuals offers manual Pen Tool editing, 12h turnaround, dual-stage QA, and 3 free sample edits.',
  },
  '/clipping-path-india-alternative': {
    title: 'Clipping Path India Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with clipping path India providers for manual Photoshop editing, QA review, fast turnaround, and ecommerce-ready results.',
  },
  '/cutoutwiz-alternative': {
    title: 'CutoutWiz Alternative | Reframe Visuals',
    description: 'Compare Reframe Visuals with CutoutWiz for ecommerce photo editing, manual QA, clipping path, retouching, and scalable catalog production.',
  },
  '/amazon-product-image-editing': {
    title: 'Amazon Product Image Editing | Reframe Visuals',
    description: 'Amazon Product Image Editing for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/shopify-product-photo-editing': {
    title: 'Shopify Product Photo Editing Service | Reframe Visuals',
    description: 'Shopify product photo editing for stronger PDP conversion, variant consistency, and theme-ready visual systems. Starting at $0.39/image with 24h turnaround.',
  },
  '/woocommerce-product-image-editing': {
    title: 'Woocommerce Product Image Editing | Reframe Visuals',
    description: 'Woocommerce Product Image Editing for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/fashion-photo-retouching-service': {
    title: 'Fashion Photo Retouching Service | Reframe Visuals',
    description: 'Fashion Photo Retouching Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/jewelry-photo-retouching-service': {
    title: 'Jewelry Photo Retouching Service | Reframe Visuals',
    description: 'Jewelry Photo Retouching Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/furniture-photo-editing-service': {
    title: 'Furniture Photo Editing Service | Reframe Visuals',
    description: 'Furniture Photo Editing Service for ecommerce brands focused on consistent visual quality, faster launches, and better conversion performance.',
  },
  '/us-photo-editing-service': {
    title: 'US Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Photo editing services for US ecommerce teams needing fast turnaround, consistent quality control, and scalable production support for growing catalogs.',
  },
  '/uk-photo-editing-service': {
    title: 'UK Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'UK-focused ecommerce image editing with consistent quality control, fast turnaround options, and reliable production support for growth-stage catalogs.',
  },
  '/canada-photo-editing-service': {
    title: 'Canada Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Scalable ecommerce photo editing support for Canadian brands, with category-specific workflows, quality assurance checks, and dependable bulk turnaround.',
  },
  '/australia-photo-editing-service': {
    title: 'Australia Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Australia-focused ecommerce image editing with quality-first workflows, launch-ready turnaround options, and dependable support for seasonal catalog peaks.',
  },
  '/uae-photo-editing-service': {
    title: 'UAE Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Premium ecommerce photo editing support for UAE brands needing high visual quality, predictable delivery windows, and conversion-focused catalog consistency.',
  },
  '/singapore-photo-editing-service': {
    title: 'Singapore Ecommerce Photo Editing Service | Reframe Visuals',
    description: 'Singapore ecommerce photo editing with fast delivery windows, consistent quality standards, and scalable production support for multi-channel sellers.',
  },
  '/ai-product-visuals': {
    title: 'AI Product Visuals for Ecommerce | Reframe Visuals',
    description: 'Generate PDP images, fashion photoshoots, lifestyle scenes, UGC-style ads, product videos, and catalog visuals from existing product assets with human-reviewed AI production.',
  },
  '/resources/amazon-image-compliance-checklist-2026': {
    title: 'Amazon Image Compliance Checklist 2026 | Reframe Visuals',
    description: 'A practical checklist to keep Amazon product images compliant while improving visual consistency and conversion readiness.',
  },
  '/resources/shopify-product-photography-conversion-playbook': {
    title: 'Ecommerce Product Photography Conversion Playbook | Reframe Visuals',
    description: 'A conversion-focused ecommerce product photography and post-production playbook with practical setup steps, visual standards, and rollout workflows for online brands.',
  },
  '/resources/ghost-mannequin-vs-flat-lay-when-to-use-each': {
    title: 'Ghost Mannequin vs Flat Lay: When to Use Each | Reframe Visuals',
    description: 'Compare ghost mannequin and flat lay approaches for ecommerce apparel imagery, with decision criteria, production implications, and conversion trade-offs.',
  },
  '/resources/how-to-scale-photo-editing-for-10000-skus': {
    title: 'How to Scale Photo Editing for 10,000 SKUs | Reframe Visuals',
    description: 'Framework for scaling ecommerce photo editing operations across large SKU catalogs without quality drift, including workflow design, QA checkpoints, and team handoffs.',
  },
  '/resources/jewelry-retouching-quality-checklist': {
    title: 'Jewelry Retouching Quality Checklist | Reframe Visuals',
    description: 'A practical quality checklist for jewelry retouching workflows focused on detail clarity, consistency standards, and trust-building visual accuracy.',
  },
  '/resources/ecommerce-image-sla-framework-for-growth-teams': {
    title: 'Ecommerce Image SLA Framework for Growth Teams | Reframe Visuals',
    description: 'Build an SLA framework for ecommerce image production to improve predictability, turnaround speed, and launch readiness across teams and seasonal demand spikes.',
  },
  '/blog': {
    title: 'E-commerce Photo Editing Blog & Guides | Reframe Visuals',
    description: 'Read practical guides on e-commerce product photography, retouching quality, marketplace compliance, and conversion-focused image strategy for growing brands.',
  },
};

const toTitleCase = (raw: string): string =>
  raw
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const titleToH1 = (title: string): string => {
  const clean = title.replace(/\s*\|\s*Reframe Visuals(?:\s+Insights)?\s*$/i, '').trim();
  return clean || 'Reframe Visuals';
};

const normalizeText = (value: string): string =>
  value
    .replace(/\\+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const clampAtWord = (value: string, max: number): string => {
  const clean = normalizeText(value);
  if (clean.length <= max) return clean;
  const truncated = clean.slice(0, max + 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 20 ? truncated.slice(0, lastSpace) : clean.slice(0, max)).trim()}…`;
};

const normalizeSeoTitle = (value: string): string => clampAtWord(value, 64);

const normalizeSeoDescription = (value: string, fallback: string): string => {
  const base = normalizeText(value || '');
  const usable = base.length >= 60 ? base : normalizeText(fallback);
  return clampAtWord(usable, 165);
};

export const resolvePageSeo = (pathname: string): { title: string; description: string } => {
  const normalized = pathname === '' ? '/' : pathname;
  if (SEO_META_BY_PATH[normalized]) return SEO_META_BY_PATH[normalized];

  if (normalized.startsWith('/services/')) {
    const parts = normalized.replace('/services/', '').split('/').filter(Boolean);
    const serviceSlug = parts[0] || 'service';
    const intentSlug = parts[1] || '';
    const serviceName = toTitleCase(serviceSlug);
    const service = SEO_SERVICES.find((item) => item.id === serviceSlug);

    if (intentSlug === 'best-for-ecommerce') {
      return {
        title: `${serviceName} Best for Ecommerce | Reframe Visuals`,
        description: `${serviceName} service best for ecommerce teams needing consistent product visuals, scalable QA, and conversion-ready delivery workflows.`,
      };
    }

    if (intentSlug === 'pricing-guide') {
      return {
        title: `${serviceName} Pricing Guide (US/UK/AU/EU) | Reframe Visuals`,
        description: `Practical ${serviceName.toLowerCase()} pricing guide for ecommerce teams: scope drivers, turnaround tradeoffs, and ways to optimize cost at scale.`,
      };
    }

    if (intentSlug === 'turnaround-quality') {
      return {
        title: `${serviceName} Turnaround and Quality | Reframe Visuals`,
        description: `${serviceName} turnaround and quality benchmarks for ecommerce operations teams balancing speed, accuracy, and listing consistency.`,
      };
    }

    return {
      title: service?.metaTitle || `${serviceName} Service | Reframe Visuals`,
      description: service?.metaDescription || `${serviceName} photo editing service for e-commerce brands. Improve consistency, speed, and conversion-ready visual quality with Reframe Visuals.`,
    };
  }

  if (normalized.startsWith('/blog/')) {
    return {
      title: 'Reframe Visuals Blog',
      description: 'Read practical guides on product visuals, editing workflows, and conversion-focused image strategy.',
    };
  }

  if (normalized.startsWith('/case-studies/')) {
    const slug = normalized.replace('/case-studies/', '').split('/').filter(Boolean)[0] || 'case-study';
    const name = toTitleCase(slug);
    const caseStudyDescriptions: Record<string, string> = {
      'amazon-accessories-sku-cleanup': 'Case study: Amazon accessories SKU cleanup that improved catalog consistency, reduced rejects, and accelerated listing-ready image delivery at scale.',
      'fashion-drop-48-hour-turnaround': 'Case study: 48-hour fashion drop production pipeline delivering high-volume retouching with on-time launch support and consistent visual output.',
      'jewelry-retouching-conversion-lift': 'Case study: precision jewelry retouching workflow that enhanced metal and gemstone detail while supporting stronger conversion performance.',
      'furniture-catalog-standardization': 'Case study: furniture catalog standardization across large SKU sets with consistent color, shadow, and framing for cleaner shopping experiences.',
      'marketplace-compliance-recovery': 'Case study: marketplace compliance recovery program that fixed image policy issues and restored approved, publish-ready product listings.',
      'shopify-seasonal-launch-sprint': 'Case study: seasonal launch sprint with rapid image processing, coordinated QA, and dependable turnaround for campaign deadlines.',
      'ghost-mannequin-scale-program': 'Case study: ghost mannequin scale program for apparel brands, improving fit presentation consistency and high-throughput production reliability.',
      'multi-brand-color-consistency': 'Case study: multi-brand color consistency initiative using calibrated editing workflows to unify product appearance across channels and campaigns.',
    };

    return {
      title: `Case Study: ${name} | Reframe Visuals`,
      description: caseStudyDescriptions[slug] || 'Real ecommerce image production case study with measurable outcomes in quality consistency, turnaround, and workflow efficiency.',
    };
  }

  if (normalized.startsWith('/resources/')) {
    const slug = normalized.replace('/resources/', '').split('/').filter(Boolean)[0] || 'resource';
    const name = toTitleCase(slug);
    return {
      title: `${name} | Reframe Visuals`,
      description: 'Practical ecommerce image production resource from Reframe Visuals focused on quality, speed, and conversion outcomes.',
    };
  }

  return {
    title: 'Reframe Visuals | Professional Photo Editing Services for E-commerce',
    description: 'Professional image editing services for e-commerce teams needing speed, consistency, and conversion-focused product visuals.',
  };
};
