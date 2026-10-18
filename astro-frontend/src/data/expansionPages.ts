export type ExpansionPage = {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  bullets: string[];
  faq: Array<{ q: string; a: string }>;
  ctaLabel: string;
  deepSections?: Array<{ title: string; subtitle?: string; content: string; keyPoints?: string[] }>;
};

export const INDUSTRY_PAGES: ExpansionPage[] = [
  {
    slug: 'amazon-product-image-editing',
    path: '/amazon-product-image-editing',
    title: 'Amazon Product Image Editing & Compliance Service | Reframe Visuals',
    description: 'Guaranteed Amazon-compliant image editing: pure white background RGB (255,255,255), 85%+ product frame fill, 2000px high-res zoom standards, and listing suppression prevention.',
    h1: 'Amazon Listing Image Editing & Compliance Service',
    intro: 'Amazon listing suppression caused by non-compliant hero images costs sellers organic rank, ad spend efficiency, and Buy Box visibility. Reframe Visuals provides guaranteed Amazon Seller Central and Vendor Central image compliance: pure white RGB (255, 255, 255) backgrounds, tight 85%+ frame fill, high-resolution zoom dimensions (2000px+), natural contact shadows, and secondary infographic shot editing that drives click-through and sales.',
    bullets: [
      'Guaranteed RGB (255, 255, 255) Pure White Backgrounds',
      '85%+ Frame Fill Ratio Optimization for Main Search Thumbnails',
      '1600px–3000px High-Resolution Zoom Compliance',
      'Secondary Infographic, Dimension & Callout Image Preparation',
      'Suppression Recovery & Fast 12h–24h Turnaround for Seasonal Catalogs',
      'Batch Variant Consistency Across Multi-ASIN Parent-Child Listings',
    ],
    deepSections: [
      {
        title: 'Main Hero Image Compliance (RGB 255, 255, 255)',
        subtitle: 'Zero-Tolerance Amazon Policy Compliance',
        content: 'Amazon algorithms automatically scan and suppress listings whose hero images contain off-white borders, gray halos, or environmental backdrops. Our manual Pen Tool paths isolate products with sub-pixel precision, dropping pure RGB 255, 255, 255 white behind the item while creating subtle, realistic contact shadows that prevent products from looking artificially flat or floating.',
        keyPoints: [
          'Certified RGB 255, 255, 255 background verified via automated color sampler',
          'Clean sub-pixel edge masking with no anti-aliasing color bleed',
          'Natural grounded contact shadow that passes automated Amazon audit bots',
        ],
      },
      {
        title: '85%+ Frame Fill & Zoom Dimensions',
        subtitle: 'Maximizing Search Impression Click-Through Rate',
        content: 'In Amazon search results, products that fill 85% or more of the image frame appear visibly larger and more prominent than competing listings. We crop, re-center, and output files formatted to 2000px × 2000px (1:1 square), enabling smooth 300% hover-to-zoom on desktop and crystal-clear pinch-to-zoom on the Amazon mobile app.',
        keyPoints: [
          'Strict 85% to 90% frame fill ratio to dominate SERP real estate',
          '2000px to 3000px high-resolution exports for fluid desktop hover-zoom',
          'Consistent vertical and horizontal alignment across entire variant catalogs',
        ],
      },
      {
        title: 'Listing Suppression Recovery & Fast SLA',
        subtitle: 'Turnaround Within 12 to 24 Hours',
        content: 'When Amazon flags an ASIN for image non-compliance, every hour of suppression represents lost revenue and declining organic keyword rank. Reframe Visuals offers express 12-hour turnaround queues to fix rejected hero images, re-export compliant masters, and get your listings back online and selling immediately.',
        keyPoints: [
          'Emergency priority processing for suppressed ASINs',
          'Detailed rejection diagnosis and remediation before re-submission',
          'Unlimited revisions until Seller Central approves the image',
        ],
      },
      {
        title: 'Secondary Infographic & Lifestyle Image Editing',
        subtitle: 'Conversion-Focused Supporting Gallery Assets',
        content: 'While image #1 must be pure white, images #2 through #7 drive the buying decision. We composite clean product cutouts into curated lifestyle scenes, apply dimension annotations, create ingredient/feature callout graphics, and design comparison charts that answer buyer objections before they bounce.',
        keyPoints: [
          'Dimension and scale indicator overlays with clean brand typography',
          'Feature callout callouts highlighting key selling points and materials',
          'Packaging and included accessories compositing for multi-item sets',
        ],
      },
    ],
    faq: [
      { q: 'What are Amazon’s main image requirements for 2026?', a: 'Amazon requires main hero images to feature a pure white background (RGB 255, 255, 255), have the product occupy at least 85% of the frame, have no text, logos, borders, or mannequins, and be at least 1,600 pixels on the longest side (2,000px recommended for high-res zoom).' },
      { q: 'How do you ensure main images never trigger Amazon listing suppression?', a: 'Every image is clipped by hand using the Photoshop Pen Tool, placed on a verified RGB (255, 255, 255) background, inspected for edge halos or color fringe, and verified with color sample probes before export.' },
      { q: 'Can you create natural drop shadows on Amazon white backgrounds?', a: 'Yes. We preserve or synthesize subtle contact and cast shadows directly beneath the product on the pure white canvas. This keeps the listing 100% Amazon-compliant while ensuring the product looks grounded and authentic.' },
      { q: 'Can you edit secondary images and infographic callouts?', a: 'Yes. We build dimension guides, feature breakdown cards, comparison graphics, and lifestyle background composites for secondary image slots #2 through #7.' },
      { q: 'How fast can you deliver Amazon photo edits for bulk catalogs?', a: 'We offer 12-hour express turnaround for urgent updates or suppressed ASINs, with 24-hour standard and 48-hour relaxed options for large multi-ASIN product catalogs.' },
    ],
    ctaLabel: 'Start Amazon-ready free trial',
  },
  {
    slug: 'shopify-product-photo-editing',
    path: '/shopify-product-photo-editing',
    title: 'Shopify Product Photo Editing Service | Reframe Visuals',
    description: 'Shopify product photo editing for stronger PDP conversion, variant consistency, and theme-ready visual systems. Starting at $0.39/image with 24h turnaround.',
    h1: 'Shopify Product Photo Editing Service',
    intro: 'Create conversion-ready Shopify product visuals with clean background removal, consistent style, and variant-ready exports tuned to your theme.',
    bullets: ['Theme-consistent visual output', 'Variant-ready exports for all SKUs', 'Turnaround tuned for Shopify launch cadence'],
    faq: [
      { q: 'Can you edit Shopify product images by collection or campaign?', a: 'Yes. We process Shopify images by collection, campaign, or launch window with consistent editing guidelines applied across all variants.' },
      { q: 'Do you support recurring Shopify catalog refreshes?', a: 'Yes. We support recurring edits for promotions, seasonal Shopify updates, and new product drops with SLA-backed turnaround.' },
    ],
    ctaLabel: 'Start Shopify free trial',
  },
  {
    slug: 'woocommerce-product-image-editing',
    path: '/woocommerce-product-image-editing',
    title: 'WooCommerce Catalog Image Editing Workflow | Reframe Visuals',
    description: 'WooCommerce product image editing built for catalog operations, consistent thumbnails, and scalable update cycles.',
    h1: 'WooCommerce Catalog Product Image Editing',
    intro: 'Keep WooCommerce catalogs visually consistent while moving quickly on new products and promotions.',
    bullets: ['Storefront-ready image sets', 'Consistent style across categories', 'Flexible batch processing'],
    faq: [
      { q: 'Can you match our existing product style?', a: 'Yes. We build to your brand guidelines and reference outputs to keep storefront consistency.' },
      { q: 'Do you support mixed service requests?', a: 'Yes. We combine clipping, retouching, and color corrections in one workflow.' },
    ],
    ctaLabel: 'Book WooCommerce workflow call',
  },
  {
    slug: 'fashion-photo-retouching-service',
    path: '/fashion-photo-retouching-service',
    title: 'Fashion Photo Retouching Service | Reframe Visuals',
    description: 'Fashion-focused photo retouching for apparel brands requiring texture-safe skin cleanup, color consistency, and fast campaign support.',
    h1: 'Fashion Photo Retouching Service',
    intro: 'Apparel retouching that preserves fabric texture, corrects color, and ships on your launch schedule.',
    bullets: ['Texture-preserving retouching', 'Color consistency across collections', 'Ghost mannequin and shape correction'],
    faq: [
      { q: 'Do you preserve fabric texture?', a: 'Yes. Our workflow prioritizes natural texture and realistic garment representation.' },
      { q: 'Can you support lookbook and PDP outputs together?', a: 'Yes. We adapt outputs for both commerce and campaign use cases.' },
    ],
    ctaLabel: 'Start fashion free trial',
  },
  {
    slug: 'jewelry-photo-retouching-service',
    path: '/jewelry-photo-retouching-service',
    title: 'Jewelry Photo Retouching Service for E-commerce | Reframe Visuals',
    description: 'Specialized jewelry photo retouching: focus stacking (10-50 frames), gemstone fire restoration, metal polish, scratch/dust removal, and 500% macro inspection with 24h turnaround.',
    h1: 'Jewelry Photo Retouching Service for Luxury Brands & E-commerce',
    intro: 'Jewelry is the most demanding category in e-commerce photography. At 500% macro zoom, microscopic scratches, fingerprints, dust particles, and reflections on high-polish gold or silver can destroy the perceived value of a luxury piece. Reframe Visuals provides publication-grade jewelry photo retouching that restores brilliance, neutralizes unwanted studio reflections, and renders razor-sharp gemstone facets while preserving natural metallic warmth.',
    bullets: [
      'Focus Stacking & Depth of Field Compositing (10–50 shot alignment)',
      'Gemstone Fire, Facet Contrast & Color Purity Restoration',
      'Metal Smoothing, Reflection Control & Hallmarking Preservation',
      '500% Macro Inspection for Micro-Dust & Bench Scratches',
      'Natural Drop & Contact Shadow Creation for White PDPs',
      'Batch Consistency for Collections, Variants & Marketplace Zooms',
    ],
    deepSections: [
      {
        title: 'Focus Stacking & Edge-to-Edge Sharpness',
        subtitle: '10 to 50 Shot Focus Plane Blending',
        content: 'Physical camera lenses have extremely shallow depth of field when capturing macro jewelry. Even at f/11, either the front prongs or the rear shank will be blurred. Our editors composite bracketed multi-focus captures, meticulously aligning each focus slice and painting clean transitions along edge boundaries so that every facet, prong, and engraving is pin-sharp across the entire piece.',
        keyPoints: [
          'Sub-pixel image alignment compensating for lens breathing and focal shifts',
          'Manual mask feathering preventing ghosting or halo artifacts on stone facets',
          'Preservation of micro-engravings, hallmarks, and delicate pave settings',
        ],
      },
      {
        title: 'Gemstone Fire & Brilliance Restoration',
        subtitle: 'Preserving Natural Dispersion Without Cartoon Flatness',
        content: 'Studio lighting often blows out diamond tables or creates muddy, gray reflections in colored gemstones like emeralds, rubies, and sapphires. We independently adjust table reflections, pavilion contrast, and girdle highlights. We eliminate cloudy milkiness while ensuring stones never look like synthetic 3D CAD renders.',
        keyPoints: [
          'Individual facet contrast adjustment restoring internal light refraction',
          'Hue and saturation purity balancing for emeralds, tanzanites, and sapphires',
          'Custom catchlight synthesis accentuating natural brilliance on high-res PDPs',
        ],
      },
      {
        title: 'Precious Metal Polish & Reflection Control',
        subtitle: 'Neutralizing Studio Clutter on Mirror Finishes',
        content: 'Polished gold, platinum, and silver act like convex mirrors, capturing the camera lens, lightboxes, and room clutter. We neutralize distracting reflections and smooth out porous casting flaws, buffing wheel marks, and solder seams, replacing chaotic reflections with smooth, luxurious gradient transitions that reflect real craft.',
        keyPoints: [
          'Color temperature balancing between yellow gold, rose gold, white gold, and platinum',
          'Removal of photographer and studio environment reflections on curved shanks',
          'Smooth tone gradients that accentuate the volume and weight of the piece',
        ],
      },
      {
        title: '500% Zoom Macro Flaw Elimination',
        subtitle: 'Defect-Free Inspection for High-Ticket E-commerce',
        content: 'Shoppers zooming into a $3,000 diamond ring will spot any stray bench dust or polishing hair immediately. We inspect every image at 500% zoom, systematically cloning out lint, bench scratches, glue residue, and fingerprint oils without softening metal edges or blurring stone prongs.',
        keyPoints: [
          'Elimination of airborne dust, lint, and fingerprint smudges',
          'Preservation of sharp facet junctions and crisp metal edges',
          'Multi-monitor color calibration ensuring true metal and stone rendition',
        ],
      },
    ],
    faq: [
      { q: 'How do you handle focus stacking for macro jewelry shots?', a: 'You send us the bracketed RAW or TIFF sequence (typically 5 to 50 exposures taken at shifting focus points). We align the layers, blend the in-focus zones across every focal plane, and clean up any alignment artifacts so the entire piece is razor-sharp from front to back.' },
      { q: 'How do you prevent diamonds and gemstones from looking fake or cartoonish?', a: 'We never paint flat colors or use destructive AI smoothing over gemstones. Instead, we perform selective dodge-and-burn, restore facet-by-facet contrast, remove muddy gray reflections, and enhance natural brilliance while preserving the authentic stone anatomy.' },
      { q: 'Can you match color consistency across an entire fine jewelry collection?', a: 'Yes. We calibrate RGB values across metal types (e.g. 14k vs 18k yellow gold, rose gold, platinum) so that all rings, earrings, pendants, and bracelets in a collection display identical metal tones across your e-commerce catalog.' },
      { q: 'What resolution and zoom levels do you inspect for jewelry retouching?', a: 'Every piece is edited and inspected at 300% to 500% zoom on calibrated monitors. This guarantees that when customers use e-commerce hover-to-zoom on desktop or mobile, no flaws, dust specks, or edge halos are visible.' },
      { q: 'Do you provide white background RGB 255 compliance for luxury marketplaces?', a: 'Yes. We isolate the piece with a hand-drawn vector Pen Tool path, drop pure RGB (255, 255, 255) white behind it, and retain or synthesize a subtle, natural contact shadow or mirror reflection beneath the piece.' },
      { q: 'What turnaround times are available for bulk jewelry retouching orders?', a: 'We offer 12-hour express turnaround for urgent drops, 24-hour standard turnaround, and 48-hour relaxed options for large seasonal catalog batches.' },
      { q: 'Can I test your jewelry retouching quality before placing a volume order?', a: 'Yes. You can upload up to 3 jewelry images for a free sample edit. You will receive fully retouched production masters to evaluate our quality before committing to a paid order.' },
    ],
    ctaLabel: 'Get jewelry editing sample',
  },
  {
    slug: 'furniture-photo-editing-service',
    path: '/furniture-photo-editing-service',
    title: 'Furniture Photo Editing Service | Reframe Visuals',
    description: 'Furniture photo editing for perspective cleanup, color balancing, and catalog consistency across large product lines.',
    h1: 'Furniture Photo Editing Service',
    intro: 'Clean up perspective, replace backgrounds, and standardize shadows across large furniture SKU catalogs.',
    bullets: ['Perspective and alignment cleanup', 'Background replacement options', 'Batch editing for SKU-heavy catalogs'],
    faq: [
      { q: 'Can you keep dimensions visually accurate?', a: 'Yes. We preserve realistic proportions while improving presentation quality.' },
      { q: 'Do you support lifestyle and white background versions?', a: 'Yes. We can deliver multiple output variants per product.' },
    ],
    ctaLabel: 'Request furniture quote',
  },
];

