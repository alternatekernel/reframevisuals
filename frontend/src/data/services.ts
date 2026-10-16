import {
  PenTool01Icon, PathIcon, ColorsIcon, PaintBucketIcon,
  Layers01Icon, PathfinderUniteIcon, RepairIcon, UngroupItemsIcon,
  MaterialAndTextureIcon, BrushIcon, Diamond01Icon,
  ClothesIcon, UserEdit01Icon, BackgroundIcon, AiEraserIcon,
  AiImageIcon, Video01Icon as VideoIcon, MagicWand01Icon as MagicWandIcon,
  TShirtIcon
} from 'hugeicons-react';
import { Camera as CameraIcon } from 'lucide-react';
import { SERVICE_PAGE_CONTENT } from './servicePageContent';

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_800/reframe/services/';

export interface Category {
  id: string;
  label: string;
  desc: string;
  color: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  icon: any;
  description: string;
  detail: string;
  includes: string[];
  bestFor: string;
  keywords: string[];
  beforeImage?: string;
  afterImage?: string;
  examples?: { before: string; after: string; label?: string }[];
  metaTitle?: string;
  metaDescription?: string;
  searchTerms?: string[];
  capabilities?: { title: string; desc: string }[];
  precisionMetrics?: string[];
  faqs?: { q: string; a: string }[];
  hidden?: boolean;
  servicePageContent?: import('./servicePageContent').ServicePageContent;
}

export interface Bundle {
  id: string;
  name: string;
  price: number;
  serviceIds: string[];
  description: string;
  savings: string;
  highlight?: boolean;
  keywords: string[];
}

export const SERVICE_DISPLAY_ORDER: string[] = [
  'background-removal',
  'shadow-creation',
  'clipping-path',
  'multi-clipping-path',
  'retouching',
  'model-retouch',
  'garment-retouch',
  'jewelry-retouch',
  'ghost-mannequin',
  'color-change',
  'color-correction',
  'pattern-change',
  'raster-to-vector',
  'ai-product-photography',
  'ai-video-generation',
  'manipulation',
  'sketch-to-reality',
];

const SERVICE_ORDER_INDEX = new Map(SERVICE_DISPLAY_ORDER.map((id, index) => [id, index]));

export const sortServicesByDisplayOrder = <T extends { id: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const ai = SERVICE_ORDER_INDEX.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bi = SERVICE_ORDER_INDEX.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id);
  });
};

const LEGACY_SERVICE_ALIASES: Record<string, string> = {
  'ai-editing-fixing': 'ai-product-photography',
  'jewelry-retouching': 'jewelry-retouch',
  'product-photo-retouching': 'high-end-retouch',
};

export const CATEGORIES: Category[] = [
  { id: 'foundation', label: 'Foundation', desc: 'Core cleanup & extraction', color: '#EA580C' },
  { id: 'enhancement', label: 'Enhancement', desc: 'Depth & dimension', color: '#0284C7' },
  { id: 'retouch', label: 'Retouch', desc: 'Pixel-perfect polish', color: '#16A34A' },
  { id: 'advanced', label: 'Advanced', desc: 'Specialized workflows', color: '#7C3AED' },
  { id: 'ai-driven', label: 'AI-Driven', desc: 'Next-gen intelligence', color: '#A855F7' },
];

