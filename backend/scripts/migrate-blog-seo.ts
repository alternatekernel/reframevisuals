import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEO_DATA: Record<string, {
  metaTitle: string;
  metaDescription: string;
  focusKeywords: string;
  geoScope: string;
  geoRegions: string;
  hreflang: string;
  schemaType: string;
}> = {
  'art-of-background-removal': {
    metaTitle: 'Edge Quality & Background Removal: Convert Images',
    metaDescription: 'Find out why edge quality and background removal determine product image conversion. Learn pen paths, channel masks, and QA steps.',
    focusKeywords: 'background removal',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'ghost-mannequin-fit-and-conversion': {
    metaTitle: 'Ghost Mannequin Compositing: Fit and Conversion',
    metaDescription: 'Reduce return rates with ghost mannequin compositing. Learn how 3D silhouette images eliminate fit anxiety for clothing brands.',
    focusKeywords: 'ghost mannequin',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'human-eye-vs-ai-consistency': {
    metaTitle: 'Frequency Separation vs AI Retouching: The Cost',
    metaDescription: 'Compare frequency separation and AI skin/texture retouching. Understand the quality costs, speed gains, and editing trade-offs.',
    focusKeywords: 'frequency separation',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'color-accuracy-and-return-rates': {
    metaTitle: 'Color Accuracy and Return Rates: The Delta-E Guide',
    metaDescription: 'Reduce return rates from color mismatches using Delta-E color accuracy. Learn the measurement protocol for product photos.',
    focusKeywords: 'color accuracy',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'choosing-retouching-tiers': {
    metaTitle: 'How to Assign Retouching Tiers for Product Catalogs',
    metaDescription: 'Assign the right retouching tiers across your product catalog to optimize editing spend while maintaining premium visual quality.',
    focusKeywords: 'retouching tiers',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'the-physics-of-shadow-creation': {
    metaTitle: 'Shadow Creation Model for White Backgrounds',
    metaDescription: 'Master shadow creation using our 4-layer physics model. Ground products on pure white backgrounds naturally without clipping.',
    focusKeywords: 'shadow creation',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'jewelry-retouch-and-the-science-of-sparkle': {
    metaTitle: 'Jewelry Retouch Protocol: Sparkle and Precision',
    metaDescription: 'Learn the 5-stage jewelry retouch protocol for metal polishing, stone enhancement, focus stacking, and shadow correction.',
    focusKeywords: 'jewelry retouch',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'scaling-high-volume-photo-production': {
    metaTitle: 'Scale High-Volume Photo Production for 10,000+ SKUs',
    metaDescription: 'Build an automated high-volume photo production pipeline to manage, edit, and publish visual assets for large product catalogs.',
    focusKeywords: 'high-volume photo production',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'amazon-image-requirements-2026': {
    metaTitle: 'Amazon Image Requirements 2026: Complete Guide',
    metaDescription: 'Stay compliant with the latest Amazon image requirements in 2026. A technical guide for main images, secondary slots, and A+ content.',
    focusKeywords: 'amazon image requirements',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'shopify-image-optimization-speed': {
    metaTitle: 'Shopify Image Optimization: Fast & Sharp Images',
    metaDescription: 'Master Shopify image optimization to serve high-resolution product photos at speed. Learn responsive layouts, WebP/AVIF, and CDN setups.',
    focusKeywords: 'shopify image optimization',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'product-image-seo-google-shopping': {
    metaTitle: 'Product Image SEO: Google Search & Shopping Guide',
    metaDescription: 'Optimize your Google Shopping feed with a production workflow for product image SEO. Learn canonical image paths and alt tags.',
    focusKeywords: 'product image seo',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'ai-vs-human-photo-editing': {
    metaTitle: 'AI Photo Editing in 2026: Capabilities & Limits',
    metaDescription: 'Explore the state of AI photo editing in 2026. Learn where AI automation excels, where it fails, and what pixels it invents.',
    focusKeywords: 'ai photo editing',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'outsourcing-photo-editing-quality-framework': {
    metaTitle: 'Evaluate a Photo Editing Partner: 7-Point Framework',
    metaDescription: 'Our 7-point quality framework helps you evaluate a photo editing partner, balance unit cost, and guarantee catalog consistency.',
    focusKeywords: 'photo editing partner',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
  'ecommerce-photo-editing-sop-reduce-returns': {
    metaTitle: 'Ecommerce Photo Editing SOP: Reduce Return Rates',
    metaDescription: 'Implement a practical ecommerce photo editing SOP to keep product images premium and visually accurate while reducing return rates and boosting customer trust.',
    focusKeywords: 'ecommerce photo editing sop',
    geoScope: 'global',
    geoRegions: '',
    hreflang: 'en',
    schemaType: 'BlogPosting',
  },
};

async function main() {
  console.log('Starting blog SEO field migration...');

  let updated = 0;
  let notFound = 0;

  for (const [slug, seo] of Object.entries(SEO_DATA)) {
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) {
      console.warn(`  [NOT FOUND] slug: ${slug}`);
      notFound++;
      continue;
    }

    await prisma.post.update({
      where: { slug },
      data: {
        metaTitle: seo.metaTitle,
        metaDescription: seo.metaDescription,
        focusKeywords: seo.focusKeywords,
        geoScope: seo.geoScope,
        geoRegions: seo.geoRegions,
        hreflang: seo.hreflang,
        schemaType: seo.schemaType,
      },
    });

    console.log(`  [UPDATED] ${slug}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Not found: ${notFound}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
