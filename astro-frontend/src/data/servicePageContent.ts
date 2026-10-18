export interface ServicePageContent {
  name: string; supportingLine: string; seoParagraph: string; idealFor: string[]; priceText: string; dailyCapacity: string; process: {title:string; desc:string}[]; whatWeHandle: string; includes: string[]; excludes: string[]; bulkTitle: string; bulkSubtitle: string; bulkText: string; bulkPoints: string[]; whereBest: string; idealForText: string; faqs: {q:string; a:string}[];
}

export const SERVICE_PAGE_CONTENT: Record<string, ServicePageContent> = {
  "ai-product-photography": {
    "name": "AI Product Photography",
    "supportingLine": "Render virtual product photos, AI studio packshots and styled ecommerce scenes without traditional photoshoots.",
    "seoParagraph": "Create AI product photography, virtual studio packshots, styled ecommerce scenes, and campaign-ready product visuals from existing images, with human-reviewed lighting, shadows, texture, and product accuracy.",
    "idealFor": [
      "Ecommerce brands",
      "Marketplace sellers",
      "Product launch visuals",
      "Social media campaigns",
      "Digital advertising agencies"
    ],
    "priceText": "1.99",
    "dailyCapacity": "1,000+",
    "process": [
      {
        "title": "Every product image follows an AI-powered production workflow built for realistic product presentation, consistent styling, and ecommerce-ready quality control.",
        "desc": "Product Review"
      },
      {
        "title": "We check the product image, angle, quality, references, brand direction, and required output style before generation starts.",
        "desc": "AI Studio Generation"
      },
      {
        "title": "We create AI-generated packshots, styled environments, product scenes, background variations, and multi-angle visual concepts.",
        "desc": "Realism Refinement"
      },
      {
        "title": "Lighting, shadows, textures, reflections, proportions, product edges, and visual details are refined to reduce fake-looking AI results.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive AI-generated product visuals prepared for ecommerce storefronts, marketplaces, advertising, campaigns, and commercial publishing.",
    "includes": [
      "Virtual product photography created from existing product images",
      "AI studio packshots for clean ecommerce and marketplace presentation",
      "Styled product scenes for ads, websites, catalogs, and campaigns",
      "360°-style product image sets created from multiple visual angles where suitable",
      "Multiple background, lighting, and composition options from one product image",
      "Consistent visual styling across product sets and campaign assets",
      "AI Upscaled output whenever needed",
      "Marketplace-ready ecommerce visuals for Shopify, Amazon, and other platforms",
      "Human-refined lighting, shadows, reflections, textures, and product details",
      "Commercial-ready advertising creatives for social media and product launches",
      "PNG, PSD, JPEG, and high-resolution delivery options"
    ],
    "excludes": [
      "Physical photoshoots",
      "3D modeling or CAD creation"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume product visuals with consistent AI generation, human refinement, organized exports, and reusable creative direction for ecommerce catalogs, marketplace listings, and recurring campaigns.",
    "bulkPoints": [
      "Large-scale AI product visual production",
      "Consistent outputs across product batches and visual styles",
      "Custom workflow for recurring ecommerce catalogs and campaigns"
    ],
    "whereBest": "AI Product Photography creates ecommerce product launch visuals, marketplace listing images, catalog visuals, virtual studio packshots, 360°-style product presentations, social media ads, brand campaign assets, product variation images, and multi-platform product visuals without arranging new photoshoots.",
    "idealForText": "",
    "faqs": [
      {
        "q": "What is AI product photography service and how does it work?",
        "a": "AI product photography creates product visuals using our Reframe AI instead of traditional photoshoots. This lets you create multiple images from multiple angles, setting, or environment of the same subject without ever reshooting."
      },
      {
        "q": "What is required to create AI product images?",
        "a": "A product image is required. Additional angles or style references can improve the final output but are not always mandatory."
      },
      {
        "q": "Can multiple styles or scenes be generated?",
        "a": "Yes, different environments, lighting styles, and compositions can be created from the same product image."
      },
      {
        "q": "Who and what works well with AI product photography?",
        "a": "AI product photography is suited for eCommerce brands, startups, and sellers who need scalable, consistent packshot-style visuals. It works well for apparel, cosmetics, accessories, electronics, and most general retail products for clean, commercial-ready listings."
      },
      {
        "q": "Are images optimized for ecommerce platforms?",
        "a": "Yes, outputs can be optimized for ecommerce platforms like Shopify or Amazon, marketplaces, and social media."
      }
    ]
  },
  "ai-video-generation": {
    "name": "AI Video Generation",
    "supportingLine": "Convert product photos into AI product video ads, packshot-style videos, and marketplace-ready motion assets.",
    "seoParagraph": "Turn product photos into AI product video ads, packshot-style videos, brand commercials, and marketplace videos with styled motion, multi-ratio exports, and human-reviewed realism for ecommerce and social campaigns.",
    "idealFor": [
      "Ecommerce brands",
      "Product promotion",
      "Social media advertisements",
      "Fashion marketing",
      "Marketplace sellers"
    ],
    "priceText": "4.99",
    "dailyCapacity": "100+",
    "process": [
      {
        "title": "Every product video follows an AI-powered workflow focused on smooth motion, realistic product presentation, and platform-ready commercial output.",
        "desc": "Image Review"
      },
      {
        "title": "We check product image quality, angles, model details, reference style, and required video format before generation starts.",
        "desc": "Motion Generation"
      },
      {
        "title": "We create AI-generated product motion, scene movement, camera-style effects, and styled promotional presentation from static images.",
        "desc": "Visual Refinement"
      },
      {
        "title": "Transitions, lighting, movement, proportions, product details, and visual consistency are refined for a cleaner commercial look.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive AI-generated product videos prepared for ecommerce campaigns, storefronts, marketplaces, social ads, and brand promotion workflows.",
    "includes": [
      "Output Resolution Up to 4K",
      "AI product video ads created from static product or model images",
      "Promotional product videos for ecommerce campaigns and paid ads",
      "Packshot-style product videos for clean commercial presentation",
      "Styled motion scenes with controlled product movement and visual direction",
      "Brand commercial-style clips for launches, campaigns, and storefronts",
      "Marketplace-ready videos for product showcases and listings",
      "Multi-ratio exports for vertical, square, and widescreen platforms",
      "Consistent visual styling across campaign video sets",
      "Human-reviewed motion, lighting, transitions, and product realism",
      "MP4, MOV, vertical, square, and widescreen delivery options"
    ],
    "excludes": [
      "Long-form video editing over 60 seconds",
      "Voiceover or scriptwriting"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume product videos with consistent AI motion generation, aligned export formats, and reusable creative direction for ecommerce campaigns, social ads, marketplace showcases, and recurring promotional workflows.",
    "bulkPoints": [
      "Large-scale AI product video production",
      "Consistent motion style across campaign batches",
      "Custom workflow for recurring ecommerce and ad campaigns"
    ],
    "whereBest": "AI Video Generation turns product or model images into ecommerce product promotions, social media video ads, product video ads from photos, fashion marketing clips, marketplace product showcases, brand launch commercials, product highlight videos, and multi-platform video assets.",
    "idealForText": "Best for ecommerce brands, product marketing, social media advertisers, fashion brands, and marketplace sellers that need AI product video ads, promotional clips, packshot-style videos, and multi-ratio motion assets created from existing product or model images.",
    "faqs": [
      {
        "q": "What is AI product videography?",
        "a": "AI product videography turns still product or model images into dynamic videos with controlled motion and scene styling. Items like apparel, shoes, and accessories are presented in a commercial-style setup, similar to packshot visuals or TV-style product advertisements."
      },
      {
        "q": "What is required to create AI product videos?",
        "a": "Product images are the primary input, along with any reference styles or visual direction if available. High-resolution images help improve output quality, and additional angles can enhance detail and motion accuracy, but they are not always mandatory."
      },
      {
        "q": "What types of videos can be created and what products are suitable?",
        "a": "This service covers product showcase videos, promotional clips, and social media content, including model-based scenes and styled presentations. It works with a wide range of eCommerce products such as apparel, accessories, cosmetics, footwear, and more for commercial use."
      },
      {
        "q": "Can videos be adapted for different platforms?",
        "a": "Yes. Videos are delivered in multiple aspect ratios and high-resolution formats, making them suitable for social media, ads, and eCommerce platforms. Each output is optimized to fit platform-specific requirements without losing visual quality."
      }
    ]
  },
  "background-removal": {
    "name": "Background Removal",
    "supportingLine": "Get clean product cutouts, smooth edges, and ecommerce-ready backgrounds handled with manual precision.",
    "seoParagraph": "Professional manual background removal for ecommerce product photos. Get clean cutouts, smooth edges, deep etching, transparent PNGs, white backgrounds, and bulk-ready product images.",
    "idealFor": [
      "Ecommerce brands",
      "Amazon and Shopify sellers",
      "Marketplace retailers",
      "Product photographers",
      "Digital agencies"
    ],
    "priceText": "0.39",
    "dailyCapacity": "2500+",
    "process": [
      {
        "title": "Every image follows a manual background removal workflow focused on clean edges, accurate cutouts, and consistent ecommerce presentation.",
        "desc": "Image Review"
      },
      {
        "title": "We check the product type, image quality, edge complexity, and preferred background style before editing.",
        "desc": "Manual Cutout"
      },
      {
        "title": "Products are separated using manual clipping path, masking, or deep etching based on the subject and edge detail.",
        "desc": "Edge Refinement"
      },
      {
        "title": "Edges, feathering, hair, fur, glass, fabric, and fine details are refined for a clean, natural finish.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive clean, consistent product cutouts prepared for ecommerce listings, catalogs, ads, and marketplace publishing.",
    "includes": [
      "Manual background removal for accurate product cutouts",
      "Smooth edge refinement for clean, professional product photos",
      "Transparent PNG backgrounds for flexible ecommerce use",
      "White background images for Amazon, Shopify, and marketplace listings",
      "Custom background options based on platform or brand requirements",
      "Deep etching for products with defined or complex shapes",
      "Advanced masking for hair, fur, glass, fabric, and fine details",
      "Consistent background treatment across bulk product catalogs",
      "Export-ready JPEG, PNG, TIFF, and PSD files based on requirements"
    ],
    "excludes": [
      "Product retouching",
      "Shadow creation"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process large product catalogs with consistent manual cutouts, aligned background settings, and organized exports for ecommerce, marketplace, and agency workflows.",
    "bulkPoints": [
      "Bulk background removal for ecommerce catalogs",
      "Consistent cutout quality across image sets",
      "Custom workflow for recurring product editing needs"
    ],
    "whereBest": "Background Removal service works best for ecommerce product listings, Amazon white-background product photos, Shopify transparent PNG cutouts, marketplace catalog images, social media ad assets, clothing and accessory cutouts, agency product cleanup, and bulk background removal for multi-SKU catalogs.",
    "idealForText": "Perfect for ecommerce brands, Amazon and Shopify sellers, marketplace retailers, product photographers, and digital agencies that need clean product cutouts, transparent PNGs, white backgrounds, smooth edges, and consistent bulk background removal.",
    "faqs": [
      {
        "q": "What is needed to get started with background removal?",
        "a": "Original images in any format are typically provided to begin the process. Higher-resolution images help achieve cleaner edges, but standard or low-quality images can also be processed effectively. Background preferences such as white, transparent, or custom should be specified in advance."
      },
      {
        "q": "Can complex edges like hair or transparent objects be handled?",
        "a": "Yes, complex cutouts are handled using advanced masking and manual refinement. This includes hair, fur, glass, and fine details where automated tools are not sufficient."
      },
      {
        "q": "How is consistency maintained across multiple images?",
        "a": "Consistency is maintained through a structured editing workflow that includes clipping path, manual edge refinement, proper feathering, and export settings to ensure uniform results."
      },
      {
        "q": "What file formats are delivered after editing?",
        "a": "Final images can be delivered in formats such as JPEG, PNG, TIFF, or PSD based on requirements."
      },
      {
        "q": "What additional services can improve the final result?",
        "a": "Background removal can be combined with Retouching to clean imperfections and improve appearance of the images. Also adding Shadow can create more depth making highly appealing for ecommerce. You can always add more services after uploading your images."
      },
      {
        "q": "Are images optimized for ecommerce platforms like Shopify or Amazon?",
        "a": "Yes, outputs can be optimized for ecommerce platforms, marketplaces, and social media."
      }
    ]
  },
  "clipping-path": {
    "name": "Clipping Path",
    "supportingLine": "Get clean, precise product image cutouts with hand-drawn clipping paths.",
    "seoParagraph": "Professional clipping path service for ecommerce product image cutouts, catalogs, and commercial photos. Get clean edges, hand-drawn paths, precise object isolation, and edit-ready files.",
    "idealFor": [
      "Ecommerce brands",
      "Product photographers",
      "Digital agencies",
      "Marketplace sellers",
      "Catalog production"
    ],
    "priceText": "0.39",
    "dailyCapacity": "2500+",
    "process": [
      {
        "title": "Every clipping path is manually created to deliver accurate product edges, clean separation, and edit-ready results for ecommerce and commercial workflows.",
        "desc": "Image Review"
      },
      {
        "title": "We check product shape, edge complexity, background condition, and required path use before editing begins.",
        "desc": "Hand-Drawn Path Creation"
      },
      {
        "title": "Objects are manually outlined with precise clipping paths to separate the subject cleanly from the background.",
        "desc": "Edge Accuracy Refinement"
      },
      {
        "title": "Curves, corners, holes, inner areas, and detailed product edges are adjusted for smooth, accurate cutouts.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive precise clipping paths and product cutouts prepared for ecommerce listings, catalogs, retouching, and post-production workflows.",
    "includes": [
      "Hand-drawn clipping paths for clean and accurate product edges with 1-2px tolerance",
      "Precise object isolation for ecommerce and catalog images",
      "Smooth cutouts for simple, moderate, and complex product shapes",
      "Editable paths for background removal, color correction, and retouching workflows",
      "Clean product separation for Amazon, Shopify, marketplaces, and catalogs",
      "Accurate inner path handling for holes, gaps, handles, and detailed areas",
      "Path-ready files for designers, retouchers, photographers, and agencies",
      "Consistent clipping quality across bulk product image sets",
      "Commercial-ready cutouts for product listings, ads, and print layouts",
      "File delivery based on required editing or publishing workflow"
    ],
    "excludes": [
      "Multi-part object separation",
      "Layer masking",
      "Retouching or color correction"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume product images with consistent hand-drawn paths, organized editing rules, and reliable cutout quality for ecommerce catalogs, marketplaces, agencies, and recurring production workflows.",
    "bulkPoints": [
      "Bulk clipping path production for product catalogs",
      "Consistent path accuracy across large image sets",
      "Custom workflow for recurring ecommerce editing needs"
    ],
    "whereBest": "Clipping Path is best for ecommerce product cutouts, background removal preparation, Amazon and Shopify product listings, catalog image editing, product photo retouching workflows, object isolation for ads and layouts, marketplace image cleanup, and bulk clipping path production for agencies and studios.",
    "idealForText": "Perfect for ecommerce brands, product photographers, digital agencies, marketplace sellers, and catalog productions that need hand-drawn clipping paths, precise product cutouts, clean object isolation, and edit-ready files for commercial image workflows.",
    "faqs": [
      {
        "q": "Can detailed product edges be handled accurately in this service?",
        "a": "Yes, all paths are created manually to ensure high precision, even for complex shapes, especially the edges are manually drawn and adjusted to ensure smooth and precise cutouts."
      },
      {
        "q": "What types of images are best suited for clipping path editing?",
        "a": "All kinds of images can be handled whether they have defined or de-focused edges. Our clipping path experts handle every image professionally so that anyone can easily use the paths to do their desired refinement. This includes apparel, accessories, electronics, packaged goods, models, furniture, animals, trees, bicycles, food, or anything."
      },
      {
        "q": "Do you offer discounts for large or bulk orders?",
        "a": "Yes, custom pricing is available for high-volume projects."
      }
    ]
  },
  "color-change": {
    "name": "Color Change",
    "supportingLine": "Create accurate product color variants while preserving lighting, shadows, texture, and real product appearance.",
    "seoParagraph": "Professional color change service for product photos, apparel, accessories, and ecommerce catalogs. Create accurate color variants from one base image using HEX, Pantone, or sample references while preserving lighting, shadows, texture, and realistic product depth.",
    "idealFor": [
      "Ecommerce brands",
      "Apparel retailers",
      "Marketplace sellers",
      "Product photographers",
      "Digital agencies"
    ],
    "priceText": "0.30",
    "dailyCapacity": "2000+",
    "process": [
      {
        "title": "Every product color change is handled with reference-based editing to keep color variants accurate, realistic, and ecommerce-ready.",
        "desc": "Image & Reference Review"
      },
      {
        "title": "We check the base product image, color references, lighting condition, material type, and required color variants.",
        "desc": "Color Matching"
      },
      {
        "title": "Colors are adjusted using HEX codes, Pantone values, sample images, or product references for accurate matching.",
        "desc": "Texture Preservation"
      },
      {
        "title": "Lighting, shadows, fabric grain, reflections, folds, and product texture are confirmed to be preserved so the result does not look flat or artificial.",
        "desc": "Export & QC"
      }
    ],
    "whatWeHandle": "Receive accurate product color variants prepared for ecommerce listings, catalogs, campaigns, and marketplace publishing.",
    "includes": [
      "Product color change editing from one base image",
      "Accurate color variants using HEX, Pantone, or sample references",
      "Bulk colorway creation for apparel, accessories, and product catalogs",
      "Texture-preserving color edits for fabric, leather, plastic, metal, and product surfaces",
      "Consistent lighting, shadows, and depth across every color version",
      "Realistic product colors that match reference direction more closely",
      "Ecommerce-ready color variants for Shopify, Amazon, and marketplaces",
      "Product variation images for listings, catalogs, ads, and campaigns",
      "Manual QC to reduce color mismatch and improve product presentation",
      "Delivery format based on required ecommerce or production workflow"
    ],
    "excludes": [
      "Pattern or texture replacement",
      "Product retouching"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Create high-volume product color variants with consistent color matching, preserved textures, aligned export settings, and organized workflows for ecommerce catalogs and recurring product launches.",
    "bulkPoints": [
      "Bulk product color change for ecommerce catalogs",
      "Consistent color matching across full product sets",
      "Custom workflow for recurring colorway production"
    ],
    "whereBest": "Color Change service creates apparel color variations, ecommerce product color options, bulk colorways from one base image, marketplace variant visuals, Shopify and Amazon product color.",
    "idealForText": "Best for ecommerce brands, apparel retailers, marketplace sellers, product photographers, and digital agencies that need accurate product color variants from one base image while preserving lighting, shadows, texture, and realistic product appearance.",
    "faqs": [
      {
        "q": "What is required for product color change editing?",
        "a": "A base image and color references such as HEX codes, Pantone values, or sample images are required for accurate matching."
      },
      {
        "q": "How is color accuracy ensured?",
        "a": "Color accuracy is achieved using color-calibrated editing setups and reference-based correction to match the real product on the shelf. Lighting, shadows, and texture are preserved while maintaining true-to-life consistency, supported by a structured QC process for precision and reduced return risks."
      },
      {
        "q": "Can multiple color variations be created from a single product image?",
        "a": "Yes, multiple variations can be generated from one base image while maintaining consistent lighting, shadows, and texture across all versions, ideal for ecommerce brands selling products in multiple colorways without reshooting."
      }
    ]
  },
  "color-correction": {
    "name": "Color Correction",
    "supportingLine": "Correct lighting, tone, white balance, and color consistency for clean, professional, high-end photography.",
    "seoParagraph": "Professional product color correction for ecommerce, fashion, catalogs, and commercial photography. Fix lighting, white balance, exposure, tone, and batch color consistency across every image.",
    "idealFor": [
      "Ecommerce brands",
      "Fashion retailers",
      "Photographers",
      "Creative studios",
      "Digital agencies"
    ],
    "priceText": "0.35",
    "dailyCapacity": "2000+",
    "process": [
      {
        "title": "Every image is color-corrected to improve tone, lighting, balance, and consistency while keeping the final result natural and commercially usable.",
        "desc": "Image Review"
      },
      {
        "title": "We check exposure, white balance, color cast, lighting condition, contrast, and the intended visual style.",
        "desc": "Tone Adjustment"
      },
      {
        "title": "Brightness, contrast, highlights, shadows, warmth, and overall tonal balance are adjusted for a cleaner image.",
        "desc": "Color Consistency"
      },
      {
        "title": "Colors are balanced across image sets so product, fashion, catalog, and campaign visuals look consistent.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive professionally color-corrected images prepared for ecommerce, catalogs, campaigns, advertising, and high-end photography workflows.",
    "includes": [
      "Image color correction for cleaner, more accurate visuals",
      "Tone adjustment for balanced brightness, contrast, and depth",
      "White balance correction to remove unwanted color casts",
      "Lighting correction for underexposed, overexposed, or uneven images",
      "Color consistency across ecommerce product sets and campaigns",
      "Batch color matching for catalogs, lookbooks, and marketplace visuals",
      "Professional photo color grading support based on visual direction",
      "Manual QC for lighting, tone, consistency, and final polish"
    ],
    "excludes": [
      "Product color variant creation",
      "Heavy retouching",
      "Heavy color change"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume image sets with consistent tone, lighting, color balance, and export rules for ecommerce catalogs, fashion campaigns, product launches, and recurring brand content.",
    "bulkPoints": [
      "Bulk color correction for ecommerce and catalog images",
      "Consistent tone and lighting across full image sets",
      "Custom workflow for recurring brand or campaign production"
    ],
    "whereBest": "Color Correction service is for improving ecommerce product photos, fashion lookbooks, catalog image consistency, white balance issues, studio and lifestyle lighting, campaign image color matching, high-end photography tone refinement, and marketplace-ready visual cleanup.",
    "idealForText": "Perfect for product photographers, creative studios, ecommerce brands, fashion retailers, and digital agencies that need consistent lighting, tone, white balance, exposure, and color correction across product photos, catalogs, campaigns, and commercial image sets.",
    "faqs": [
      {
        "q": "What is image color correction?",
        "a": "Image color correction adjusts lighting, tone, white balance, exposure, and color consistency so photos look cleaner, more accurate, and professionally balanced."
      },
      {
        "q": "What types of images can be color-corrected?",
        "a": "Product photos, fashion images, model shots, lifestyle photos, catalog images, campaign visuals, and high-end photography can be corrected based on the required visual style."
      },
      {
        "q": "What should I provide for color correction?",
        "a": "Original images are required. If you have brand references, sample edits, color direction, or a preferred visual style, those can help guide the final result."
      },
      {
        "q": "Can you correct lighting and white balance issues?",
        "a": "Yes. Lighting, exposure, color casts, warmth, shadows, highlights, and white balance can be adjusted to create a more natural and consistent look."
      },
      {
        "q": "Can color correction be applied across a full image set?",
        "a": "Yes. Bulk image sets can be corrected with consistent tone, lighting, and color balance across product catalogs, campaigns, and ecommerce collections."
      },
      {
        "q": "Are corrected images suitable for ecommerce and advertising?",
        "a": "Yes. Final images can be prepared for ecommerce platforms, catalogs, brand websites, marketplaces, social media, and advertising campaigns."
      }
    ]
  },
  "garment-retouch": {
    "name": "Garment Retouch",
    "supportingLine": "Clean up wrinkles, shape apparel, and refine fabric details while keeping garments natural, realistic, and ecommerce-ready.",
    "seoParagraph": "Professional garment retouching for apparel photography, fashion brands, ecommerce stores, and bulk clothing catalogs. Remove wrinkles, creases, dust, pins, tags, and fabric defects while preserving natural fabric texture, garment shape, and marketplace-ready consistency.",
    "idealFor": [
      "Fashion brands",
      "Apparel retailers",
      "Ecommerce clothing stores",
      "Product photographers",
      "Creative agencies"
    ],
    "priceText": "0.55",
    "dailyCapacity": "5000+",
    "process": [
      {
        "title": "Every garment image is manually refined to improve product presentation while preserving natural fabric texture and apparel structure.",
        "desc": "Image Review"
      },
      {
        "title": "We check garment type, image style, fabric condition, wrinkles, shape issues, and ecommerce or campaign requirements.",
        "desc": "Garment Cleanup"
      },
      {
        "title": "Wrinkles, creases, ironing folds, dust, pins, tags, minor defects, and distracting fabric marks are removed or reduced.",
        "desc": "Fabric & Shape Refinement"
      },
      {
        "title": "Garment structure, symmetry, folds, seams, edges, and fabric texture are refined for a clean but realistic appearance.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive clean, consistent apparel images prepared for ecommerce listings, catalogs, lookbooks, ads, and fashion campaigns.",
    "includes": [
      "Wrinkle removal for cleaner apparel product presentation",
      "Fabric retouching that preserves natural texture and material detail",
      "Crease, fold, dust, pin, tag, and minor defect cleanup",
      "Simple reshaping for better structure & look",
      "Clean apparel images for model shots or flat lays",
      "Consistent garment appearance across bulk clothing image sets",
      "Ecommerce-ready apparel visuals for Shopify, Amazon, and marketplaces",
      "Manual QC for fabric realism and visual consistency",
      "Output format as your required ecommerce or production workflow"
    ],
    "excludes": [
      "Ghost mannequin editing",
      "Color or pattern change",
      "Background removal"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume apparel images with consistent wrinkle cleanup, fabric refinement, garment shaping, and organized output settings for ecommerce catalogs, fashion campaigns, and recurring clothing production.",
    "bulkPoints": [
      "Bulk garment retouching for apparel catalogs",
      "Consistent fabric cleanup across full clothing sets",
      "Custom workflow for recurring ecommerce and fashion production"
    ],
    "whereBest": "Garment Retouch service is for cleaning up apparel product photos, remove wrinkles from clothing images, fix fabric defects, refine flat lay garments, polish model apparel shots, clean mannequin-shot clothing, prepare fashion catalogs and lookbooks, and edit bulk clothing images for ecommerce marketplaces.",
    "idealForText": "Ideal for fashion brands, apparel retailers, ecommerce clothing stores, product photographers, and creative agencies that need wrinkle cleanup, fabric refinement, garment shaping, and natural-looking apparel images for listings, lookbooks, catalogs, and campaigns.",
    "faqs": [
      {
        "q": "What types of garment images work for this service?",
        "a": "This service works with all apparel visuals, including model shots, flat lays, in mannequin shots, and multi-angle product images, refined into clean and consistent, ready-to-use commercial outputs."
      },
      {
        "q": "Can wrinkles and fabric imperfections be removed while keeping natural texture?",
        "a": "Yes. Wrinkles, creases, ironing folds, dust, pins, tags, and minor defects are removed or reduced while preserving the natural fabric texture, ensuring garments look clean, realistic, and commercially presentable."
      },
      {
        "q": "Does this service include ghost mannequin or neck joining effects?",
        "a": "No. This service focuses on garment retouching and refinement only. Ghost mannequin effects and neck joining for mannequin-shot apparel are handled under a separate dedicated service designed specifically for that output style."
      }
    ]
  },
  "ghost-mannequin": {
    "name": "Ghost Mannequin",
    "supportingLine": "Create clean invisible mannequin apparel photos with natural shape, accurate neck joints, and catalog-ready consistency.",
    "seoParagraph": "Professional ghost mannequin and neck joint editing for apparel photos. Create clean, realistic 3D clothing images with natural garment shape, symmetry, alignment, and ecommerce-ready consistency.",
    "idealFor": [
      "Fashion brands",
      "Apparel retailers",
      "Ecommerce clothing stores",
      "Product photographers",
      "Catalog production"
    ],
    "priceText": "0.85",
    "dailyCapacity": "1000+",
    "process": [
      {
        "title": "Every garment image is manually edited to create a clean invisible mannequin effect with realistic structure, alignment, and ecommerce-ready presentation.",
        "desc": "Image Review"
      },
      {
        "title": "We check the front image, neck or inner garment image, label area, garment structure, and required catalog style.",
        "desc": "Neck Joint Editing"
      },
      {
        "title": "The inner neck or label area is carefully joined with the main garment to complete the invisible mannequin effect.",
        "desc": "Shape & Symmetry Refinement"
      },
      {
        "title": "Garment alignment, proportions, shoulder balance, sleeves, collar, edges, and natural clothing shape are refined for a structured look.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive clean ghost mannequin images prepared for ecommerce listings, fashion catalogs, marketplaces, and apparel brand presentation.",
    "includes": [
      "Ghost mannequin editing for clean invisible mannequin apparel photos",
      "Neck joint editing using front and inner garment images",
      "Realistic 3D clothing presentation without visible mannequins",
      "Garment shape refinement for structured and natural product appearance",
      "Symmetry shaping for collars, shoulders, sleeves, and garment edges",
      "Clean alignment and proportion matching across clothing images",
      "Consistent apparel presentation across bulk catalogs",
      "Ecommerce-ready images for Shopify, Amazon, and marketplace listings",
      "Professional product visuals for fashion lookbooks, catalogs, and campaigns",
      "Manual QC for neck joint accuracy, garment structure, and visual consistency"
    ],
    "excludes": [
      "Color or pattern change",
      "Missing neck-joint image creation for very complex images"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process full apparel catalogs with consistent ghost mannequin editing, aligned garment shaping, standardized proportions, and organized exports for ecommerce, marketplace, and fashion production workflows.",
    "bulkPoints": [
      "Bulk ghost mannequin editing for clothing catalogs",
      "Consistent neck joint, shape, and symmetry across image sets",
      "Custom workflow for recurring apparel production"
    ],
    "whereBest": "Ghost Mannequin editing creates invisible mannequin apparel listings, neck joint clothing photos, structured 3D clothing presentation, Shopify and Amazon apparel images, fashion catalog visuals, lookbook production, marketplace clothing images, and clean product launch visuals for apparel brands.",
    "idealForText": "Best for fashion brands, apparel retailers, ecommerce clothing stores, product photographers, and catalog productions that need clean, invisible mannequin images, accurate neck joints, natural garment shape, and consistent apparel presentation across catalogs.",
    "faqs": [
      {
        "q": "What is required to create ghost mannequin images?",
        "a": "Front and neck/inner part images of the garment are required. Inner neck or label area images are recommended to complete the invisible mannequin effect accurately."
      },
      {
        "q": "Can ghost mannequin editing be done without neck joint images?",
        "a": "In some cases, it is possible, but the final result may be limited depending on the garment structure. Inner shots provide a more complete finish."
      },
      {
        "q": "How is consistency maintained across a clothing catalog?",
        "a": "Consistency is maintained by standardizing alignment, proportions, lighting, and garment shape across all images. Each product is edited under the same visual rules so every item looks uniform, even if the original photos differ. This ensures a clean, consistent catalog presentation that improves brand trust and product clarity."
      },
      {
        "q": "How will the final images appear?",
        "a": "Garments will appear structured, pixel perfect symmetrical (for applicable ones), and naturally shaped, with a clean and professional presentation suitable for ecommerce."
      }
    ]
  },
  "manipulation": {
    "name": "Image Manipulation",
    "supportingLine": "Create clean, realistic product edits with professional compositing, object removal, object addition, and visual reconstruction.",
    "seoParagraph": "Professional image manipulation and compositing for ecommerce product photos, ads, and campaign visuals. Add or remove objects, rebuild scenes, blend elements, and create realistic commercial edits with clean lighting, shadows, and perspective.",
    "idealFor": [
      "Ecommerce brands",
      "Product photographers",
      "Creative agencies",
      "Marketplace sellers",
      "Advertisements"
    ],
    "priceText": "3.99",
    "dailyCapacity": "500+",
    "process": [
      {
        "title": "Every image manipulation project is handled with a detail-focused editing workflow built around realism, clean blending, and commercial usability.",
        "desc": "Image & Instruction Review"
      },
      {
        "title": "We check the base image, editing instructions, references, object placement needs, and final visual direction.",
        "desc": "Object Editing"
      },
      {
        "title": "Objects are added, removed, replaced, or repositioned while keeping the composition natural and believable.",
        "desc": "Realistic Compositing"
      },
      {
        "title": "Lighting, shadows, reflections, scale, color tone, and perspective are matched so new or edited elements blend into the scene.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive realistic manipulated images prepared for ecommerce, advertising, product campaigns, social media, and commercial publishing.",
    "includes": [
      "Professional image manipulation for product and brand visuals",
      "Object removal for cleaner product photos and campaign images",
      "Object addition with realistic placement, scale, lighting, and shadow matching",
      "Photo compositing for product scenes, advertising visuals, and creative concepts",
      "Background and scene reconstruction for cleaner commercial presentation",
      "Perspective, reflection, and lighting adjustment for believable edits",
      "Product-focused edits for ecommerce listings, ads, catalogs, and websites",
      "Clean visual blending for product, model, lifestyle, and campaign images",
      "Layered PSD files available when flexible post-production is needed",
      "Manual QC for realism, composition, shadows, and final image consistency"
    ],
    "excludes": [
      "New product photography",
      "3D/CGI creation",
      "Unrelated retouching unless requested"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume image manipulation projects with consistent editing direction, realistic compositing standards, and organized output settings for ecommerce, advertising, and recurring creative production.",
    "bulkPoints": [
      "Bulk object removal and image manipulation support",
      "Consistent compositing quality across campaign assets",
      "Custom workflow for recurring ecommerce and creative editing needs"
    ],
    "whereBest": "Utilize image manipulation for product photo object removal, ecommerce image editing, product scene compositing, advertising creative edits, lifestyle image cleanup, background or scene reconstruction, object addition for campaign visuals, and brand-ready social media image production.",
    "idealForText": "Perfect for ecommerce brands, product photographers, creative agencies, marketplace sellers, and advertising teams that need realistic object removal, object addition, image compositing, scene reconstruction, or polished campaign visuals for commercial use.",
    "faqs": [
      {
        "q": "What is required for image manipulation?",
        "a": "A base image and clear instructions or references describing the required changes are needed."
      },
      {
        "q": "Can objects be added or removed realistically?",
        "a": "Yes, elements are blended using proper lighting, shadows, and perspective to maintain realism."
      },
      {
        "q": "Do you provide layered PSD or source files?",
        "a": "Yes, layered files can be provided if requested."
      },
      {
        "q": "How many revisions are included?",
        "a": "We offer unlimited revisions to ensure the final delivery aligns perfectly with your vision."
      }
    ]
  },
  "jewelry-retouch": {
    "name": "Jewelry Retouch",
    "supportingLine": "Create premium jewelry product photos with refined shine, clean reflections, preserved details, and ecommerce-ready polish.",
    "seoParagraph": "High-end jewelry retouching for ecommerce brands, luxury items, rings, watches, necklaces, and bracelets. Refine shine, remove dust, control glare, and preserve stones, prongs, and metal texture.",
    "idealFor": [
      "Jewelry retailers",
      "Luxury ecommerce brands",
      "Watch sellers",
      "Product photographers",
      "Marketplace and catalogs"
    ],
    "priceText": "0.80",
    "dailyCapacity": "1000+",
    "process": [
      {
        "title": "Every jewelry image is manually refined to improve shine, remove distractions, and preserve the original luxury product details.",
        "desc": "Image Review"
      },
      {
        "title": "We check jewelry type, surface condition, reflections, glare, stones, metal texture, and required ecommerce or campaign style.",
        "desc": "Detail Cleanup"
      },
      {
        "title": "Dust, scratches, fingerprints, minor marks, and distracting imperfections are carefully removed from the jewelry surface.",
        "desc": "Shine & Reflection Refinement"
      },
      {
        "title": "Metal shine, gemstone clarity, glare, reflections, highlights, and contrast are refined for a premium but realistic finish.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive polished jewelry visuals prepared for ecommerce listings, catalogs, luxury campaigns, advertising, and marketplace publishing.",
    "includes": [
      "High-end jewelry retouching for rings, necklaces, bracelets, watches, and detailed accessories",
      "Dust, scratch, fingerprint, and surface imperfection cleanup",
      "Reflection control for cleaner metal, stone, and glass-like surfaces",
      "Glare reduction without making jewelry look flat or over-edited",
      "Shine enhancement for a premium ecommerce and luxury product look",
      "Stone, prong, engraving, clasp, and metal texture preservation",
      "Color, contrast, and brightness refinement for cleaner product presentation",
      "Marketplace-ready jewelry images for ecommerce stores and product catalogs",
      "Consistent retouching across bulk jewelry product sets",
      "Manual QC for sharpness, realism, detail accuracy, and commercial polish"
    ],
    "excludes": [
      "Background removal",
      "Clipping path",
      "3D jewelry rendering"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume jewelry catalogs with consistent shine refinement, reflection control, surface cleanup, and organized output settings for ecommerce, marketplace, and luxury product workflows.",
    "bulkPoints": [
      "Bulk jewelry retouching for product catalogs",
      "Consistent polish across rings, watches, necklaces, and bracelets",
      "Custom workflow for recurring ecommerce jewelry production"
    ],
    "whereBest": "Use Jewelry Retouch for ecommerce jewelry product photos, ring retouching, watch cleanup, necklace and bracelet catalog images, reflection and glare control, luxury product presentation, marketplace-ready jewelry visuals, campaign images, and bulk jewelry catalog retouching.",
    "idealForText": "Perfect for jewelry retailers, luxury ecommerce brands, watch sellers, product photographers, and marketplace or catalog teams that need premium jewelry retouching, refined shine, clean reflections, glare control, and preserved stone or metal details.",
    "faqs": [
      {
        "q": "What types of jewelry images are suitable for retouching?",
        "a": "Rings, necklaces, bracelets, watches, and other reflective or detailed items can be retouched, including studio and lifestyle shots, even shots taken with phone cameras."
      },
      {
        "q": "How is a premium finish achieved in jewelry images?",
        "a": "Reflections are refined, dust and scratches are removed, and shine is enhanced carefully while maintaining original features."
      },
      {
        "q": "Can intricate jewelry details be preserved?",
        "a": "Yes, fine details such as stones, prongs, and metal textures are handled with precision and the details are preserved to resemble the original product."
      },
      {
        "q": "How are reflections and glare handled in jewelry images?",
        "a": "Reflections are refined and controlled carefully to enhance shine without overexposure or distortion. Unwanted bad reflections are removed or polished."
      },
      {
        "q": "Do you offer discounts for large or bulk orders?",
        "a": "Yes, custom pricing is available for high-volume projects."
      }
    ]
  },
  "model-retouch": {
    "name": "Model Retouch",
    "supportingLine": "Refine model images with natural skin texture, clean hair, balanced lighting, and subtle body shaping for commercial and fashion photography.",
    "seoParagraph": "High-end model retouching for fashion, ecommerce apparel, editorial, commercial, and agency photography. Refine skin, hair, lighting, body shape, and campaign consistency while preserving natural texture.",
    "idealFor": [
      "Fashion brands",
      "Commercial photographers",
      "Creative agencies",
      "Editorials and campaigns"
    ],
    "priceText": "1.20",
    "dailyCapacity": "2500+",
    "process": [
      {
        "title": "Every model image is manually refined to improve presentation while preserving natural texture, proportions, and brand style.",
        "desc": "Image Review"
      },
      {
        "title": "We check skin condition, lighting, hair, body shape, background distractions, styling needs, and campaign direction.",
        "desc": "Skin & Detail Retouching"
      },
      {
        "title": "Skin tone, blemishes, uneven texture, flyaways, loose strands, and distracting marks are cleaned while keeping the model natural.",
        "desc": "Shape & Style Refinement"
      },
      {
        "title": "Subtle body adjustments, lighting balance, hair cleanup, tattoo removal, and campaign-style alignment are handled based on requirements.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive polished model images prepared for e-commerce, fashion campaigns, editorials, advertising, catalogs, and brand publishing.",
    "includes": [
      "High-end model retouching for fashion, ecommerce, and commercial photography",
      "Natural skin retouching that preserves real skin texture",
      "Blemish, spot, uneven tone, and minor distraction cleanup",
      "Hair flyaway and loose strand refinement for a cleaner look",
      "Subtle body reshaping with natural proportions and realistic balance",
      "Lighting, contrast, and detail enhancement for stronger visual presentation",
      "Background distraction cleanup where it affects the model image",
      "Tattoo minimization or removal based on project requirements",
      "Brand and campaign style matching for consistent visual identity",
      "Manual QC for texture, realism, proportions, and commercial polish"
    ],
    "excludes": [
      "Garment retouching",
      "Background removal"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume model image sets with consistent skin retouching, hair cleanup, body-shape refinement, lighting balance, and campaign-style alignment for ecommerce, fashion, and commercial production.",
    "bulkPoints": [
      "Bulk model retouching for campaigns and catalogs",
      "Consistent skin, lighting, and style across image sets",
      "Custom workflow for recurring fashion and ecommerce production"
    ],
    "whereBest": "Use Model Retouch for fashion model images, ecommerce apparel model photos, commercial skin retouching, hair flyaway cleanup, subtle body shaping, tattoo removal or minimization, editorial retouching, advertising visuals, and consistent brand campaign imagery.",
    "idealForText": "Best for fashion brands, ecommerce apparel brands, commercial photographers, creative agencies, and editorial campaigns that need natural skin retouching, hair cleanup, subtle body shaping, lighting balance, and polished model images for commercial use.",
    "faqs": [
      {
        "q": "What aspects of a model image can be retouched?",
        "a": "Retouching can include skin refinement, lighting balance, hair cleanup, background distractions, and overall detail enhancement while maintaining a natural look."
      },
      {
        "q": "Can body shaping or adjustments be done in model retouching?",
        "a": "Yes, subtle body adjustments can be applied where needed, ensuring proportions remain natural and consistent with the original image."
      },
      {
        "q": "Can retouching match a specific brand or campaign style?",
        "a": "Yes, retouching can be aligned with brand guidelines or campaign references to maintain a consistent visual identity across all assets."
      },
      {
        "q": "Can hair flyaways and loose strands be cleaned up?",
        "a": "Yes, stray hair and flyaways can be refined to create a cleaner and more controlled look without making it appear artificial."
      },
      {
        "q": "Can tattoos be removed in model retouching?",
        "a": "Yes, tattoos can be minimized or removed while preserving natural skin texture and tone. The final result is refined and reviewed through a structured quality assurance process to ensure consistency and realism."
      }
    ]
  },
  "multi-clipping-path": {
    "name": "Multi-Clipping Path",
    "supportingLine": "Separate product parts, colors, and details with precise multi-clipping paths for controlled editing and catalog-ready workflows.",
    "seoParagraph": "Advanced multi-clipping path service for precise color pathing, object separation, expert masking, and complex product editing. Ideal for ecommerce, catalogs, high-end photography, and bulk image workflows.",
    "idealFor": [
      "Ecommerce brands",
      "Product photographers",
      "Digital agencies",
      "Fashion and product studios"
    ],
    "priceText": "0.90",
    "dailyCapacity": "1000+",
    "process": [
      {
        "title": "Every multi-clipping path file is manually prepared to separate product areas cleanly for color correction, retouching, masking, and controlled post-production.",
        "desc": "Image Review"
      },
      {
        "title": "We check the subject, product parts, color areas, editing needs, and separation instructions before creating paths.",
        "desc": "Path Separation"
      },
      {
        "title": "Each required section is manually outlined into separate paths, including colors, product components, fabric parts, or detailed areas.",
        "desc": "Mask & Path Organization"
      },
      {
        "title": "Paths and layer masks are organized clearly so editors, designers, and production teams can work faster and more accurately.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive organized multi-clipping path files prepared for ecommerce editing, catalog production, color correction, retouching, and high-end photography workflows.",
    "includes": [
      "Manual multi-clipping paths for precise object and part separation",
      "Separate paths for colors, components, sleeves, collars, labels, handles, or product details",
      "Accurate color pathing for controlled color correction and product variation editing",
      "Expert masking support for complex products and high-end photography",
      "Editable path structure for retouching, background changes, and selective adjustments",
      "Organized PSD or TIFF files for smoother production workflows",
      "Clean separation for apparel, accessories, furniture, electronics, jewelry, and product catalogs",
      "Consistent path accuracy across bulk ecommerce image sets",
      "Workflow-ready files for agencies, studios, retouchers, and catalog production",
      "Manual QC for pinpoint accuracy, clean separation, and file organization"
    ],
    "excludes": [
      "Final retouching or color correction",
      "Hair/fur/glass masking",
      "Product recoloring"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process large image sets with consistent multi-clipping path separation, organized file structure, and clear production rules for ecommerce catalogs, studios, agencies, and recurring product editing workflows.",
    "bulkPoints": [
      "Bulk multi-clipping path production for catalogs",
      "Consistent object separation across large image sets",
      "Custom workflow for brands, studios, and agencies"
    ],
    "whereBest": "Use Multi-Clipping Path for ecommerce product images, color pathing, apparel part separation, selective color correction, complex product editing, layer mask preparation, high-end photography post-production, and bulk image pathing for agencies, studios, and catalogs.",
    "idealForText": "Ideal for product photographers, digital agencies, catalog production, ecommerce brands and fashion or product studios that need precise multi-clipping paths, color pathing, object separation, expert masking, and organized files for controlled editing.",
    "faqs": [
      {
        "q": "How is precision maintained in multi-clipping path editing?",
        "a": "Each section is separated carefully to allow controlled and accurate edits. Our multi-clipping path ensures pinpoint accuracy in object separation."
      },
      {
        "q": "How can the final multi-clipping path files be delivered?",
        "a": "Files are delivered with individual paths for each separated part such as colors, different parts of subjects, sleeves, collar, or any component you need. Layer masks are also available if preferred. Including clear separation instructions with your order ensures everything is organized for your workflow."
      },
      {
        "q": "Do you offer discounts for bulk or high-volume multi-clipping path orders?",
        "a": "Yes, custom pricing is available for high-volume projects. The more images you send, the better the rate, ideal for brands, studios, and agencies managing large catalogs. Share your volume to get a custom quote."
      }
    ]
  },
  "pattern-change": {
    "name": "Pattern Change",
    "supportingLine": "Replace or modify fabric patterns and textures while preserving folds, seams, lighting, depth, and natural product realism.",
    "seoParagraph": "Professional fabric pattern and texture change editing for apparel, ecommerce, home decor, and product photos. Create realistic design variations with accurate alignment, folds, seams, and texture flow.",
    "idealFor": [
      "Fashion brands",
      "Apparel retailers",
      "Home decor brands",
      "Ecommerce product retailers",
      "Digital agencies"
    ],
    "priceText": "1.25",
    "dailyCapacity": "500+",
    "process": [
      {
        "title": "Every pattern change is manually refined to keep the new design realistic, aligned, and consistent with the original product structure.",
        "desc": "Image & Pattern Review"
      },
      {
        "title": "We check the base image, reference pattern, fabric type, product shape, folds, seams, and required design direction.",
        "desc": "Pattern Replacement"
      },
      {
        "title": "The selected pattern or texture is applied to the product while matching placement, scale, angle, and visible product areas.",
        "desc": "Fabric Realism Refinement"
      },
      {
        "title": "Folds, seams, contours, lighting, shadows, depth, and texture flow are adjusted so the pattern follows the product naturally.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive realistic pattern and texture variations prepared for ecommerce listings, catalogs, campaigns, product testing, and design presentations.",
    "includes": [
      "Fabric pattern change editing for apparel, home decor, and product photos",
      "Texture replacement that follows folds, seams, curves, and product contours",
      "Multiple design variations created from one base image",
      "Accurate pattern scaling, placement, and alignment across every output",
      "Realistic fabric depth, lighting, shadow, and texture preservation",
      "Ecommerce-ready pattern variants for Shopify, Amazon, and marketplaces",
      "Design preview images for product launches, catalogs, and campaigns",
      "Consistent pattern treatment across bulk image sets",
      "Manual QC for scale, alignment, folds, seams, and natural product appearance",
      "Delivery based on your required ecommerce or production requirements"
    ],
    "excludes": [
      "New pattern design creation",
      "Color change"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Create high-volume pattern and texture variations with consistent scaling, alignment, fabric realism, and organized export settings for ecommerce catalogs, apparel collections, home decor products, and recurring design launches.",
    "bulkPoints": [
      "Bulk pattern change editing for product catalogs",
      "Consistent pattern scale and placement across image sets",
      "Custom workflow for recurring design variation production"
    ],
    "whereBest": "Pattern Change service is for apparel pattern replacement, fabric texture editing, home decor product variations, product design previews, multiple pattern options from one base image, marketplace-ready design variants, catalog visuals for new collections, and seasonal campaign assets.",
    "idealForText": "Best for fashion brands, apparel retailers, home decor brands, ecommerce product photo editing, and digital agencies that need realistic fabric pattern changes, texture replacement, design variations, and accurate alignment across folds, seams, and product contours.",
    "faqs": [
      {
        "q": "What is required for pattern or texture change editing?",
        "a": "A high-quality base image and a clear reference pattern or texture are required to accurately replace or modify designs while maintaining fabric realism, alignment, and natural product appearance."
      },
      {
        "q": "Will fabric remain realistic and consistent after pattern changes?",
        "a": "Yes. Fabric folds, lighting, and depth are preserved to maintain a natural, realistic look. Patterns are also adjusted to follow folds, seams, and contours for a natural appearance consistently across all images to ensure uniformity."
      },
      {
        "q": "Can multiple design variations be created efficiently?",
        "a": "Yes, multiple pattern variations can be generated from a single base image."
      },
      {
        "q": "How is consistency ensured across designs?",
        "a": "Pattern scaling, placement, and alignment are standardized across all images. Every output is then reviewed through a structured 3-step quality assurance process to ensure accuracy, and production-ready consistency."
      }
    ]
  },
  "raster-to-vector": {
    "name": "Raster to Vector Conversion",
    "supportingLine": "Convert low-resolution raster images into clean, editable, scalable vector files for logos, artwork, packaging, and print.",
    "seoParagraph": "High-quality raster to vector conversion and logo tracing for logos, icons, sketches, line art, product graphics, and artwork. Get clean, editable, scalable vector files for branding, packaging, and print.",
    "idealFor": [
      "Ecommerce brands",
      "Graphic designers",
      "Print companies",
      "Packaging designs",
      "Branding agencies"
    ],
    "priceText": "4.99",
    "dailyCapacity": "500+",
    "process": [
      {
        "title": "Every raster to vector project is recreated with clean shapes, accurate lines, and scalable structure for professional design and print workflows.",
        "desc": "File Review"
      },
      {
        "title": "We check the original raster image, resolution, artwork complexity, line quality, color references, and required output format.",
        "desc": "Vector Tracing"
      },
      {
        "title": "Logos, icons, illustrations, sketches, line art, or product graphics are recreated into clean vector paths.",
        "desc": "Shape & Color Refinement"
      },
      {
        "title": "Edges, curves, typography, spacing, colors, and graphic details are refined so the vector looks clean and usable.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive clean vector files prepared for branding, packaging, print, ecommerce, and large-format production.",
    "includes": [
      "Raster to vector conversion for JPG, PNG, and other raster images",
      "Logo tracing for clean, scalable brand assets",
      "Image tracing for artwork, icons, illustrations, sketches, and line art",
      "Editable vector paths for flexible color, shape, and size adjustments",
      "Cleaner edges and sharper lines than low-resolution raster graphics",
      "Recreated product graphics for packaging, labels, catalogs, and ecommerce use",
      "Scalable files suitable for print, signage, embroidery, branding, and large-format output",
      "Color and style matching based on provided references, where available",
      "Manual QC for line accuracy, curve smoothness, shape clarity, and usability",
      "Delivery based on your preferred design, print, or production workflow"
    ],
    "excludes": [
      "Logo or artwork design from scratch",
      "Photo retouching"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Convert large sets of logos, icons, artwork, product graphics, or print assets into clean, scalable vector files with consistent tracing quality and organized output settings.",
    "bulkPoints": [
      "Bulk raster to vector conversion for artwork sets",
      "Consistent line, shape, and color quality across files",
      "Custom workflow for recurring design, packaging, and print production"
    ],
    "whereBest": "Use Raster to Vector conversion for logo tracing, print-ready vector files, icon and illustration recreation, sketch and line art conversion, ecommerce product graphic recreation, packaging artwork preparation, large-format signage graphics, and editable brand asset creation.",
    "idealForText": "Perfect for graphic designers, print companies, packaging designs, and branding agencies that need low-resolution logos, icons, sketches, line art, product graphics, or artwork converted into clean, editable, scalable vector files.",
    "faqs": [
      {
        "q": "What types of files can be converted from raster to vector?",
        "a": "Logos, icons, illustrations, sketches, line art, and product graphics can be converted into vector format. Low-resolution graphics can also be recreated as clean, scalable vectors. The final quality depends on the clarity of the original, but most designs can be refined into usable vector files."
      },
      {
        "q": "What needs to be provided for raster to vector conversion?",
        "a": "The original raster image (JPG, PNG, or similar) is enough to get started. If there is a preferred style, color reference, or output format, it can be shared to guide the final result."
      },
      {
        "q": "Can edits or adjustments be made after conversion?",
        "a": "Yes, vectors are fully editable, allowing changes to colors, shapes, and elements without affecting quality. Revisions can be applied based on feedback while maintaining consistency."
      },
      {
        "q": "Who is this service best suited for?",
        "a": "This service is ideal for businesses, designers, print companies, and ecommerce brands that need scalable graphics for logos, branding, packaging, or large-format printing."
      }
    ]
  },
  "retouching": {
    "name": "Retouching",
    "supportingLine": "Clean, polish, and refine ecommerce product images with natural detail, consistent quality, and professional commercial finish.",
    "seoParagraph": "Professional ecommerce image retouching for bulk product photos, catalogs, and commercial visuals. Clean dust, scratches, reflections, surfaces, and imperfections while preserving natural texture and product accuracy.",
    "idealFor": [
      "Ecommerce brands",
      "Product photographers",
      "Marketplace sellers",
      "Digital agencies",
      "Catalog production"
    ],
    "priceText": "0.55",
    "dailyCapacity": "2500+",
    "process": [
      {
        "title": "Every image is manually refined to improve product presentation while keeping the final result natural, accurate, and ecommerce-ready.",
        "desc": "Image Review"
      },
      {
        "title": "We check product condition, image quality, surface issues, reflections, lighting, and any reference or brand direction.",
        "desc": "Detail Cleanup"
      },
      {
        "title": "Dust, scratches, marks, surface imperfections, minor distractions, and product flaws are carefully cleaned.",
        "desc": "Texture & Consistency Refinement"
      },
      {
        "title": "Natural texture, reflections, tone, lighting, and product details are refined across the image set for a polished look.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive professionally retouched visuals prepared for ecommerce listings, catalogs, campaigns, advertising, and commercial publishing.",
    "includes": [
      "Product image retouching for cleaner ecommerce presentation",
      "Dust, scratch, mark, and surface imperfection cleanup",
      "Reflection adjustment for cleaner product and material appearance",
      "Minor object cleanup for distracting elements or visual noise",
      "Texture-preserving retouching for natural product detail",
      "Consistency adjustments across bulk product image sets",
      "Clean polished visuals for Shopify, Amazon, marketplaces, and catalogs",
      "Commercial-ready product photos for ads, websites, and campaigns",
      "Layered PSD or source files available when requested",
      "Manual QC through a structured quality assurance workflow"
    ],
    "excludes": [
      "Background removal",
      "Color or pattern change",
      "Ghost mannequin editing",
      "Heavy image manipulation"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process high-volume product images with consistent cleanup, texture-preserving retouching, aligned visual standards, and organized exports for ecommerce catalogs, marketplaces, and recurring commercial workflows.",
    "bulkPoints": [
      "Bulk ecommerce image retouching for product catalogs",
      "Consistent polish across large product image sets",
      "Custom workflow for recurring product editing needs"
    ],
    "whereBest": "Retouching service is for ecommerce product image cleanup, bulk product photo polishing, surface imperfection removal, dust and scratch cleanup, reflection adjustment, catalog image consistency, marketplace-ready product photos, and advertising or campaign image refinement.",
    "idealForText": "Perfect for ecommerce brands, product photographers, marketplace sellers, digital agencies, and catalog production teams that need clean, polished product images with dust cleanup, scratch removal, reflection adjustment, texture preservation, and consistent commercial quality.",
    "faqs": [
      {
        "q": "What files & instructions need to be provided for retouching?",
        "a": "Just the original images are enough to get started. It’s a simple process from there, and any specific instructions or reference images can be shared if a particular look is needed."
      },
      {
        "q": "What types of retouching are done here?",
        "a": "Retouching includes any kind of product images, ecommerce listings, and commercial visuals. This includes cleaning up product surfaces, dust and scratches, reflection adjustment, and etc. It can also include minor object cleanup, and consistency adjustments across image sets, all reviewed through a 3-step quality assurance process."
      },
      {
        "q": "Is natural texture preserved during retouching?",
        "a": "Yes, professional techniques such as frequency separation, dodging burning & etc. are used to refine skin or any subject surface while maintaining natural texture and detail."
      },
      {
        "q": "What is required for high-end retouching?",
        "a": "High-resolution images are required to ensure precise detailing and clean editing output. Clear, well-lit files (RAW or high-quality JPEG/PNG) are preferred to avoid quality loss during retouching. Reference images or brand style guidelines are also recommended so the final result matches the expected visual direction and brand consistency."
      },
      {
        "q": "Will the images maintain a natural look after retouching?",
        "a": "Yes, adjustments are made carefully to enhance the image while preserving natural textures and look. Anything that makes the result look fake is carefully avoided."
      },
      {
        "q": "Do you provide layered PSD or source files?",
        "a": "Yes, layered files can be provided if requested in preferred file formats e.g., PSD, TIFF, etc."
      },
      {
        "q": "Who is this retouching service for?",
        "a": "This service is ideal for ecommerce brands and creatives who need clean, consistent, high-quality visuals for listings, campaigns, and catalogs where visuals directly impact sales. Each image goes through a structured QA process handled by expert retouching specialists and senior visual editors to ensure precision, consistency, and commercial-grade results."
      }
    ]
  },
  "shadow-creation": {
    "name": "Shadow Creation",
    "supportingLine": "Add realistic product shadows that create depth, grounding, and a more professional ecommerce presentation.",
    "seoParagraph": "Professional shadow creation for product photography, ecommerce, catalogs, and ads. Add natural shadows, drop shadows, reflection shadows, cast shadows, and soft directional shadows for realistic product depth.",
    "idealFor": [
      "Ecommerce brands",
      "Product photographers",
      "Marketplace sellers",
      "Digital agencies",
      "Catalog productions"
    ],
    "priceText": "0.35",
    "dailyCapacity": "2500+",
    "process": [
      {
        "title": "Every product shadow is created to match the product shape, lighting direction, background style, and ecommerce presentation needs.",
        "desc": "Image Review"
      },
      {
        "title": "We check the product angle, surface type, lighting direction, background, and preferred shadow style before editing.",
        "desc": "Shadow Creation"
      },
      {
        "title": "Natural shadows, drop shadows, reflection shadows, cast shadows, or soft directional shadows are created based on the product and visual goal.",
        "desc": "Realism Refinement"
      },
      {
        "title": "Shadow softness, opacity, blur, direction, scale, and contact points are adjusted so the product looks grounded and believable.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive professional product images with realistic shadows prepared for ecommerce listings, catalogs, advertising, and marketplace publishing.",
    "includes": [
      "Natural shadow creation for grounded product presentation",
      "Drop shadows for clean ecommerce and marketplace product images",
      "Reflection shadows for glossy, premium, or studio-style visuals",
      "Cast & touch up shadows matched to product shape, surface, and lighting direction",
      "Soft directional shadows for realistic product depth and dimension",
      "Shadow refinement for opacity, blur, contact points, and perspective",
      "Product-focused shadow styling for Amazon, Shopify, and catalogs",
      "Consistent shadow treatment across bulk product image sets",
      "Commercial-ready product visuals for ads, websites, and campaigns",
      "Manual QC for realism, lighting match, and ecommerce-ready polish"
    ],
    "excludes": [
      "Background removal",
      "Product retouching"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Process large product image sets with consistent shadow direction, softness, opacity, and background alignment for ecommerce catalogs, marketplaces, and recurring product photography workflows.",
    "bulkPoints": [
      "Bulk shadow creation for ecommerce product catalogs",
      "Consistent shadow style across full image sets",
      "Custom workflow for recurring product editing needs"
    ],
    "whereBest": "Shadow Creation service adds realistic product depth for ecommerce listings, drop shadow marketplace images, natural product shadows, reflection shadows for premium visuals, cast shadows for realistic grounding, Shopify and Amazon image enhancement, catalog consistency, and campaign-ready product polish.",
    "idealForText": "Best for ecommerce brands, product photographers, marketplace sellers, digital agencies, and catalog productions that need realistic drop shadows, natural shadows, reflection shadows, cast shadows, or soft directional shadows for better product depth.",
    "faqs": [
      {
        "q": "Why is shadow creation important?",
        "a": "Shadow creation adds depth and realism to product images, making them look more grounded and visually appealing. It improves product presentation and helps create a more professional, high-converting look for ecommerce and marketing use."
      },
      {
        "q": "What types of shadows can be created?",
        "a": "Natural shadows, drop shadows, reflection shadows, and soft or directional shadows can be created based on the product type and desired visual style, ensuring a realistic and commercially suitable appearance."
      },
      {
        "q": "What is recommended for shadow creation?",
        "a": "Product images are the primary input. A preferred shadow style or reference can help guide the final look, ensuring the shadow aligns with the intended presentation and overall visual consistency."
      }
    ]
  },
  "sketch-to-reality": {
    "name": "Sketch to Image Rendering",
    "supportingLine": "Transform hand-drawn sketches into clean, photorealistic renders for product concepts, campaigns, and visual presentation.",
    "seoParagraph": "Professional sketch-to-image rendering for hand drawings, product concepts, and creative visuals. Convert sketches into photorealistic images for product visualization, campaign concepts, presentations, and ecommerce ideas.",
    "idealFor": [
      "Product designers",
      "Ecommerce brands",
      "Creative agencies",
      "Advertising teams",
      "Concept artists and studios"
    ],
    "priceText": "3.50",
    "dailyCapacity": "100+",
    "process": [
      {
        "title": "Every sketch-to-image project is refined through a controlled rendering workflow focused on realism, visual clarity, and commercial usability.",
        "desc": "Sketch Review"
      },
      {
        "title": "We check the hand drawing, reference images, product idea, required style, and final visual direction before rendering begins.",
        "desc": "Image Rendering"
      },
      {
        "title": "The sketch is converted into a photorealistic image with structured form, realistic depth, material direction, and clean visual composition.",
        "desc": "Realism Refinement"
      },
      {
        "title": "Lighting, shadows, textures, proportions, perspective, surface details, and background style are refined for a polished final result.",
        "desc": "QC & Export"
      }
    ],
    "whatWeHandle": "Receive polished sketch-to-image renders prepared for product concepts, ecommerce visuals, advertising, presentations, and creative production.",
    "includes": [
      "Sketch-to-image rendering from hand drawings or rough concepts",
      "Photorealistic image creation for product, campaign, and creative visuals",
      "Refined lighting, shadows, depth, and surface texture",
      "Style matching based on reference images or brand direction, where provided",
      "High-quality renders for ecommerce, ads, pitches, and presentations",
      "Output prepared based on the required platform, campaign, or production workflow",
      "Custom rendering direction for simple concepts or complex visual ideas"
    ],
    "excludes": [
      "CAD or technical drawings",
      "3D modeling"
    ],
    "bulkTitle": "Have a large batch?",
    "bulkSubtitle": "Get a custom quote in minutes.",
    "bulkText": "Convert multiple sketches, product concepts, or campaign ideas into consistent photorealistic renders with aligned style direction, organized output settings, and quality-controlled visual refinement.",
    "bulkPoints": [
      "Bulk sketch-to-image rendering for concept sets",
      "Consistent visual style across multiple rendered assets",
      "Custom workflow for recurring creative and product visualization needs"
    ],
    "whereBest": "Use Sketch to Image Rendering to convert hand-drawn sketches into photorealistic visuals for product concepts, ecommerce concept images, creative pitches, presentation visuals, commercial concept art, product idea visualization, brand exploration, and marketing campaign development.",
    "idealForText": "Perfect for product designers, ecommerce brands, creative agencies, advertising teams, and concept studios that need hand-drawn sketches converted into photorealistic images for product concepts, campaign visuals, presentations, and creative exploration.",
    "faqs": [
      {
        "q": "What is sketch-to-image rendering?",
        "a": "Sketch-to-image rendering converts a hand drawing, rough concept, or visual idea into a polished photorealistic image for presentation, product visualization, ecommerce, or campaign use."
      },
      {
        "q": "What do I need to provide?",
        "a": "A sketch or drawing is required. Reference images, product details, material direction, color preferences, or style examples can help guide the final rendered result."
      },
      {
        "q": "Can rough sketches be converted into realistic images?",
        "a": "Yes. Rough sketches can be enhanced into cleaner, more realistic visuals, but clearer drawings and better references usually help achieve stronger accuracy and detail."
      },
      {
        "q": "Can the final image match a specific style or reference?",
        "a": "Yes. The render can follow provided references for lighting, material, angle, background, color direction, or brand style where possible."
      },
      {
        "q": "Is this service suitable for product concepts?",
        "a": "Yes. It works well for product ideas, packaging concepts, campaign visuals, ecommerce concepts, creative pitches, and pre-production visualization."
      },
      {
        "q": "How is quality checked?",
        "a": "Each render is reviewed for realism, perspective, lighting, texture, proportion, detail clarity, and alignment with the original sketch or reference direction."
      }
    ]
  }
};
