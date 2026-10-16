interface LocalResponse {
  content: string | string[];
  suggestedActions?: { text: string; url?: string }[];
  requiresEmail?: boolean;
  startsOrderFlow?: boolean;
}

interface ResponseRule {
  keywords: string[];
  excludeKeywords?: string[];
  response: LocalResponse;
  priority?: number;
}

const pick = (arr: string[] | string): string => Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr;

const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const match = (text: string, kws: string[], excludeKws?: string[]) => {
  const n = normalize(text);
  const tokens = new Set(n.split(' ').filter(Boolean));
  const keywordMatches = (keyword: string) => {
    const k = normalize(keyword);
    if (!k) return false;

    // Short keywords like "hi", "ai", or "eps" must match whole words.
    // Plain substring matching made messages like "this" accidentally trigger
    // the greeting rule because it contains "hi".
    if (!k.includes(' ') && k.length <= 3) {
      return tokens.has(k);
    }

    return n.includes(k);
  };

  const hasKeyword = kws.some(keywordMatches);
  const hasExclusion = excludeKws && excludeKws.some(keywordMatches);
  return hasKeyword && !hasExclusion;
};

export const getLocalResponse = (msg: string, isGuest: boolean = false): { content: string; suggestedActions?: any[]; requiresEmail?: boolean; startsOrderFlow?: boolean } | null => {
  const rules: ResponseRule[] = [
    // ─── HUMAN / URGENT SUPPORT ───
    {
      keywords: ['talk to human', 'speak to human', 'real person', 'live agent', 'need someone', 'admin', 'support agent', 'urgent help', 'emergency', 'asap', 'refund', 'complaint', 'not satisfied', 'very unhappy', 'angry', 'wrong delivery', 'wrong order', 'invoice is wrong', 'payment issue', 'where is my order'],
      response: {
        content: `I understand — this needs a human response, not a canned answer. I've flagged it and the team sees your message in real time.\n\nPlease drop your order ID, email, or a short issue summary here so they can respond faster.`,
        suggestedActions: [
          { text: "Open Dashboard", url: "/dashboard" },
          { text: "Book a Call", url: "/book-meeting" }
        ]
      },
      priority: 100
    },

    // ─── ORDER INTENT ───
    {
      keywords: ['place order', 'new order', 'get a quote', 'start order', 'want to order', 'order now', 'create order', 'submit order', 'want to place'],
      response: {
        content: `Let's get your project started.\n\nHead to your [Dashboard](/dashboard) and click **+ New Project** — you'll upload images, pick services, and review before submitting.\n\nWant to browse options first? Check the [Services](/services) or [Pricing](/pricing) pages.`,
        suggestedActions: [
          { text: "Start New Project", url: "/dashboard?view=new-project" },
          { text: "Browse Services", url: "/services" },
          { text: "See Pricing", url: "/pricing" }
        ],
        startsOrderFlow: true
      },
      priority: 85
    },

    // ─── FREE TRIAL ───
    {
      keywords: ['free trial', 'free edit', 'try free', 'sample', 'demo', 'test edit', 'test you', 'try out', 'try you', 'no cost'],
      response: {
        content: `Try us out with **3 free edits** — no credit card, no commitment.\n\n1. Go to the [Free Trial page](/free-trial)\n2. Upload up to 3 images\n3. Get edits back within **24 hours**\n\nMost clients start here to see the quality firsthand.`,
        suggestedActions: [
          { text: "Start Free Trial", url: "/free-trial" },
          { text: "Browse Services", url: "/services" }
        ]
      },
      priority: 50
    },

    // ─── PILOT / TEST BATCH (paid review batch — distinct from the free trial) ───
    {
      keywords: ['pilot batch', 'test batch', 'paid trial', 'paid test', 'trial batch', 'review batch', 'larger sample'],
      response: {
        content: `Need to evaluate quality at scale? Our **Test Batch** is a paid review batch — submit up to **15 images** for service-specific review and complexity-based pricing confirmation. We send details within **30 minutes**.\n\nJust want to try us first? The [Free Trial](/free-trial) covers 3 images at no cost.`,
        suggestedActions: [
          { text: "Start Test Batch", url: "/pilot-batch" },
          { text: "Start Free Trial", url: "/free-trial" },
          { text: "View Pricing", url: "/pricing" }
        ]
      },
      priority: 55
    },

    // ─── TURNAROUND (Consolidated) ───
    {
      keywords: ['turnaround', 'how long', 'delivery', 'when ready', 'rush', 'urgent', 'deadline', 'quick', 'fast delivery', 'speed', 'timing'],
      response: {
        content: [
          "We offer five turnaround options to fit your production schedule:\n\n- ⚡ **12h Lightning** — For urgent deadlines\n- ⏰ **24h Standard** — Our most popular choice\n- 🌤️ **48h Relaxed** — More breathing room\n- 📅 **72h Economy** — Non-urgent batches\n- 📆 **7-day Saver** — Best rate for large volumes\n\nTimers start after you approve. See the full matrix on [Pricing](/pricing).",
          "Need it fast? We offer 12h and 24h rush options. Working on a budget? Our 7-day economy tier has the lowest rates. You can choose the speed for each project during checkout in the [Dashboard](/dashboard)."
        ],
        suggestedActions: [
          { text: "View Pricing & Speed", url: "/pricing" },
          { text: "Start a Project", url: "/dashboard?view=new-project" },
          { text: "Book a Call", url: "/book-meeting" }
        ]
      },
      priority: 45
    },

    // ─── REVISIONS ───
    {
      keywords: ['revision', 'redo', 'fix revision', 'request changes', 'not happy', 'wrong edit', 'correction'],
      excludeKeywords: ['ai hands', 'fix ai', 'midjourney', 'melted', 'artifact', 'invoice', 'order'],
      response: {
        content: `Every order includes **unlimited revisions** at no extra cost.\n\n1. Review edits with our side-by-side comparison tool\n2. Mark issues with annotation tools\n3. We'll resolve within your turnaround window\n\nCheck your [Dashboard](/dashboard) for order status.`,
        suggestedActions: [
          { text: "Go to Dashboard", url: "/dashboard" },
          { text: "Read FAQ", url: "/blog" }
        ]
      },
      priority: 50
    },

    // ─── FILE FORMATS ───
    {
      keywords: ['file format', 'file formats', 'upload file', 'upload images', 'send files', 'send images', 'attach files', 'jpg', 'png', 'psd', 'tiff', 'image size', 'file size'],
      response: {
        content: `We accept **JPG, PNG, TIFF, and PSD** — up to **50MB each**, max **100 images per order**.\n\nUpload via drag-and-drop in your [Dashboard](/dashboard). We also support Google Drive, Dropbox, and OneDrive.`,
        suggestedActions: [
          { text: "Start Upload", url: "/dashboard?view=new-project" },
          { text: "Read FAQ", url: "/blog" }
        ]
      },
      priority: 45
    },

    // ─── PAYMENT / BILLING ───
    {
      keywords: ['payment', 'pay', 'invoice', 'billing', 'credit card', 'checkout', 'money'],
      response: {
        content: `We use a **review-first** model — you inspect every edit before paying. No upfront charges.\n\nFor billing history, check [Billing & Invoices](/dashboard/billing). For enterprise pricing, [book a call](/book-meeting).`,
        suggestedActions: [
          { text: "View Billing", url: "/dashboard/billing" },
          { text: "View Pricing", url: "/pricing" },
          { text: "Book a Call", url: "/book-meeting" }
        ]
      },
      priority: 70
    },

    // ─── DASHBOARD / ORDERS ───
    {
      keywords: ['my order', 'order status', 'track order', 'check order', 'where is my', 'my project', 'dashboard', 'my jobs'],
      response: {
        content: `Track everything from your [Dashboard](/dashboard):\n\n- **Active Projects** — Currently being processed\n- **Order History** — Completed orders + downloads\n- **Billing** — Payment history and receipts`,
        suggestedActions: [
          { text: "Go to Dashboard", url: "/dashboard" },
          { text: "Order History", url: "/dashboard/orders" },
          { text: "Billing", url: "/dashboard/billing" }
        ]
      },
      priority: 80
    },


    // ─── E-COMMERCE OUTCOMES (MIND-READERS) ───
    {
      keywords: ['amazon compliant', 'amazon ready', 'shopify white', 'rgb 255', 'pure white for amazon', 'marketplace ready', 'fix amazon listing', 'e-commerce white', 'amazon standard'],
      excludeKeywords: ['video', 'animate', 'model'],
      response: {
        content: [
          "I know how frustrating it is when Amazon rejects a listing! We can ensure your images are 100% marketplace compliant with **Background Removal** and pure white backdrops (RGB 255).",
          "Getting ready for Amazon or other marketplaces? We've got you covered. Our team ensures every image meets strict marketplace standards—pure white backgrounds, correct padding, and zero artifacts.",
          "Amazon rejected your photos? We can save that listing. We specialize in marketplace-ready cutouts that pass compliance tests every time."
        ],
        suggestedActions: [
          { text: "View Background Removal", url: "/services/background-removal" },
          { text: "Start an Order", url: "/dashboard?view=new-project" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['tiktok', 'make a reel', 'make it move', 'turn photo into video', 'animate product', 'video ad', 'motion graphic', 'make it dynamic'],
      excludeKeywords: ['transparent', 'cutout', 'vector'],
      response: {
        content: "Want to stop the scroll on social media? Our **AI Video Generation** service can transform your static product photos into dynamic, engaging video content perfect for TikTok and Reels.",
        suggestedActions: [
          { text: "View AI Video Details", url: "/services/ai-video-generation" },
          { text: "Start Video Project", url: "/dashboard?view=new-project" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['put my logo on', 'add graphic to shirt', 'change the fabric', 'make it leather', 'plaid to solid', 'mockup my design', 'apply texture', 'swap print'],
      excludeKeywords: ['wrinkles', 'iron', 'dummy', 'mannequin'],
      response: {
        content: "We can perfectly map your designs onto any fabric! Our **Pattern Change** service wraps your graphics or textures onto products realistically, adjusting for folds and lighting.",
        suggestedActions: [
          { text: "View Pattern Change", url: "/services/pattern-change" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['six fingers', 'midjourney fix', 'ai hands', 'melted face', 'weird artifacts', 'ai messed up', 'fix ai generation', 'clean up midjourney', 'stable diffusion fix'],
      excludeKeywords: ['vector', 'logo', 'background removal'],
      response: {
        content: "AI is great, but it still makes mistakes! Our **AI Product Photography** workflow uses human experts to remove artifacts, fix unrealistic details, and make synthetic images look production-ready.",
        suggestedActions: [
          { text: "View AI Product Photography", url: "/services/ai-product-photography" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['cad', 'tech pack', 'make drawing real', 'render sketch', 'turn drawing into photo', 'concept art to photo', 'prototype render'],
      excludeKeywords: ['vectorize', 'trace logo'],
      response: {
        content: "Have a tech pack or concept drawing? Our **Sketch to Reality** service transforms flat sketches and CADs into photorealistic lifestyle images for pre-sales and investors.",
        suggestedActions: [
          { text: "View Sketch to Reality", url: "/services/sketch-to-reality" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['need an eps', 'svg format', 'make it high res', 'infinitely scalable', 'blurry logo', 'pixelated logo', 'make it bigger without losing quality', 'ready for print'],
      excludeKeywords: ['transparent png', 'jpg', 'photo'],
      response: {
        content: "Sounds like you need your image converted to a scalable format! Our **Raster to Vector** service hand-traces your pixelated logos into perfect, infinitely scalable SVG or EPS files.",
        suggestedActions: [
          { text: "View Raster to Vector", url: "/services/raster-to-vector" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['remove lint', 'iron the shirt', 'fix the collar', 'make it symmetrical', 'make it straight', 'fix the hem', 'smooth the fabric', 'steamer', 'wrinkle', 'wrinkles', 'wrinke', 'remove wrinkles', 'clothes retouch', 'fix clothing', 'apparel retouching', 'clothing edit', 'garment retouch'],
      excludeKeywords: ['hollow', 'mannequin', 'dummy'],
      response: {
        content: "We can save that shoot! Our **Garment Retouching** experts act as a digital steamer—removing wrinkles, fixing asymmetrical collars, and smoothing fabric so your apparel looks premium.",
        suggestedActions: [
          { text: "View Garment Retouch", url: "/services/garment-retouch" },
          { text: "Start Order", url: "/dashboard?view=new-project" }
        ]
      },
      priority: 1
    },
    // ─── SHADOWS & REFLECTIONS (REMOVAL - Consolidated) ───
    {
      keywords: ['remove reflection', 'fix glare', 'delete shadow', 'remove shadow', 'flash removal', 'too dark', 'lighten shadow', 'remove highlight', 'reflection on glass', 'glass reflection', 'sunglasses reflection', 'remove trash', 'blur background', 'remove dirt from floor', 'clean up the room'],
      excludeKeywords: ['add', 'create', 'drop shadow', 'white', 'transparent', 'remove bg', 'cutout'],
      response: {
        content: [
          "Reflections and harsh shadows can distract from your product. We specialize in removing studio glares, flash reflections (even on glass or jewelry), and softening heavy shadows to restore clarity.",
          "Need to clean up your background? We can remove distracting floor dirt, soften reflections on metallic surfaces, or add a professional blur to keep the focus on your product.",
          "I understand how tricky reflections can be! Our retouching team can wipe away glare and fix flash issues to make your items look flawless."
        ],
        suggestedActions: [
          { text: "View Retouching", url: "/services/retouching" },
          { text: "View Jewelry Retouch", url: "/services/jewelry-retouch" },
          { text: "Browse Services", url: "/services" }
        ]
      },
      priority: 60
    },

    // ─── SHADOWS & REFLECTIONS (CREATION) ───
    {
      keywords: ['add shadow', 'create reflection', 'drop shadow', 'make it float', 'floor shadow', 'mirror effect', 'natural shadow'],
      excludeKeywords: ['remove', 'delete', 'fix', 'erase', 'clean', 'too dark', 'glare'],
      response: {
        content: "Adding natural shadows or mirror reflections gives your products depth and a premium 'hero' look. We offer **Drop Shadows**, **Reflection Shadows**, and **Natural Floating Shadows** to match your brand style.",
        suggestedActions: [
          { text: "View Shadow Creation", url: "/services/shadow-creation" },
          { text: "Start a Project", url: "/dashboard?view=new-project" }
        ]
      },
      priority: 60
    },

    // ─── PRICING INQUIRIES ───
    {
      keywords: ['price', 'pricing', 'pricing bundles', 'how much', 'cost', 'rate', 'rates', 'fees', 'quote', 'see rates'],
      response: {
        content: [
          "Our pricing is transparent and volume-based. Basic edits start at **$0.39**, with premium retouching and creative work ranging up to **$4.99** depending on complexity and turnaround speed.",
          "We offer competitive, scale-based pricing. Whether you have 10 images or 10,000, we have a tier that fits. Check our full interactive matrix below."
        ],
        suggestedActions: [
          { text: "View Pricing Matrix", url: "/pricing" },
          { text: "Get Custom Quote", url: "/book-meeting" }
        ]
      },
      priority: 55
    },

    // ─── BULK & DISCOUNTS ───
    {
      keywords: ['bulk', 'volume', 'discount', 'wholesale', 'large order', 'many images', 'cheaper', 'price drop', 'scale'],
      response: {
        content: [
          "Processing high volumes? You're in the right place. We offer significant discounts for bulk orders (100+ images) and enterprise-level workflows. Head to the pricing page to see our volume tiers.",
          "The more you edit, the less you pay. Our 7-day 'Saver' turnaround combined with high volume can bring costs down significantly. Want a custom enterprise quote?",
          "I understand you're looking for scale! We handle thousands of images daily for major brands. Our pricing matrix automatically applies volume discounts as you add more images."
        ],
        suggestedActions: [
          { text: "View Volume Pricing", url: "/pricing" },
          { text: "Book Enterprise Call", url: "/book-meeting" },
          { text: "Start Bulk Project", url: "/dashboard?view=new-project" }
        ]
      },
      priority: 55
    },

    // ─── MEETINGS & CONSULTATION ───
    {
      keywords: ['book a call', 'schedule meeting', 'talk to team', 'book a meeting', 'consultation', 'talk to expert', 'speak with someone', 'zoom call', 'demo call'],
      response: {
        content: "Want to discuss a large project or custom workflow? You can book a 15-minute consultation with our production team. We'll walk you through our platform and find the best solution for your brand.",
        suggestedActions: [
          { text: "Book a Call", url: "/book-meeting" },
          { text: "View Enterprise FAQ", url: "/blog" }
        ]
      },
      priority: 80
    },

    // ─── SERVICE CATALOG ───
    {
      keywords: ['background removal', 'bg removal', 'remove bg', 'cut out', 'cutout', 'knock out', 'deep etch', 'transparent background', 'transparent bg', 'white background', 'isolate', 'clear background', 'erase background', 'delete background', 'delete bg', 'remove backdrop', 'clean background', 'transparent png', 'make transparent', 'remove the back', 'pure white background', 'amazon white', 'clipping background', 'strip bg', 'remove surroundings', 'extract object', 'no background', 'bg cutout', 'delete bkg', 'remove bkg', 'bkg removal', 'backdrop'],
      excludeKeywords: ['fix', 'clean up the', 'blur', 'lifestyle', 'generate', 'add scene'],
      response: {
        content: [
          "**Background Removal** starts at **$0.39/image**. We provide precision cutouts for e-commerce, including Amazon-ready white backgrounds or transparent PNGs.",
          "Need a clean cutout? Our background removal service provides hand-drawn precision for everything from simple objects to complex hair/fur. Starts at **$0.39**.",
          "We can isolate your products perfectly. Whether you need a pure white backdrop or a transparent layer for compositing, our background removal is pixel-perfect."
        ],
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/background-removal" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['clipping path', 'vector path', 'pen tool', 'trace', 'outline', 'silhouetting', 'draw a path', 'photoshop path', 'clip path', 'clipping paths', 'image clipping', 'photoshop pen tool', 'hand drawn path', 'vector tracing', 'clipping mask', 'outline image', 'extract path', 'cutout path', 'hard edge cutout', 'make a path'],
      excludeKeywords: ['ai hands', 'melted'],
      response: {
        content: `**Clipping Path** starts at **$0.39/image**.\n\nWe provide 100% hand-drawn vector paths using the Photoshop Pen Tool for perfectly sharp edges and print-ready quality.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/clipping-path)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/clipping-path" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['multi-clipping', 'multi clipping', 'color path', 'multiple paths', 'separate parts', 'isolate parts', 'component masking', 'multi-path', 'multipath', 'separate layers', 'isolate colors', 'mask different parts', 'split into layers', 'component isolation', 'multi-masking', 'part separation', 'color separation paths', 'break into parts', 'path per color'],
      response: {
        content: `**Multi-Clipping Path** starts at **$0.90/image**.\n\nComplex paths for products with multiple parts or colors. Perfect for isolating individual components for color-swapping later.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/multi-clipping-path)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/multi-clipping-path" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['color correction', 'fix color', 'color match', 'white balance', 'color balance', 'adjust lighting', 'fix exposure', 'color grading', 'tone adjustment', 'colour correction', 'fix colour', 'colour match', 'adjust colors', 'make colors accurate', 'true to life colors', 'fix the lighting', 'brighten image', 'fix contrast', 'color cast removal', 'tint removal', 'match physical product', 'make it brighter', 'fix dark photo', 'looks too yellow'],
      excludeKeywords: ['change to', 'swap', 'make it red', 'variant', 'recolor'],
      response: {
        content: `**Color Correction** starts at **$0.35/image**.\n\nWe ensure your product colors are true-to-life and consistent across your entire catalog, adjusting white balance, exposure, and tone.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/color-correction)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/color-correction" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['color change', 'recolor', 're-color', 'color swap', 'change color', 'hue shift', 'color variant', 'match pantone', 'colour change', 'recolour', 'change the colour', 'make it blue', 'make it red', 'make it black', 'hex code match', 'color variations', 'product variants', 'dye color', 'paint color', 'color replacement', 'swap colours'],
      excludeKeywords: ['white balance', 'exposure', 'lighting', 'too dark'],
      response: {
        content: `**Color Change** starts at **$0.30/image**.\n\nSave on photography costs by shooting one item and having us swap the colors to match your entire product line (Pantone/HEX matching available).\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/color-change)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/color-change" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['shadow creation', 'drop shadow', 'add shadow', 'create reflection', 'cast shadow', 'natural shadow', 'reflection', 'mirror effect', 'grounding', 'make a shadow', 'floor shadow', 'bottom shadow', 'product shadow', 'add reflection', 'glass reflection', 'shiny floor effect', 'fake shadow', 'realistic shadow', 'contact shadow', 'floating shadow', 'reflection shadow', 'make it float'],
      excludeKeywords: ['remove', 'delete', 'fix', 'erase', 'clean', 'too dark', 'glare'],
      response: {
        content: `**Shadow Creation** starts at **$0.35/image**.\n\nAdd natural depth with drop shadows, reflection shadows, or original shadow retention to give your products a premium, high-end feel.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/shadow-creation)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/shadow-creation" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['pattern change', 'texture swap', 'change print', 'fabric swap', 'material change', 'add pattern', 'surface wrap', 'apply pattern', 'change the texture', 'put logo on', 'wrap texture', 'displacement map', 'change the print', 'fabric pattern', 'material swap', 'apparel print change', 'swap design', 'mockup design', 'different texture', 'add logo to shirt'],
      excludeKeywords: ['wrinkles', 'iron', 'smooth'],
      response: {
        content: `**Pattern Change** starts at **$1.25/image**.\n\nWe use advanced displacement mapping to swap fabric patterns and textures while maintaining natural folds and lighting.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/pattern-change)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/pattern-change" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['retouch', 'retouching', 'photo cleanup', 'clean up', 'fix imperfections', 'spot removal', 'blemish removal', 'polish photo', 'high-end edit', 'touch up', 'touchup', 'clean the photo', 'remove dust', 'remove scratches', 'photoshop cleanup', 'make it look perfect', 'professional edit', 'high end retouch', 'clean edges', 'frequency separation', 'fix photo', 'clean image'],
      response: {
        content: `**Retouching** starts at **$0.55/image**.\n\nFrom basic dust/scratch removal to high-end frequency separation, we polish your images until they are hero-shot ready.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/retouching)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/retouching" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['jewelry retouch', 'metal polishing', 'make it sparkle', 'fix reflections', 'gemstone', 'diamond edit', 'watch retouch', 'shine enhancement', 'jewellery retouch', 'ring retouch', 'necklace edit', 'clean up metal', 'make jewelry pop', 'remove glare from metal', 'polish silver', 'polish gold', 'focus stack ring', 'gemstone color', 'diamond sparkle', 'earring edit'],
      response: {
        content: `**Jewelry Retouching** starts at **$0.80/image**.\n\nSpecialized editing for high-reflectivity items. We polish metals, enhance gemstone brilliance, and handle focus stacking for perfect clarity.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/jewelry-retouch)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/jewelry-retouch" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['garment retouch', 'wrinkle removal', 'iron clothes', 'apparel edit', 'fabric smoothing', 'fix fit', 'remove lint', 'clothing shape', 'clothes retouch', 'apparel retouching', 'fix wrinkles', 'remove creases', 'smooth fabric', 'fix shirt shape', 'straighten collar', 'remove tags', 'lint removal', 'fix clothing symmetry', 'tailor fit', 'fix fold', 'unwrinkle', 'shape clothing'],
      excludeKeywords: ['mannequin', 'dummy', 'hollow', 'change pattern', 'swap texture'],
      response: {
        content: `**Garment Retouching** starts at **$0.55/image**.\n\nWe "iron" your clothes digitally, removing wrinkles, lint, and pins while perfecting the shape and symmetry of every garment.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/garment-retouch)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/garment-retouch" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['model retouch', 'skin smoothing', 'beauty edit', 'fix skin', 'stray hair', 'body shaping', 'portrait edit', 'remove acne', 'fix model', 'smooth skin', 'remove blemishes', 'flyaway hair', 'flyaways', 'fix messy hair', 'teeth whitening', 'eye brightening', 'liquify body', 'fix posture', 'editorial retouch', 'fashion model edit', 'face retouch', 'body contour', 'liquify'],
      excludeKeywords: ['remove person', 'take him out', 'erase the guy'],
      response: {
        content: `**Model Retouching** starts at **$1.20/image**.\n\nProfessional beauty retouching including skin smoothing (maintaining texture), flyaway hair removal, and subtle body shaping via liquify.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/model-retouch)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/model-retouch" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['ghost mannequin', 'invisible mannequin', 'neck joint', 'remove dummy', 'hollow effect', '3d clothing', 'apparel composite', 'invisible dummy', 'remove the mannequin', 'neck splice', 'combine front and back', 'hollow man', '3d apparel', 'floating shirt', 'mannequin cutout', 'neck insertion', 'dummy removal'],
      excludeKeywords: ['real model', 'wrinkles', 'iron'],
      response: {
        content: `**Ghost Mannequin** starts at **$0.85/image**.\n\nWe combine multiple shots to create a "hollow" 3D effect for your apparel, removing the mannequin and adding natural neck joints.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/ghost-mannequin)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/ghost-mannequin" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['manipulation', 'compositing', 'combine photos', 'add object', 'remove object', 'photomanipulation', 'photoshop manipulation', 'remove person', 'add person', 'change background scene', 'put product in lifestyle', 'photo composite', 'photoshop me into', 'take him out', 'erase the guy', 'photobomber', 'remove tourist'],
      excludeKeywords: ['skin', 'acne', 'teeth', 'hair'],
      response: {
        content: `**Image Manipulation** starts at **$3.99/image**.\n\nComplex compositing, object removal/addition, and creative scene changes. We turn your concepts into high-fidelity visual reality.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/manipulation)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/manipulation" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['raster to vector', 'vectorize', 'convert to vector', 'trace logo', 'make it scalable', 'svg conversion', 'redraw logo', 'vectorise', 'make vector', 'convert to ai', 'convert to eps', 'recreate logo', 'fix pixelated logo', 'high res logo', 'manual tracing', 'vector redraw', 'png to vector', 'jpg to vector', 'ai file', 'eps'],
      excludeKeywords: ['photo', 'blurry face', 'upscale photo', 'ai hands'],
      response: {
        content: `**Raster to Vector** starts at **$4.99/image**.\n\nManual vectorization of logos and illustrations into scalable AI, EPS, or SVG formats. Perfect for large-scale printing.\n\n[Start Order](/dashboard?view=new-project) | [View Examples](/services/raster-to-vector)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/raster-to-vector" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['ai fixing', 'fix ai', 'artifact removal', 'ai backgrounds', 'generate scene', 'virtual staging', 'animate photo', 'image to video', 'ai video', 'midjourney', 'fix ai hands', 'fix midjourney', 'clean up ai', 'generate background', 'ai lifestyle', 'ai product photo', 'make it a video', 'animate image', 'ai video maker', 'ai render', 'sketch to reality', 'sketch to image', 'render from sketch', 'turn drawing into photo', 'ai fix', 'fix blurry', 'remove artifacts', 'melted fingers', 'weird ai', 'upscale photo'],
      excludeKeywords: ['vector', 'svg', 'logo', 'trace'],
      response: {
        content: `**AI-Driven Services** start at **$0.55/image**.\n\nFrom fixing AI artifacts and "Midjourney hands" to generating photorealistic product photography from sketches or text prompts.\n\n[Start Order](/dashboard?view=new-project) | [View AI Catalog](/services)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "Browse AI Services", url: "/services" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['fix background', 'clean background', 'remove trash', 'blur background', 'remove dirt from floor', 'clean up the room'],
      excludeKeywords: ['white', 'transparent', 'remove bg', 'cutout'],
      response: {
        content: `**Background Retouching** starts at **$0.55/image**.\n\nInstead of removing the background, we clean up distracting elements, remove dirt/scratches from the floor, or add a professional blur to keep the focus on your product.\n\n[Start Order](/dashboard?view=new-project) | [View Retouching](/services/retouching)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/retouching" }
        ]
      },
      priority: 60
    },
    {
      keywords: ['lifestyle background', 'generate scene', 'put on a table', 'ai background', 'virtual staging'],
      excludeKeywords: ['transparent', 'white background', 'remove', 'clean'],
      response: {
        content: `**AI Lifestyle Photography** starts at **$0.99/image**.\n\nWe place your product in a photorealistic "lifestyle" scene—like a kitchen counter or a modern living room—without the need for an expensive studio shoot.\n\n[Start Order](/dashboard?view=new-project) | [View AI Services](/services)`,
        suggestedActions: [
          { text: "Start Order", url: "/dashboard?view=new-project" },
          { text: "View Details", url: "/services/ai-product-photography" }
        ]
      },
      priority: 60
    },
    // Removed redundant Shadow/Reflection Removal rule (consolidated above)

    // ─── FAQ / HOW IT WORKS ───
    {
      keywords: ['faq', 'how does it work', 'how do you work', 'process', 'workflow', 'how it works'],
      response: {
        content: `How it works:\n\n1. **Upload** images via [Dashboard](/dashboard)\n2. **Select** services and turnaround speed\n3. **Review** edits with our comparison tool\n4. **Approve & Pay** — only after you're satisfied\n\nMore details on our [FAQ page](/blog).`,
        suggestedActions: [
          { text: "Read FAQ", url: "/blog" },
          { text: "Start a Project", url: "/dashboard?view=new-project" },
          { text: "View Pricing", url: "/pricing" }
        ]
      },
      priority: 35
    },

    // ─── QUALITY / WHY US ───
    {
      keywords: ['quality', 'why you', 'why reframe', 'compared to', 'vs', 'difference', 'competitor'],
      response: {
        content: `What sets us apart:\n\n- **Human editors** — Not automated AI\n- **Review-first** — Approve before paying\n- **Unlimited revisions** on every order\n- **Secure handling** — Files encrypted, never shared\n- **Flexible speed** — 12h rush to 7-day economy\n\nSee for yourself: [start a free trial](/free-trial).`,
        suggestedActions: [
          { text: "Start Free Trial", url: "/free-trial" },
          { text: "About Us", url: "/about" },
          { text: "View Pricing", url: "/pricing" }
        ]
      },
      priority: 35
    },

    // ─── SECURITY ───
    {
      keywords: ['security', 'safe', 'secure', 'privacy', 'confidential', 'nda', 'encrypted'],
      response: {
        content: `Your files are protected:\n\n- **Encrypted** in transit and at rest\n- Files **never shared** with third parties\n- Access limited to the editors on your project\n\nNeed an NDA? [Book a call](/book-meeting). More on [Blog](/blog).`,
        suggestedActions: [
          { text: "Read FAQ", url: "/blog" },
          { text: "Book a Call", url: "/book-meeting" }
        ]
      },
      priority: 70
    },

    // ─── ABOUT ───
    {
      keywords: ['about', 'who are you', 'company', 'reframe', 'your team', 'who is'],
      response: {
        content: `Reframe Visuals is a professional image editing studio for brands, photographers, and e-commerce teams.\n\nTransparent pricing, human editors, quality-first delivery. Learn more on our [About page](/about) or [book a walkthrough](/book-meeting).`,
        suggestedActions: [
          { text: "About Us", url: "/about" },
          { text: "Browse Services", url: "/services" },
          { text: "Book a Walkthrough", url: "/book-meeting" }
        ]
      },
      priority: 25
    },

    // ─── CONTACT / HUMAN ───
    {
      keywords: ['contact', 'email', 'phone', 'talk to human', 'speak to', 'speak with', 'reach the team', 'live chat', 'agent', 'human'],
      response: {
        content: `I can connect you with our team:\n\n- **Schedule a call** → [Book a meeting](/book-meeting)\n- **Email** → hello@reframevisuals.com\n\nOr describe your question and I'll help right here.`,
        suggestedActions: [
          { text: "Book a Meeting", url: "/book-meeting" },
          { text: "Go to Dashboard", url: "/dashboard" }
        ]
      },
      priority: 90
    },

    // ─── ACCOUNT SECURITY ───
    {
      keywords: ['forgot password', 'reset password', 'change password', 'recover account', 'lost password', 'reset my password'],
      response: {
        content: `No problem, it happens. You can request a secure deployment token to reset your password on our [Account Recovery page](/forgot-password).\n\nIf you're still having trouble, [book a quick call](/book-meeting) and our team will verify your identity manually.`,
        suggestedActions: [
          { text: "Reset Password", url: "/forgot-password" },
          { text: "Log In", url: "/login" },
          { text: "Talk to Human", url: "/book-meeting" }
        ]
      },
      priority: 85
    },

    // ─── ACCOUNT ───
    {
      keywords: ['account', 'sign up', 'register', 'create account', 'login', 'log in', 'sign in', 'my orders', 'order history', 'track order', 'where is my', 'previous orders'],
      response: {
        content: `Already have an account? [Log in here](/login).\n\nNew here? [Create an account](/signup) in 30 seconds — access your dashboard, track orders, and manage projects. We require a valid work email to link your account to our CRM for better support.`,
        suggestedActions: [
          { text: "Log In", url: "/login" },
          { text: "Create Account", url: "/signup" },
          { text: "Start Free Trial", url: "/free-trial" }
        ]
      },
      priority: 75
    },

    // ─── INTEGRATIONS ───
    {
      keywords: ['integration', 'google drive', 'dropbox', 'onedrive', 'api', 'zapier', 'connect'],
      response: {
        content: `We support Google Drive, Dropbox, OneDrive, and direct drag-and-drop in your [Dashboard](/dashboard).\n\nAmazon and Zapier integrations coming soon. For API access, [book a call](/book-meeting).`,
        suggestedActions: [
          { text: "Go to Dashboard", url: "/dashboard" },
          { text: "Book a Call", url: "/book-meeting" }
        ]
      },
      priority: 45
    },

    // ─── GREETINGS ───
    {
      keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'whats up'],
      response: {
        content: [
          "Hey there! 👋 Welcome to Reframe Visuals. I'm the studio assistant—how can I help you with your project today?",
          "Hi! Thanks for stopping by. I can help with pricing, services, or getting a new project started. What's on your mind?",
          "Hello! I'm here to make your image editing workflow as smooth as possible. Need a hand with anything specific?"
        ],
        suggestedActions: [
          { text: "Browse Services", url: "/services" },
          { text: "View Pricing", url: "/pricing" },
          { text: "Start Free Trial", url: "/free-trial" }
        ]
      },
      priority: 10
    },

    // ─── HELP & SERVICE LIST ───
    {
      keywords: ['help', 'what can you do', 'assist', 'need help', 'options', 'list services', 'what services', 'our services', 'service catalog'],
      response: {
        content: [
          "I can help with a wide range of services including **Background Removal**, **Ghost Mannequin**, **Jewelry Retouching**, and even **AI Video Generation**. What type of project are you working on?",
          "We're a full-service post-production studio. Here's a quick list of what I can assist with:\n\n- E-commerce (Backgrounds, Retouching)\n- Apparel (Ghost Mannequin, Garment Fixes)\n- Creative (Compositing, AI Generation)\n- Technical (Vector Tracing, Color Correction)",
          "Need a hand? I can guide you through our service catalog, explain our 12h-7day turnaround options, or help you start a new project right now."
        ],
        suggestedActions: [
          { text: "Browse Services", url: "/services" },
          { text: "View Pricing", url: "/pricing" },
          { text: "Start Free Trial", url: "/free-trial" }
        ]
      },
      priority: 25
    },

    // ─── THANKS ───
    {
      keywords: ['thank', 'thanks', 'thx', 'appreciate', 'helpful'],
      response: {
        content: `Glad I could help! If you need anything else — pricing, order help, or questions — I'm here. Good luck with your project 🎯`,
        suggestedActions: [
          { text: "Start a Project", url: "/dashboard?view=new-project" },
          { text: "Browse Services", url: "/services" }
        ]
      },
      priority: 10
    },
  ];

  rules.sort((a, b) => (b.priority || 50) - (a.priority || 50));
  for (const rule of rules) {
    if (match(msg, rule.keywords, rule.excludeKeywords)) {
      let content = pick(rule.response.content);
      
      // ─── POLITE GUEST HOOKS ───
      // If user is a guest, we silently and politely offer to capture their email
      // so they don't lose their session or to send them value-add info.
      if (isGuest) {
        // Match against keyword substrings — rule keywords are multi-word phrases
        // ("background removal", "how long"), so exact-string comparison never fired.
        const ruleHas = (re: RegExp) => rule.keywords.some(k => re.test(k));
        const isPricing = ruleHas(/price|pricing|quote|cost|rate/);
        const isTurnaround = ruleHas(/turnaround|how long|delivery/);
        const isServices = ruleHas(/background|retouch|mannequin|clipping|shadow|jewel|garment|vector|pattern/);
        const isGreeting = rule.keywords.includes('hello') || rule.keywords.includes('hi');

        if (isPricing) {
          content += "\n\nWould you like me to email our full pricing matrix to you? It's often easier to review with your team that way.";
        } else if (isTurnaround) {
          content += "\n\nI can send our production schedule to your email if you'd like to save these timelines for your records.";
        } else if (isServices) {
          content += "\n\nShould I email a few high-res samples of this service to you? It's the best way to see our quality up close.";
        } else if (isGreeting) {
          content += "\n\n(Tip: To make sure you don't lose this chat history if you close your tab, feel free to drop your email—I'll link this session for you.)";
        }
      }

      return {
        ...rule.response,
        content
      };
    }
  }
  return null;
};

export const getGenericFallbackResponse = (): LocalResponse => ({
  content: `Could you tell me a bit more? For example:\n\n- **Pricing** → [View rates](/pricing)\n- **Services** → [Browse catalog](/services)\n- **Start a project** → [New Project](/dashboard?view=new-project)\n- **Talk to team** → [Book a call](/book-meeting)`,
  suggestedActions: [
    { text: "Browse Services", url: "/services" },
    { text: "View Pricing", url: "/pricing" },
    { text: "Book a Call", url: "/book-meeting" }
  ]
});
