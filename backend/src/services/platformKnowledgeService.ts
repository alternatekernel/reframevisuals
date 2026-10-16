import { prisma } from '../database';
import { isExcludedService } from '../controllers/sectionController';

interface CachedKnowledge {
  context: string;
  timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
let knowledgeCache: Record<string, CachedKnowledge> = {};

const safeJsonParse = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error: any) {
    console.warn('[PlatformKnowledge] Failed to parse JSON:', error.message);
    return fallback;
  }
};

const getNumericPrice = (value: unknown): number | null => {
  const price = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(price) ? price : null;
};

export const getPlatformKnowledge = async (isGuest: boolean, tenantId: string) => {
  const cacheKey = `${tenantId}_${isGuest ? 'guest' : 'member'}`;
  const now = Date.now();

  if (knowledgeCache[cacheKey] && (now - knowledgeCache[cacheKey].timestamp) < CACHE_TTL) {
    return knowledgeCache[cacheKey].context;
  }

  const [pricingTiers, webServices, dbServices, policies] = await Promise.all([
    prisma.pricingTier.findMany({ where: { tierType: 'customer' } }).catch(() => []),
    prisma.section.findFirst({ where: { sectionId: 'services' } }).catch(() => null),
    prisma.service.findMany().catch(() => []),
    prisma.platformPolicy.findMany().catch(() => [])
  ]);

  const servicesData = webServices ? safeJsonParse<any>(webServices.content, null) : null;

  const policyData: Record<string, any> = {};
  for (const policy of policies) {
    policyData[policy.key] = safeJsonParse(policy.content, policy.content);
  }

  // Build prices from DB source of truth (services section)
  let startingPrices: Record<string, number> = {};
  if (servicesData?.items && Array.isArray(servicesData.items)) {
    for (const svc of servicesData.items) {
      if (isExcludedService(svc)) continue;
      const price = getNumericPrice(svc.price ?? svc.basePrice ?? svc.startingPrice);
      if (svc.name && price !== null) {
        startingPrices[svc.name] = price;
      }
    }
  }

  // Secondary DB source if the website services section is missing or malformed.
  if (Object.keys(startingPrices).length === 0 && dbServices.length > 0) {
    for (const svc of dbServices) {
      if (isExcludedService(svc)) continue;
      startingPrices[svc.name] = svc.basePrice;
    }
  }

  // Fallback only if DB has no services at all
  if (Object.keys(startingPrices).length === 0) {
    startingPrices = {
      'Background Removal': 0.39,
      'Clipping Path': 0.39,
      'Multi-Clipping Path': 0.90,
      'Color Correction': 0.35,
      'Color Change': 0.30,
      'Pattern Change': 1.25,
      'Shadow Creation': 0.35,
      'Manipulation': 3.99,
      'Advanced Retouching': 0.55,
      'Jewelry Retouch': 0.80,
      'Garment Retouch': 0.55,
      'Model Retouch': 1.20,
      'Ghost Mannequin': 0.85,
    };
  }

  // Build service categories from DB data
  const serviceNames = Object.keys(startingPrices);
  const categorize = (names: string[]) => serviceNames.filter(n => names.some(k => n.toLowerCase().includes(k)));

  const serviceKnowledge: Record<string, { desc: string; items: string[] }> = {
    'Foundation': {
      desc: 'Marketplace-ready backgrounds and precision vector paths.',
      items: categorize(['background', 'clipping', 'color correction', 'color change'])
    },
    'Enhancement': {
      desc: 'Color accuracy, vibrancy, and natural shadow effects.',
      items: categorize(['shadow', 'manipulation', 'pattern'])
    },
    'Retouch': {
      desc: 'Model, product, and architectural cleanup for hero-quality assets.',
      items: categorize(['retouch', 'retouching', 'jewelry', 'jewellery', 'garment', 'model'])
    },
    'Advanced': {
      desc: 'Specialized workflows and complex compositing.',
      items: categorize(['ghost', 'mannequin', 'multi', 'clipping', 'manipulation'])
    }
  };

  const pricingSummary = pricingTiers.length > 0
    ? pricingTiers
      .slice(0, 8)
      .map(tier => {
        const config = safeJsonParse<Record<string, any>>(tier.pricingConfig, {});
        const volume = tier.minVolume || tier.maxVolume
          ? ` volume ${tier.minVolume ?? 0}-${tier.maxVolume ?? '∞'}`
          : '';
        const discount = config.discountPercent ?? config.discount ?? config.volumeDiscount;
        return `- ${tier.tierName}${volume}${discount ? `, discount ${discount}` : ''}`;
      })
      .join('\n')
    : '- Public pricing is service-based with volume and turnaround modifiers.';

  const policySummary = Object.keys(policyData).length > 0
    ? Object.entries(policyData)
      .slice(0, 8)
      .map(([key, value]) => `- ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
      .join('\n')
    : '- Use standard file, revision, turnaround, payment, and security policies below.';

  const faqData = `
FILE TYPES: JPG, PNG, TIFF, PSD, PDF (max 50MB per file).
REVISIONS: Unlimited revisions included with every order at no extra cost, within the delivery window.
TURNAROUND: 12h Lightning Rush, 24h Standard, 48h Relaxed, 72h Economy, 7-day Saver.
PAYMENT: Review-first workflow. Inspect your edits before final payment.
`;

  // Build a highly structured context string
  const catalogStr = Object.entries(serviceKnowledge).map(([cat, info]) => {
    const itemList = info.items.map(name => `- ${name} ($${startingPrices[name].toFixed(2)}+)`).join('\n');
    return `### ${cat.toUpperCase()}\n${info.desc}\n${itemList}`;
  }).join('\n\n');

  const context = `
[SYSTEM CONTEXT]
USER STATUS: ${isGuest ? 'GUEST' : 'MEMBER'}

[SERVICE CATALOG - PRODUCTION NAMING]
${catalogStr}

[PRICING TIERS]
${pricingSummary}

[PLATFORM POLICIES FROM CMS]
${policySummary}

[OPERATIONAL PROTOCOLS]
${faqData}

[INDUSTRY CONFLICT RESOLUTION]
- SHADOWS: If "Add/Create/Natural" -> Shadow Creation. If "Remove/Fix Glare/Delete" -> Advanced Retouching.
- BACKGROUNDS: If "Transparent/White/Cutout" -> Background Removal. If "Blur/Clean/Fix" -> Background Retouching (part of Advanced Retouching).
- COLOR: If "Match/Fix/Accuracy" -> Color Correction. If "Swap/Change/Variants" -> Color Change.
- APPAREL: For "3D/Hollow" -> Ghost Mannequin. For "Wrinkles/Symmetry" -> Garment Retouch. For "Change Fabric/Print" -> Pattern Change.

[E-COMMERCE OUTCOME MAPPING]
- Amazon/Marketplace Compliance (RGB 255) -> Background Removal.
- Logo/Graphic Mapping (Mockups) -> Pattern Change.
- Digital Steamer/Wrinkle Removal -> Garment Retouching.
`;

  knowledgeCache[cacheKey] = {
    context: context.trim(),
    timestamp: now
  };

  return knowledgeCache[cacheKey].context;
};

export const clearKnowledgeCache = () => {
  knowledgeCache = {};
};