export const SERVICES: Service[] = [
  {
    id: 'background-removal',
    metaTitle: 'Bulk Background Removal Service | Reframe',
    metaDescription: 'Outsourced bulk product background removal with manual Pen Tool precision. Pure white or transparent output, 12h turnaround, Amazon compliant.',
    focusKeywords: 'background removal',
    geoScope: 'local',
    geoRegions: 'USA',
    hreflang: 'en-US',
    capabilities: [
      { title: "Manual Edge Tracing", desc: "100% human-operated Pen Tool masking for pixel-perfect edges, even on complex hair, fur, or transparent materials." },
      { title: "Marketplace Compliance", desc: "Strict adherence to Amazon, major ecommerce platforms, and eBay image standards with pure white (RGB 255) backgrounds." },
      { title: "Alpha Channel Transparency", desc: "Flawless transparent PNG or layered TIFF output for versatile multi-channel marketing use." },
      { title: "Bulk Batch Consistency", desc: "Consistent margins, alignment, and edge treatment across full catalog batches." }
    ],
    precisionMetrics: [
      '"Amazon & storefront-compliant output"',
      '"Bulk catalog batch support"',
      '"Manual Pen Tool on every path"'
    ],
    faqs: [
      { q: "What is needed to get started with background removal?", a: "Original images in any format are typically provided to begin the process. Higher-resolution images help achieve cleaner edges, but standard or low-quality images can also be processed effectively. Background preferences such as white, transparent, or custom should be specified in advance." },
      { q: "Can complex edges like hair or transparent objects be handled?", a: "Yes, complex cutouts are handled using advanced masking and manual refinement. This includes hair, fur, glass, and fine details where automated tools are not sufficient." },
      { q: "How is consistency maintained across multiple images?", a: "Consistency is maintained through a structured editing workflow that includes clipping path, manual edge refinement, proper feathering, and export settings to ensure uniform results." },
      { q: "What file formats are delivered after editing?", a: "Final images can be delivered in formats such as JPEG, PNG, TIFF, or PSD based on requirements." },
      { q: "What additional services can improve the final result?", a: "Background removal can be combined with Retouching to clean imperfections and improve appearance of the images. Also adding Shadow can create more depth making highly appealing for e-commerce. You can always add more services after uploading your images." },
      { q: "Are images optimized for ecommerce platforms and Amazon?", a: "Yes, outputs can be optimized for ecommerce platforms, marketplaces, and social media." }
    ],
    name: 'Background Removal',
    price: 0.39,
    categoryId: 'foundation',
    icon: BackgroundIcon,
    description: 'Clean extraction of your product from any background.',
    detail: 'Eliminate distractions and draw complete focus to your product. Whether you need crisp white backgrounds for Amazon or transparent layers for dynamic web layouts, our expert editors meticulously trace every edge, including complex hair, fur, and transparent materials, to deliver studio-quality knock-outs.',
    includes: ['Manual edge tracing', 'Complex edge handling', 'White, transparent, or custom background'],
    bestFor: 'eCommerce, Amazon, online store product listings',
    keywords: ['background', 'remove', 'white', 'transparent', 'cutout', 'clipping'],
    beforeImage: `${CLOUDINARY_BASE}background-removal-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}background-removal-after.jpg`,
            searchTerms: ['bulk product background removal', 'outsourced background removal', 'amazon image editing', 'shopify product photo editing', 'ecommerce background removal service'],
  },
  {
    id: 'clipping-path',
    metaTitle: 'Clipping Path Service for Ecommerce | Reframe',
    metaDescription: 'Hand-drawn clipping path service for ecommerce product photos. Stricter QA, faster communication, and dedicated account support.',
    focusKeywords: 'clipping path',
    geoScope: 'local',
    geoRegions: 'India',
    hreflang: 'en-US',
    capabilities: [
      { title: "Hard-Edge Precision", desc: "Crisp, clean vector paths around hard-edged products like electronics, furniture, and jewelry." },
      { title: "Multi-Layer Pathing", desc: "Separate paths for different components of a single product to allow isolated color correction." },
      { title: "Non-Destructive Editing", desc: "Paths are saved directly into the JPG or TIFF file, allowing your designers to easily extract the subject." },
      { title: "Anchor Point Optimization", desc: "Optimal anchor point density ensures smooth curves and sharp corners without jagged edges." }
    ],
    precisionMetrics: [
      '"0.1 pixel path accuracy"',
      '"Vector-grade structural integrity"',
      '"Native Adobe path embedding"'
    ],
    faqs: [
      { q: "Can detailed product edges be handled accurately in this service?", a: "Yes, all paths are created manually to ensure high precision, even for complex shapes, especially the edges are manually drawn and adjusted to ensure smooth and precise cutouts." },
      { q: "What types of images are best suited for clipping path editing?", a: "All kind of images can be handled whether they have defined or de-focused edges. Our clipping path experts handle every image professionally so that anyone can easily use the paths to do their desired refinement. This includes apparel, accessories, electronics, packaged goods, models, furniture, animals, trees, bicycles, food, or anything." },
      { q: "Do you offer discounts for large or bulk orders?", a: "Yes, custom pricing is available for high-volume projects." }
    ],
    name: 'Clipping Path',
    price: 0.39,
    categoryId: 'foundation',
    icon: PenTool01Icon,
    description: 'Precision vector paths for clean cutouts.',
    detail: 'The industry standard for hard-edged products. We create precise, hand-drawn vector paths around your subject, ensuring razor-sharp edges that automated AI tools simply cannot match. Perfect for furniture, electronics, and packaging where structural integrity is critical.',
    includes: ['Hand-drawn path', 'Hard-edge precision', 'Layered file output'],
    bestFor: 'Electronics, furniture, packaging, hard-edge products',
    keywords: ['path', 'vector', 'pen tool', 'edge', 'sharp'],
    beforeImage: `${CLOUDINARY_BASE}clipping-path-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}clipping-path-after.jpg`,
            searchTerms: ['clipping path service for ecommerce', 'photo editing outsourcing', 'Clipping Path India alternative', 'product cutout service'],
  },
  {
    id: 'multi-clipping-path',
    metaTitle: 'Multi Clipping Path Service | Reframe',
    metaDescription: 'Professional multi clipping path service for complex product edits and per-part color control. Ideal for ecommerce catalogs needing batch output.',
    focusKeywords: 'multi clipping path',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Isolated Component Paths", desc: "Create separate vector layers for each distinct part of a complex product." },
      { title: "Per-Part Color Masking", desc: "Allows independent color grading for labels, caps, bodies, and packaging details." },
      { title: "Non-Destructive Workflows", desc: "Native PSD/TIFF layers ensuring full editability for your post-production teams." },
      { title: "Sub-Pixel Tracing", desc: "100% human-operated tracing that preserves the exact geometry of mechanical and structural goods." }
    ],
    precisionMetrics: [
      '"Infinite per-part adjustability"',
      '"Vector-perfect structural masking"',
      '"Native layered PSD delivery"'
    ],
    faqs: [
      { q: "How is precision maintained in multi-clipping path editing?", a: "Each section is separated carefully to allow controlled and accurate edits. Our multi-clipping path ensures pinpoint accuracy in object separation." },
      { q: "How can the final multi-clipping path files be delivered?", a: "Files are delivered with individual paths for each separated part such as colors, different parts of subjects, sleeves, collar, or any component you need. Layer masks are also available if preferred. Including clear separation instructions with your order ensures everything is organized for your workflow." },
      { q: "Do you offer discounts for bulk or high-volume multi-clipping path orders?", a: "Yes, custom pricing is available for high-volume projects. The more images you send, the better the rate, ideal for brands, studios, and agencies managing large catalogs. Share your volume to get a custom quote." }
    ],
    name: 'Multi-Clipping Path',
    price: 0.90,
    categoryId: 'foundation',
    icon: PathIcon,
    description: 'Multiple paths for complex multi-part products.',
    detail: 'We separate each part of your product, such as the body, lid, label, and cap, into distinct vector layers. Your team can then isolate and adjust individual components without touching the rest of the image.',
    includes: ['Multiple component paths', 'Per-part color isolation', 'Layered file output'],
    bestFor: 'Multi-part products, bottles, electronics with components',
    keywords: ['multi', 'multiple', 'parts', 'components', 'lid', 'cap'],
    beforeImage: `${CLOUDINARY_BASE}multi-clipping-path-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}multi-clipping-path-after.jpg`,
            searchTerms: ['multi-clipping path', 'color pathing', 'complex masking'],
  },
  {
    id: 'color-correction',
    metaTitle: 'Color Correction Service for Products | Reframe',
    metaDescription: 'Professional color correction service for product images. Fix white balance, exposure, and tone for consistent ecommerce catalogs.',
    focusKeywords: 'color correction',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    name: 'Color Correction',
    price: 0.35,
    categoryId: 'foundation',
    icon: ColorsIcon,
    description: 'Accurate color matching across your entire catalog.',
    detail: 'Achieve perfect brand consistency across every SKU. We meticulously adjust white balance, exposure, and color grading to ensure that every single product photo authentically matches the real-world item, eliminating color dispositions caused by studio lighting variations.',
    includes: ['White balance correction', 'Exposure adjustment', 'Catalog color consistency'],
    bestFor: 'Catalog shoots, batch photography, brand consistency',
    keywords: ['color', 'matching', 'white balance', 'exposure', 'lighting'],
    beforeImage: `${CLOUDINARY_BASE}color-correction-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}color-correction-after.jpg`,
            searchTerms: ['color correction', 'tone adjustment', 'white balance'],
  },
  {
    id: 'color-change',
    metaTitle: 'Color Change Service for Product Variants | Reframe',
    metaDescription: 'Bulk color change service for apparel and product photos. Create accurate, consistent color variants for ecommerce catalogs with fast delivery.',
    focusKeywords: 'color change',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Texture Preservation", desc: "Recoloring objects while perfectly maintaining the underlying material texture and grain." },
      { title: "Pantone & Hex Matching", desc: "Mathematically precise color mapping to align exactly with your brand guidelines." },
      { title: "Fabric & Material Accuracy", desc: "Handling complex reflections in satin, silk, leather, and metallic surfaces during color shifts." },
      { title: "Single-Shoot Scaling", desc: "Shoot your product once in a neutral color, and we will digitally generate your entire seasonal palette." }
    ],
    precisionMetrics: [
      '"100% accurate Pantone matching"',
      '"Zero texture degradation"',
      '"Cost-effective inventory rendering"'
    ],
    faqs: [
      { q: "What is required for product color change editing?", a: "A base image and color references such as HEX codes, Pantone values, or sample images are required for accurate matching." },
      { q: "How is color accuracy ensured?", a: "Color accuracy is achieved using color-calibrated editing setups and reference-based correction to match the real product on the shelf. Lighting, shadows, and texture are preserved while maintaining true-to-life consistency, supported by a structured QC process for precision and reduced return risks." },
      { q: "Can multiple color variations be created from a single product image?", a: "Yes, multiple variations can be generated from one base image while maintaining consistent lighting, shadows, and texture across all versions, ideal for ecommerce brands selling products in multiple colorways without reshooting." }
    ],
    name: 'Color Change',
    price: 0.30,
    categoryId: 'foundation',
    icon: PaintBucketIcon,
    description: 'Change product colors without reshooting.',
    detail: 'Skip the reshoot. We swap product colors digitally while keeping the original fabric texture, lighting, and shadow data intact. Seasonal colorways delivered from a single source image.',
    includes: ['Natural color replacement', 'Texture preservation', 'Lighting consistency'],
    bestFor: 'Product variants, fashion, seasonal colorways',
    keywords: ['recolor', 'change color', 'hue', 'swap', 'variant'],
    beforeImage: `${CLOUDINARY_BASE}color-change-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}color-change-after.jpg`,
    examples: [
      { before: `${CLOUDINARY_BASE}color-change-before.jpg`, after: `${CLOUDINARY_BASE}color-change-after.jpg`, label: 'Color 1' },
      { before: `${CLOUDINARY_BASE}color-change-2-before.jpg`, after: `${CLOUDINARY_BASE}color-change-2-after.jpg`, label: 'Color 2' }
    ],
            searchTerms: ['color change', 'recolor service', 'bulk recolor'],
  },
  {
    id: 'shadow-creation',
    metaTitle: 'Shadow Creation Service for Products | Reframe',
    metaDescription: 'Shadow creation service for ecommerce product photos. Add natural drop shadows, reflections, and depth for cleaner product listings.',
    focusKeywords: 'shadow creation',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Natural Drop Shadows", desc: "Physically accurate drop shadows that ground your product and define its 3D space." },
      { title: "Reflection & Mirror Effects", desc: "Glossy, high-end floor reflections ideal for jewelry, electronics, and luxury cosmetics." },
      { title: "Retained Original Shadows", desc: "Enhancing and preserving the original shadows captured during the studio shoot." },
      { title: "Lighting Angle Cohesion", desc: "Shadows digitally painted to match the exact trajectory of your primary light source." }
    ],
    precisionMetrics: [
      '"Physically accurate light scattering"',
      '"Luxury-grade mirror reflections"',
      '"Seamless visual grounding"'
    ],
    faqs: [
      { q: "Why is shadow creation important?", a: "Shadow creation adds depth and realism to product images, making them look more grounded and visually appealing. It improves product presentation and helps create a more professional, high-converting look for ecommerce and marketing use." },
      { q: "What types of shadows can be created?", a: "Natural shadows, drop shadows, reflection shadows, and soft or directional shadows can be created based on the product type and desired visual style, ensuring a realistic and commercially suitable appearance." },
      { q: "What is recommended for shadow creation?", a: "Product images are the primary input. A preferred shadow style or reference can help guide the final look, ensuring the shadow aligns with the intended presentation and overall visual consistency." }
    ],
    name: 'Shadow Creation',
    price: 0.35,
    categoryId: 'enhancement',
    icon: Layers01Icon,
    description: 'Add natural depth and realism to product photos.',
    detail: 'Cutouts look flat without shadows. We add drop shadows, cast shadows, or floor reflections matched to the product and lighting direction, so the image reads as grounded rather than pasted.',
    includes: ['Drop shadows', 'Natural cast shadows', 'Reflection/Mirror effects'],
    bestFor: 'Shoes, bags, electronics, cosmetics',
    keywords: ['shadow', 'drop shadow', 'reflection', 'depth', '3d'],
    beforeImage: `${CLOUDINARY_BASE}shadow-creation-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}shadow-creation-after.jpg`,
            searchTerms: ['drop shadow', 'reflection making', 'natural shadow'],
  },
  {
    id: 'raster-to-vector',
    metaTitle: 'Raster to Vector Conversion Service | Reframe',
    metaDescription: 'Professional raster to vector conversion service for logos, artwork, and print files. Get clean, scalable vector outputs with fast turnaround.',
    focusKeywords: 'raster to vector',
    geoScope: 'local',
    geoRegions: 'USA',
    hreflang: 'en-US',
    capabilities: [
      { title: "Manual Node Tracing", desc: "100% hand-drawn vectorization for clean, minimal nodes without auto-trace distortion." },
      { title: "Infinite Scalability", desc: "Convert pixelated JPG/PNG logos into crisp SVG/EPS files that can scale to billboard sizes." },
      { title: "Typography Recreation", desc: "Rebuilding pixelated text using exact font matching or precise manual curve generation." },
      { title: "Color Optimization", desc: "Converting RGB rasters into Pantone or CMYK spot-color vectors for print manufacturing." }
    ],
    precisionMetrics: [
      '"100% manual Pen Tool conversion"',
      '"Print-ready EPS, SVG, and AI delivery"',
      '"Zero pixelation at infinite scale"'
    ],
    faqs: [
      { q: "What types of files can be converted from raster to vector?", a: "Logos, icons, illustrations, sketches, line art, and product graphics can be converted into vector format. Low-resolution graphics can also be recreated as clean, scalable vectors. The final quality depends on the clarity of the original, but most designs can be refined into usable vector files." },
      { q: "What needs to be provided for raster to vector conversion?", a: "The original raster image (JPG, PNG, or similar) is enough to get started. If there is a preferred style, color reference, or output format, it can be shared to guide the final result." },
      { q: "Can edits or adjustments be made after conversion?", a: "Yes, vectors are fully editable, allowing changes to colors, shapes, and elements without affecting quality. Revisions can be applied based on feedback while maintaining consistency." },
      { q: "Who is this service best suited for?", a: "This service is ideal for businesses, designers, print companies, and ecommerce brands that need scalable graphics for logos, branding, packaging, or large-format printing." }
    ],
    name: 'Raster to Vector',
    price: 4.99,
    categoryId: 'enhancement',
    icon: PathfinderUniteIcon,
    description: 'Convert pixel images to scalable vector artwork.',
    detail: 'Hand-traced vector conversion of logos, illustrations, and product outlines.',
    includes: ['Hand-traced vectors', 'Scalable vector files (AI, EPS, SVG, PDF)', 'Infinitely scalable'],
    bestFor: 'Logo recreation, print production, signage',
    keywords: ['vector', 'trace', 'logo', 'svg', 'ai', 'eps', 'scalable'],
            searchTerms: ['raster to vector', 'logo tracing', 'vector conversion'],
    hidden: true,
  },
  {
    id: 'manipulation',
    metaTitle: 'Image Manipulation & Compositing | Reframe',
    metaDescription: 'Professional image manipulation service for ecommerce and campaign visuals. Add, remove, or replace objects with realistic compositing.',
    focusKeywords: 'manipulation',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Photorealistic Compositing", desc: "Seamlessly blending multiple images together with matched lighting and perspective." },
      { title: "Environment Replacement", desc: "Transporting your studio product shots into fully realized lifestyle environments." },
      { title: "Object Addition/Removal", desc: "Adding new elements to a scene or erasing distracting backgrounds and props." },
      { title: "Atmospheric Effects", desc: "Adding digital fog, lighting flares, rain, or motion blur to create cinematic visuals." }
    ],
    precisionMetrics: [
      '"Cinematic lighting cohesion"',
      '"Pixel-perfect perspective matching"',
      '"Flawless reality distortion"'
    ],
    faqs: [
      { q: "What is required for image manipulation?", a: "A base image and clear instructions or references describing the required changes are needed." },
      { q: "Can objects be added or removed realistically?", a: "Yes, elements are blended using proper lighting, shadows, and perspective to maintain realism." },
      { q: "Do you provide layered PSD or source files?", a: "Yes, layered files can be provided if requested." },
      { q: "How many revisions are included?", a: "We offer unlimited revisions to ensure the final delivery aligns perfectly with your vision." }
    ],
    name: 'Image Manipulation',
    price: 3.99,
    categoryId: 'enhancement',
    icon: UngroupItemsIcon,
    description: 'Creative compositing and image manipulation.',
    detail: 'Combine multiple images, relocate objects, add or remove elements, and create surreal compositions.',
    includes: ['Object addition and removal', 'Scene compositing', 'Element relocation'],
    bestFor: 'Advertising, creative campaigns, marketing visuals',
    keywords: ['edit', 'composite', 'scene', 'add', 'remove', 'manipulate'],
    beforeImage: `${CLOUDINARY_BASE}manipulation-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}manipulation-after.jpg`,
            searchTerms: ['image manipulation', 'photo compositing', 'object removal'],
  },
  {
    id: 'pattern-change',
    metaTitle: 'Pattern Change Service for Apparel | Reframe',
    metaDescription: 'Pattern change service for apparel ecommerce. Replace fabric patterns and textures with realistic folds, clean edges, and catalog-ready output.',
    focusKeywords: 'pattern change',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "3D Surface Wrapping", desc: "Warping flat patterns to perfectly follow the folds, creases, and curves of fabric." },
      { title: "Displacement Mapping", desc: "Utilizing luminance data to ensure the pattern sinks into seams and rides over wrinkles naturally." },
      { title: "Scale and Perspective Alignment", desc: "Matching the pattern scale accurately to the physical dimensions of the garment." },
      { title: "Multi-Pattern Inventory", desc: "Generate an entire catalog of patterned shirts or furniture from a single blank photograph." }
    ],
    precisionMetrics: [
      '"Mathematically precise surface wrapping"',
      '"Natural fold and crease alignment"',
      '"Cost-saving virtual inventory"'
    ],
    faqs: [
      { q: "What is required for pattern or texture change editing?", a: "A high-quality base image and a clear reference pattern or texture are required to accurately replace or modify designs while maintaining fabric realism, alignment, and natural product appearance." },
      { q: "Will fabric remain realistic and consistent after pattern changes?", a: "Yes. Fabric folds, lighting, and depth are preserved to maintain a natural, realistic look. Patterns are also adjusted to follow folds, seams, and contours for a natural appearance consistently across all images to ensure uniformity." },
      { q: "Can multiple design variations be created efficiently?", a: "Yes, multiple pattern variations can be generated from a single base image." },
      { q: "How is consistency ensured across designs?", a: "Pattern scaling, placement, and alignment are standardized across all images. Every output is then reviewed through a structured 3-step quality assurance process to ensure accuracy, and production-ready consistency." }
    ],
    name: 'Pattern Change',
    price: 1.25,
    categoryId: 'enhancement',
    icon: MaterialAndTextureIcon,
    description: 'Swap fabric patterns and textures seamlessly.',
    detail: 'Replace any pattern or texture on fabric, surfaces, or products while maintaining natural folds.',
    includes: ['Fabric pattern swap', 'Fold and wrinkle preservation', 'Lighting match'],
    bestFor: 'Fashion, upholstery, textile catalogs',
    keywords: ['pattern', 'texture', 'fabric', 'textile', 'print'],
    beforeImage: `${CLOUDINARY_BASE}pattern-change-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}pattern-change-after.jpg`,
    examples: [
      { before: `${CLOUDINARY_BASE}pattern-change-before.jpg`, after: `${CLOUDINARY_BASE}pattern-change-after.jpg`, label: 'Pattern 1' },
      { before: `${CLOUDINARY_BASE}pattern-change-2-before.jpg`, after: `${CLOUDINARY_BASE}pattern-change-2-after.jpg`, label: 'Pattern 2' }
    ],
            searchTerms: ['pattern change', 'texture editing', 'fabric swap'],
  },
  {
    id: 'retouching',
    metaTitle: 'Photo Retouching Services for Ecommerce | Reframe',
    metaDescription: 'Professional photo retouching services for ecommerce. Natural skin cleanup, product surface polish, and consistent batch delivery.',
    focusKeywords: 'retouching',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "High-End Skin Retouching", desc: "Frequency separation techniques to preserve natural skin texture while removing temporary blemishes." },
      { title: "Dodge & Burn", desc: "Micro-contrast adjustments to sculpt lighting, enhance bone structure, and add three-dimensional depth." },
      { title: "Flyaway Hair Cleanup", desc: "Meticulous removal of stray hairs and background distractions for a polished editorial look." },
      { title: "Digital Makeup Enhancement", desc: "Subtle enhancements to lips, eyes, and contours to ensure beauty campaigns pop." }
    ],
    precisionMetrics: [
      '"Non-destructive frequency separation"',
      '"Agency-level editorial standards"',
      '"Natural texture preservation"'
    ],
    faqs: [
      { q: "What files & instructions need to be provided for retouching?", a: "Just the original images are enough to get started. It's a simple process from there, and any specific instructions or reference images can be shared if a particular look is needed." },
      { q: "What types of retouching are done here?", a: "Retouching includes any kind of product images, ecommerce listings, and commercial visuals. This includes cleaning up product surfaces, dust and scratches, reflection adjustment, and etc. It can also include minor object cleanup, and consistency adjustments across image sets, all reviewed through a 3-step quality assurance process." },
      { q: "Is natural texture preserved during retouching?", a: "Yes, professional techniques such as frequency separation, dodging burning & etc. are used to refine skin or any subject surface while maintaining natural texture and detail." },
      { q: "What is required for high-end retouching?", a: "High-resolution images are required to ensure precise detailing and clean editing output. Clear, well-lit files (RAW or high-quality JPEG/PNG) are preferred to avoid quality loss during retouching. Reference images or brand style guidelines are also recommended so the final result matches the expected visual direction and brand consistency." },
      { q: "Will the images maintain a natural look after retouching?", a: "Yes, adjustments are made carefully to enhance the image while preserving natural textures and look. Anything that makes the result look fake is carefully avoided." },
      { q: "Do you provide layered PSD or source files?", a: "Yes, layered files can be provided if requested in preferred file formats e.g., PSD, TIFF, etc." },
      { q: "Who is this retouching service for?", a: "This service is ideal for ecommerce brands and creatives who need clean, consistent, high-quality visuals for listings, campaigns, and catalogs where visuals directly impact sales. Each image goes through a structured QA process handled by expert retouching specialists and senior visual editors to ensure precision, consistency, and commercial-grade results." }
    ],
    name: 'Retouching',
    price: 4.00,
    categoryId: 'retouch',
    icon: MagicWandIcon,
    description: 'Surface cleanup, dust removal, and consistent finish.',
    detail: 'Professional skin retouching, lighting adjustments, blemish removal, and color grading for a polished look.',
    includes: ['Advanced skin retouching', 'Lighting and contrast refinement', 'Blemish removal'],
    bestFor: 'Beauty campaigns, fashion editorials, everyday photos',
    keywords: ['skin', 'beauty', 'fashion', 'face', 'portrait', 'premium', 'high-end', 'blemish'],
    beforeImage: `${CLOUDINARY_BASE}retouching-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}retouching-after.jpg`,
            searchTerms: ['retouching services for ecommerce', 'product image retouching outsourcing', 'commercial photo retouching service'],
  },
  {
    id: 'jewelry-retouch',
    metaTitle: 'Jewelry Retouch & Image Editing | Reframe',
    metaDescription: 'Specialist jewelry retouch and image editing service. Metal polish, gemstone clarity, and reflection cleanup for catalog output.',
    focusKeywords: 'jewelry retouch',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Metal Polishing", desc: "Smoothing out scratches, fingerprints, and dust from gold, silver, and platinum surfaces." },
      { title: "Gemstone Enhancement", desc: "Clarifying diamonds and colored stones to restore their natural brilliance and sharp facets." },
      { title: "Reflection Control", desc: "Removing harsh camera reflections or replacing them with smooth, studio-grade gradients." },
      { title: "Focus Stacking", desc: "Combining multiple macro exposures (if provided) to ensure the entire piece is razor-sharp." }
    ],
    precisionMetrics: [
      '"Flawless macro-level cleanup"',
      '"True-color gemstone rendering"',
      '"Studio gradient reconstruction"'
    ],
    faqs: [
      { q: "What types of jewelry images are suitable for retouching?", a: "Rings, necklaces, bracelets, watches, and other reflective or detailed items can be retouched, including studio and lifestyle shots, even shots taken with phone cameras." },
      { q: "How is a premium finish achieved in jewelry images?", a: "Reflections are refined, dust and scratches are removed, and shine is enhanced carefully while maintaining original features." },
      { q: "Can intricate jewelry details be preserved?", a: "Yes, fine details such as stones, prongs, and metal textures are handled with precision and the details are preserved to resemble the original product." },
      { q: "How are reflections and glare handled in jewelry images?", a: "Reflections are refined and controlled carefully to enhance shine without overexposure or distortion. Unwanted bad reflections are removed or polished." },
      { q: "Do you offer discounts for large or bulk orders?", a: "Yes, custom pricing is available for high-volume projects." }
    ],
    name: 'Jewelry Retouch',
    price: 0.80,
    categoryId: 'retouch',
    icon: Diamond01Icon,
    description: 'Specialized retouching for jewelry and accessories.',
    detail: 'Metal polishing, gemstone enhancement, reflection cleanup, and sparkle amplification.',
    includes: ['Metal and gemstone enhancement', 'Reflection cleanup', 'Sparkle amplification'],
    bestFor: 'Jewelry eCommerce, watches, luxury accessories',
    keywords: ['jewelry', 'ring', 'necklace', 'diamond', 'watch', 'gold', 'silver', 'sparkle'],
    beforeImage: `${CLOUDINARY_BASE}jewelry-retouch-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}jewelry-retouch-after.jpg`,
    examples: [
      { before: `${CLOUDINARY_BASE}jewelry-retouch-before.jpg`, after: `${CLOUDINARY_BASE}jewelry-retouch-after.jpg`, label: 'Before & After' }
    ],
            searchTerms: ['jewelry image editing service', 'jewelry retouching service for ecommerce', 'ecommerce jewelry photo editing', 'diamond retouching service'],
  },
  {
    id: 'garment-retouch',
    metaTitle: 'Garment Retouch & Clothing Editing | Reframe',
    metaDescription: 'Specialized garment retouch and clothing photo editing for ecommerce. Wrinkle removal, fabric smoothing, and symmetry correction.',
    focusKeywords: 'garment retouch',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Wrinkle & Crease Removal", desc: "Smoothing out unwanted fabric folds while maintaining natural drape and volume." },
      { title: "Symmetry & Fit Correction", desc: "Liquifying garments to fix bad styling, ensuring perfect hems and proportional collars." },
      { title: "Lint & Dust Removal", desc: "Meticulous pixel-level cleanup of lint, tags, pins, and studio dust." },
      { title: "Shape Sculpting", desc: "Enhancing the silhouette of clothing to look premium, structured, and tailor-fitted." }
    ],
    precisionMetrics: [
      '"Flawless textile smoothing"',
      '"Perfectly symmetrical tailoring"',
      '"Premium high-street presentation"'
    ],
    faqs: [
      { q: "What types of garment images work for this service?", a: "This service works with all apparel visuals, including model shots, flat lays, in mannequin shots, and multi-angle product images, refined into clean and consistent, ready-to-use commercial outputs." },
      { q: "Can wrinkles and fabric imperfections be removed while keeping natural texture?", a: "Yes. Wrinkles, creases, ironing folds, dust, pins, tags, and minor defects are removed or reduced while preserving the natural fabric texture, ensuring garments look clean, realistic, and commercially presentable." },
      { q: "Does this service include ghost mannequin or neck joining effects?", a: "No. This service focuses on garment retouching and refinement only. Ghost mannequin effects and neck joining for mannequin-shot apparel are handled under a separate dedicated service designed specifically for that output style." }
    ],
    name: 'Garment Retouch',
    price: 0.55,
    categoryId: 'retouch',
    icon: ClothesIcon,
    description: 'Perfect your apparel product photography.',
    detail: 'Wrinkle removal, fabric smoothing, color vibrancy, and fit correction on clothing.',
    includes: ['Wrinkle and crease removal', 'Fabric smoothing', 'Color vibrancy boost'],
    bestFor: 'Fashion eCommerce, apparel catalogs, lookbooks',
    keywords: ['clothing', 'shirt', 'dress', 'wrinkle', 'fabric', 'garment'],
    beforeImage: `${CLOUDINARY_BASE}garment-retouch-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}garment-retouch-after.jpg`,
            searchTerms: ['apparel photo retouching service', 'clothing image editing service', 'fashion product photo editing', 'garment retouching for ecommerce'],
  },
  {
    id: 'model-retouch',
    metaTitle: 'Model Retouch & Fashion Portrait Cleanup | Reframe',
    metaDescription: 'Professional model retouch and fashion campaign image cleanup. Natural skin texture and flyaway hair refinement.',
    focusKeywords: 'model retouch',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Skin & Blemish Clearing", desc: "Natural-looking skin cleanup that removes temporary acne, scratches, or uneven tones." },
      { title: "Teeth & Eye Enhancement", desc: "Subtle whitening of teeth and brightening of irises without looking artificial." },
      { title: "Stray Hair Removal", desc: "Cleaning up flyaway hairs across the face or background for a polished editorial look." },
      { title: "Body Sculpting (Optional)", desc: "Minor, tasteful liquify adjustments to posture, clothing fit, or contours per brand guidelines." }
    ],
    precisionMetrics: [
      '"Non-destructive frequency separation"',
      '"Subtle, realistic enhancement"',
      '"Brand-compliant body standards"'
    ],
    faqs: [
      { q: "What aspects of a model image can be retouched?", a: "Retouching can include skin refinement, lighting balance, hair cleanup, background distractions, and overall detail enhancement while maintaining a natural look." },
      { q: "Can body shaping or adjustments be done in model retouching?", a: "Yes, subtle body adjustments can be applied where needed, ensuring proportions remain natural and consistent with the original image." },
      { q: "Can retouching match a specific brand or campaign style?", a: "Yes, retouching can be aligned with brand guidelines or campaign references to maintain a consistent visual identity across all assets." },
      { q: "Can hair flyaways and loose strands be cleaned up?", a: "Yes, stray hair and flyaways can be refined to create a cleaner and more controlled look without making it appear artificial." },
      { q: "Can tattoos be removed in model retouching?", a: "Yes, tattoos can be minimized or removed while preserving natural skin texture and tone. The final result is refined and reviewed through a structured quality assurance process to ensure consistency and realism." }
    ],
    name: 'Model Retouch',
    price: 1.20,
    categoryId: 'retouch',
    icon: UserEdit01Icon,
    description: 'Professional model and portrait retouching.',
    detail: 'Skin retouching, body contouring, makeup enhancement, and background cleanup for model photography.',
    includes: ['Skin retouching', 'Makeup enhancement', 'Natural body contouring'],
    bestFor: 'Fashion photography, lookbooks, brand campaigns',
    keywords: ['model', 'portrait', 'body', 'face', 'makeup'],
    beforeImage: `${CLOUDINARY_BASE}model-retouch-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}model-retouch-after.jpg`,
            searchTerms: ['model retouching', 'portrait retouching', 'body retouching'],
  },
  {
    id: 'ghost-mannequin',
    metaTitle: 'Ghost Mannequin Editing Service | Reframe',
    metaDescription: 'Specialist ghost mannequin editing service for clothing brands and apparel ecommerce. Hollow-body neck joins and symmetry correction.',
    focusKeywords: 'ghost mannequin',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Neck Joint Splicing", desc: "Seamlessly combining the front shot with the inside neck/label shot to create a hollow, 3D effect." },
      { title: "Symmetry Correction", desc: "Warping and liquifying the garment to ensure the sleeves, shoulders, and hems are perfectly symmetrical." },
      { title: "Volume Enhancement", desc: "Adding natural shading and highlights to the interior of the garment to simulate depth." },
      { title: "Pin & Clip Removal", desc: "Digitally erasing any styling clips, pins, or tape used during the photography process." }
    ],
    precisionMetrics: [
      '"Flawless 3D volume reconstruction"',
      '"100% symmetrical alignment"',
      '"Complete styling-prop removal"'
    ],
    faqs: [
      { q: "What is required to create ghost mannequin images?", a: "Front and neck/inner part images of the garment are required. Inner neck or label area images are recommended to complete the invisible mannequin effect accurately." },
      { q: "Can ghost mannequin editing be done without neck joint images?", a: "In some cases, it is possible, but the final result may be limited depending on the garment structure. Inner shots provide a more complete finish." },
      { q: "How is consistency maintained across a clothing catalog?", a: "Consistency is maintained by standardizing alignment, proportions, lighting, and garment shape across all images. Each product is edited under the same visual rules so every item looks uniform, even if the original photos differ. This ensures a clean, consistent catalog presentation that improves brand trust and product clarity." },
      { q: "How will the final images appear?", a: "Garments will appear structured, pixel perfect symmetrical (for applicable ones), and naturally shaped, with a clean and professional presentation suitable for ecommerce." }
    ],
    name: 'Ghost Mannequin',
    price: 0.85,
    categoryId: 'foundation',
    icon: TShirtIcon,
    description: 'Show garments with natural 3D volume, no mannequin in the shot.',
    detail: 'We composite the front and inner shots to remove the mannequin while keeping internal collar, tag, and hem details. The result shows garments with natural volume and shape, without a model or mannequin in frame.',
    includes: ['Neck joint composite', 'Mannequin removal', 'Volume preservation'],
    bestFor: 'Apparel, t-shirts, jackets, dresses',
    keywords: ['ghost', 'mannequin', 'neck joint', 'apparel', 'hollow'],
    beforeImage: `${CLOUDINARY_BASE}ghost-mannequin-before.jpg`,
    afterImage: `${CLOUDINARY_BASE}ghost-mannequin-after.jpg`,
            searchTerms: ['ghost mannequin editing service', 'invisible mannequin service for apparel', 'apparel ecommerce photo editing', 'clothing product image editing'],
  },
  {
    id: 'sketch-to-reality',
    metaTitle: 'Sketch to Reality Conversion Service | Reframe',
    metaDescription: 'Professional sketch to reality service that converts drawings into clean photoreal renders for product concepts.',
    focusKeywords: 'sketch to reality',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Sketch Interpretation", desc: "Understanding hand-drawn intent and translating it into high-fidelity digital assets." },
      { title: "Realistic Rendering", desc: "Applying physically accurate materials and lighting to rough concepts." },
      { title: "Iterative Prototyping", desc: "Rapidly generating multiple photorealistic versions of a single sketch." }
    ],
    precisionMetrics: [
      '"Photorealistic translation"',
      '"Rapid concept realization"',
      '"High-fidelity material rendering"'
    ],
    faqs: [
      { q: "What is Sketch to Reality?", a: "A service that transforms your rough sketches or wireframes into photorealistic product images." }
    ],
    name: 'Sketch to Image',
    price: 3.50,
    categoryId: 'ai-driven',
    icon: AiImageIcon,
    description: 'Transform sketches into photorealistic images.',
    detail: 'Convert hand-drawn sketches, CAD wireframes, or rough concepts into rendered product images.',
    includes: ['Sketch interpretation', 'Realistic rendering', 'Material and lighting match'],
    bestFor: 'Product design, concept visualization, prototyping',
    keywords: ['sketch', 'wireframe', 'cad', 'drawing', 'concept', 'render'],
            searchTerms: ['sketch to image', 'concept rendering', 'wireframe to image'],
    hidden: true,
  },
  {
    id: 'ai-product-photography',
    metaTitle: 'AI Product Photography Service | Reframe',
    metaDescription: 'AI product photography service for ecommerce brands. Place products in lifestyle scenes with consistent brand-ready output.',
    focusKeywords: 'ai product photography',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Virtual Backgrounds", desc: "Generating stunning, photorealistic lifestyle environments around a standard product shot." },
      { title: "Dynamic Lighting Match", desc: "AI algorithms that analyze your product's lighting and generate an environment that matches perfectly." },
      { title: "Prop Generation", desc: "Adding hyper-realistic contextual props (e.g., splashing water, fruit, marble podiums) instantly." }
    ],
    precisionMetrics: [
      '"Infinite virtual locations"',
      '"Perfectly cohesive shadow generation"',
      '"Zero physical studio costs"'
    ],
    faqs: [
      { q: "What is AI product photography?", a: "AI product photography creates product visuals using advanced AI instead of traditional photoshoots." }
    ],
    name: 'AI Product Photography',
    price: 0.99,
    categoryId: 'ai-driven',
    icon: CameraIcon,
    description: 'Place your product in AI-generated lifestyle backgrounds.',
    detail: 'Place your product in beautiful, realistic AI-generated environments without the cost of a physical photoshoot.',
    includes: ['AI background generation', 'Realistic shadows and reflections', 'Lighting matching'],
    bestFor: 'eCommerce, social media, marketing campaigns',
    keywords: ['ai', 'product', 'photography', 'background', 'generate'],
            searchTerms: ['ai product photography', 'ai background generation', 'ai product photos'],
    hidden: true,
  },
  {
    id: 'ai-video-generation',
    metaTitle: 'AI Video Generation for Products | Reframe',
    metaDescription: 'AI video generation service that turns product images into engaging ecommerce videos for ads, listings, and social campaigns.',
    focusKeywords: 'ai video generation',
    geoScope: 'global',
    geoRegions: 'Global',
    hreflang: 'en-US',
    capabilities: [
      { title: "Text-to-Video", desc: "Generating cinematic b-roll and motion clips directly from written creative prompts." },
      { title: "Image-to-Video", desc: "Bringing still photographs to life with dynamic camera movements." }
    ],
    precisionMetrics: [
      '"Cinematic fluid motion"',
      '"High-fidelity upscaling"',
      '"Rapid realization"'
    ],
    faqs: [
      { q: "What is AI video generation?", a: "A service that transforms static images into dynamic video content using AI." }
    ],
    name: 'AI Video Generation',
    price: 4.99,
    categoryId: 'ai-driven',
    icon: VideoIcon,
    description: 'Turn product photos into short video clips with AI.',
    detail: 'Convert still product photos into short video clips for TikTok, Reels, and product ads. AI handles the motion; editors review the output before delivery.',
    includes: ['Image to video animation', 'Dynamic transitions', 'Social media ready'],
    bestFor: 'TikTok, Instagram Reels, video marketing',
    keywords: ['ai', 'video', 'generation', 'animate', 'motion'],
            searchTerms: ['ai video generation', 'image to video', 'product video maker'],
    hidden: true,
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: 'marketplace-ready',
    name: 'Marketplace Ready',
    price: 0.49,
    serviceIds: ['background-removal', 'shadow-creation', 'color-correction'],
    description: 'Background Removal + Shadow Creation + Color Correction',
    savings: 'Save ~15%',
    keywords: ['amazon', 'shopify', 'ebay', 'simple', 'white background', 'listing'],
  },
  {
    id: 'ghost-mannequin-complete',
    name: 'Ghost Mannequin Complete',
    price: 1.54,
    serviceIds: ['ghost-mannequin', 'garment-retouch', 'color-correction', 'background-removal'],
    description: 'Ghost Mannequin + Retouch + Color Correction + Background Removal',
    savings: 'Save ~11%',
    highlight: true,
    keywords: ['clothing', 'shirt', 'pants', 'apparel', 'fashion', 'hollow'],
  },
  {
    id: 'jewelry-essentials',
    name: 'Jewelry Essentials',
    price: 1.54,
    serviceIds: ['background-removal', 'jewelry-retouch', 'shadow-creation'],
    description: 'Background Removal + Jewelry Retouch + Shadow Creation',
    savings: 'Save ~12%',
    keywords: ['jewelry', 'ring', 'watch', 'diamond', 'luxury', 'shine', 'metal'],
  },
];