export const GEO_PAGES: ExpansionPage[] = [
  { slug: 'us-photo-editing-service', path: '/us-photo-editing-service', title: 'US Ecommerce Photo Editing Service | Reframe Visuals', description: 'Photo editing service for US ecommerce teams needing reliable overnight turnaround and scalable QA workflows.', h1: 'US Ecommerce Photo Editing Service', intro: 'Built for US brands that need speed, quality control, and predictable output at scale.', bullets: ['Timezone-aligned communication', 'Launch-cycle friendly turnaround', 'Scalable quality control process'], faq: [{ q: 'Do you support US retail peaks?', a: 'Yes. We support peak-season surges and campaign-driven production cycles.' }, { q: 'Can we start with a pilot batch?', a: 'Yes. Most teams start with a controlled trial before scaling volume.' }], ctaLabel: 'Start US pilot batch' },
  { slug: 'uk-photo-editing-service', path: '/uk-photo-editing-service', title: 'UK Ecommerce Photo Editing Service | Reframe Visuals', description: 'UK-focused ecommerce photo editing for catalog consistency, rapid turnaround, and conversion-ready product presentation.', h1: 'UK Ecommerce Photo Editing Service', intro: 'Support UK ecommerce growth with reliable image production and consistent QA standards.', bullets: ['Retail-ready editing standards', 'Consistent output across categories', 'Flexible turnaround windows'], faq: [{ q: 'Can you follow UK marketplace image norms?', a: 'Yes. We align output for major UK ecommerce and marketplace requirements.' }, { q: 'Do you support recurring weekly volume?', a: 'Yes. We support recurring production cycles with SLA targets.' }], ctaLabel: 'Book UK onboarding call' },
  { slug: 'canada-photo-editing-service', path: '/canada-photo-editing-service', title: 'Canada Ecommerce Photo Editing Service | Reframe Visuals', description: 'Product photo editing for Canadian ecommerce teams needing fast, consistent, and scalable visual production support.', h1: 'Canada Ecommerce Photo Editing Service', intro: 'A reliable photo editing partner for Canadian brands scaling product catalogs.', bullets: ['Consistent cross-category quality', 'Fast turnaround for product launches', 'Support for multi-brand catalogs'], faq: [{ q: 'Do you handle bilingual packaging imagery?', a: 'Yes. We can preserve label clarity and packaging details for region-specific assets.' }, { q: 'Is there a minimum monthly volume?', a: 'No strict minimum. We support both pilot and scale stages.' }], ctaLabel: 'Start Canada free trial' },
  { slug: 'australia-photo-editing-service', path: '/australia-photo-editing-service', title: 'Australia Ecommerce Photo Editing Service | Reframe Visuals', description: 'Australia-focused ecommerce image editing with quality-first execution and turnaround plans for growing product catalogs.', h1: 'Australia Ecommerce Photo Editing Service', intro: 'Grow Australian ecommerce catalogs with predictable editing quality and efficient delivery cycles.', bullets: ['Campaign and catalog support', 'Consistent retouching standards', 'Fast turnaround options'], faq: [{ q: 'Can you support AU marketplace workflows?', a: 'Yes. We tailor outputs for marketplace and DTC catalog requirements.' }, { q: 'Do you support urgent launch timelines?', a: 'Yes. Rush handling is available for time-sensitive launches.' }], ctaLabel: 'Request AU quote' },
  { slug: 'uae-photo-editing-service', path: '/uae-photo-editing-service', title: 'UAE Ecommerce Photo Editing Service | Reframe Visuals', description: 'UAE ecommerce photo editing services for premium product presentation, quick turnarounds, and consistent QC.', h1: 'UAE Ecommerce Photo Editing Service', intro: 'Deliver premium visual quality for UAE ecommerce and luxury-focused product catalogs.', bullets: ['Premium retouching workflows', 'Consistent color and finish', 'Scalable delivery model'], faq: [{ q: 'Can you support luxury product retouching?', a: 'Yes. We handle detail-sensitive categories with premium visual standards.' }, { q: 'Do you manage high-volume SKU drops?', a: 'Yes. Our process is built for batch operations and launch windows.' }], ctaLabel: 'Start UAE pilot' },
  { slug: 'singapore-photo-editing-service', path: '/singapore-photo-editing-service', title: 'Singapore Ecommerce Photo Editing Service | Reframe Visuals', description: 'Singapore ecommerce image editing with fast delivery, high visual consistency, and production-ready output.', h1: 'Singapore Ecommerce Photo Editing Service', intro: 'Support Singapore ecommerce growth with reliable editing speed and quality assurance.', bullets: ['Consistent PDP image quality', 'Flexible SLA options', 'Workflow-ready batch handling'], faq: [{ q: 'Can you support omnichannel catalogs?', a: 'Yes. We deliver assets suitable for web, marketplace, and campaign channels.' }, { q: 'Do you offer a trial before scale?', a: 'Yes. We recommend a free trial or pilot batch before full rollout.' }], ctaLabel: 'Start Singapore trial' },
];