export const getServiceById = (id: string): Service | undefined => {
  const normalizedId = LEGACY_SERVICE_ALIASES[id] || id;
  const service = SERVICES.find((s) => s.id === normalizedId);
  const pageContent = SERVICE_PAGE_CONTENT[normalizedId];
  if (!service || !pageContent) return service;

  const price = Number(pageContent.priceText || service.price);
  return {
    ...service,
    name: pageContent.name,
    price: Number.isFinite(price) ? price : service.price,
    description: pageContent.supportingLine,
    detail: pageContent.seoParagraph,
    includes: pageContent.includes,
    bestFor: pageContent.idealForText || pageContent.whereBest,
    capabilities: pageContent.process,
    faqs: pageContent.faqs,
    metaTitle: `${pageContent.name} Service | Reframe Visuals`,
    metaDescription: pageContent.seoParagraph,
    searchTerms: [pageContent.name, ...pageContent.idealFor],
    servicePageContent: pageContent,
  } as Service & { servicePageContent: typeof pageContent };
};

export const getServicesByCategory = (categoryId: string): Service[] =>
  SERVICES.filter(s => s.categoryId === categoryId);

export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find(c => c.id === id);

export const getRelatedServices = (serviceId: string, count: number = 3): Service[] => {
  const service = getServiceById(serviceId);
  if (!service) return [];
  return SERVICES
    .filter(s => s.categoryId === service.categoryId && s.id !== serviceId)
    .slice(0, count);
};

export const matchBundleByDescription = (description: string): Bundle => {
  const text = description.toLowerCase();
  
  for (const bundle of BUNDLES) {
    if (bundle.keywords.some(kw => text.includes(kw))) {
      return bundle;
    }
  }

  for (const service of SERVICES) {
    if (service.keywords.some(kw => text.includes(kw))) {
      const parentBundle = BUNDLES.find(b => b.serviceIds.includes(service.id));
      if (parentBundle) return parentBundle;
    }
  }

  return BUNDLES[0];
};

export const ORDERED_SERVICES: Service[] = sortServicesByDisplayOrder(SERVICES.filter(s => !s.hidden));