export const CASE_STUDIES = [
  'amazon-accessories-sku-cleanup','fashion-drop-48-hour-turnaround','jewelry-retouching-conversion-lift','furniture-catalog-standardization','marketplace-compliance-recovery','shopify-seasonal-launch-sprint','ghost-mannequin-scale-program','multi-brand-color-consistency'
].map((slug, i) => ({
  slug,
  path: `/case-studies/${slug}`,
  title: `Case Study: ${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} | Reframe Visuals`,
  h1: `Case Study: ${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
  description: 'Real ecommerce production workflow showing turnaround, quality controls, and measurable visual consistency outcomes.',
  outcome: i % 2 === 0 ? 'Reduced revision cycles by 34% while improving listing consistency.' : 'Cut production turnaround by 41% for launch-critical product batches.',
}));

export const INSIGHT_ARTICLES = [
  'amazon-image-compliance-checklist-2026',
  'shopify-product-photography-conversion-playbook',
  'ghost-mannequin-vs-flat-lay-when-to-use-each',
  'how-to-scale-photo-editing-for-10000-skus',
  'jewelry-retouching-quality-checklist',
  'ecommerce-image-sla-framework-for-growth-teams',
  'best-ecommerce-photo-editing-services-shopify-brands',
  'ghost-mannequin-editing-cost-guide',
  'background-removal-service-pricing-guide',
  'how-to-prepare-product-photos-for-amazon',
  'jewelry-retouching-checklist-for-ecommerce',
  'clipping-path-vs-background-removal',
  'in-house-vs-outsourced-product-photo-editing',
].map((slug) => ({
  slug,
  path: `/resources/${slug}`,
  title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} | Reframe Visuals`,
  h1: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  description: 'Practical ecommerce image production guide from Reframe Visuals focused on quality, speed, and conversion outcomes.',
}));
