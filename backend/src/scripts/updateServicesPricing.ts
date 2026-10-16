import { prisma } from '../database';

const pricingMatrix = {
  'background-removal': {
    tiers: [
      { complexity: 'S', time: '3-5 min', prices: { '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 } },
      { complexity: 'M', time: '5-12 min', prices: { '12h': 1.01, '24h': 0.78, '48h': 0.70, '72h': 0.66, '7d': 0.62 } },
      { complexity: 'A', time: '12-25 min', prices: { '12h': 1.62, '24h': 1.25, '48h': 1.12, '72h': 1.06, '7d': 1.00 } },
      { complexity: 'C', time: '25min-1h 20m', prices: { '12h': 3.24, '24h': 2.50, '48h': 2.25, '72h': 2.12, '7d': 2.00 } },
    ]
  },
  'clipping-path': {
    tiers: [
      { complexity: 'S', time: '5-7 min', prices: { '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 } },
      { complexity: 'M', time: '8-15 min', prices: { '12h': 0.66, '24h': 0.51, '48h': 0.46, '72h': 0.43, '7d': 0.41 } },
      { complexity: 'A', time: '15-45 min', prices: { '12h': 1.22, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 } },
      { complexity: 'C', time: '45min-1h 20m', prices: { '12h': 1.71, '24h': 1.90, '48h': 1.71, '72h': 1.62, '7d': 1.52 } },
      { complexity: 'SC', time: '1h 20m-2h', prices: { '12h': 3.84, '24h': 2.99, '48h': 2.69, '72h': 2.54, '7d': 2.39 } },
    ]
  },
  'multi-clipping-path': {
    tiers: [
      { complexity: 'S', time: '8-12 min', prices: { '12h': 1.17, '24h': 0.90, '48h': 0.81, '72h': 0.77, '7d': 0.72 } },
      { complexity: 'M', time: '12-25 min', prices: { '12h': 2.16, '24h': 1.67, '48h': 1.50, '72h': 1.42, '7d': 1.33 } },
      { complexity: 'A', time: '25-45 min', prices: { '12h': 2.93, '24h': 2.25, '48h': 2.03, '72h': 1.91, '7d': 1.80 } },
      { complexity: 'C', time: '45min-1h 30m', prices: { '12h': 4.98, '24h': 3.83, '48h': 3.45, '72h': 3.26, '7d': 3.06 } },
      { complexity: 'SC', time: '1h 30m-2h 30m', prices: { '12h': 6.73, '24h': 5.18, '48h': 4.66, '72h': 4.40, '7d': 4.14 } },
    ]
  },
  'color-correction': {
    tiers: [
      { complexity: 'Single', time: '5-8 min', prices: { '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 } },
      { complexity: 'Multiple', time: '8-15 min', prices: { '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 } },
    ]
  },
  'color-change': {
    tiers: [
      { complexity: 'Single', time: '5-8 min', prices: { '12h': 0.39, '24h': 0.30, '48h': 0.27, '72h': 0.26, '7d': 0.24 } },
      { complexity: 'Multiple', time: '8-15 min', prices: { '12h': 0.91, '24h': 0.70, '48h': 0.63, '72h': 0.60, '7d': 0.56 } },
    ]
  },
  'shadow-creation': {
    tiers: [
      { complexity: 'S', time: '3-5 min', prices: { '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 } },
      { complexity: 'M', time: '5-10 min', prices: { '12h': 0.77, '24h': 0.59, '48h': 0.53, '72h': 0.50, '7d': 0.47 } },
      { complexity: 'C', time: '10-20 min', prices: { '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 } },
    ]
  },

  'manipulation': {
    tiers: [
      { complexity: 'S', time: '30min-1h', prices: { '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 } },
      { complexity: 'C', time: '1h-2h 30m', prices: { '12h': 11.69, '24h': 8.99, '48h': 8.09, '72h': 7.64, '7d': 7.19 } },
    ]
  },
  'pattern-change': {
    tiers: [
      { complexity: 'Single', time: '20-30 min', prices: { '12h': 1.63, '24h': 1.25, '48h': 1.13, '72h': 1.06, '7d': 1.00 } },
      { complexity: 'Multiple', time: '50-1h 30m', prices: { '12h': 3.64, '24h': 2.80, '48h': 2.52, '72h': 2.38, '7d': 2.24 } },
    ]
  },
  'retouching': {
    tiers: [
      { complexity: 'Basic', time: '6-10 min', prices: { '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 } },
      { complexity: 'Advanced', time: '10-25 min', prices: { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 } },
      { complexity: 'High-end/Editorial', time: '25min-1h 20m', prices: { '12h': 5.20, '24h': 4.00, '48h': 3.60, '72h': 3.40, '7d': 3.20 } },
    ]
  },
  'jewelry-retouch': {
    tiers: [
      { complexity: 'Basic', time: '6-10 min', prices: { '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 } },
      { complexity: 'Advanced', time: '10-25 min', prices: { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 } },
      { complexity: 'High-end/Editorial', time: '25min-1h 20m', prices: { '12h': 6.50, '24h': 5.00, '48h': 4.50, '72h': 4.25, '7d': 4.00 } },
    ]
  },
  'garment-retouch': {
    tiers: [
      { complexity: 'S', time: '5-7 min', prices: { '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 } },
      { complexity: 'M', time: '7-15 min', prices: { '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 } },
      { complexity: 'C', time: '15-30 min', prices: { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 } },
    ]
  },
  'model-retouch': {
    tiers: [
      { complexity: 'S', time: '5-7 min', prices: { '12h': 1.56, '24h': 1.20, '48h': 1.08, '72h': 1.02, '7d': 0.96 } },
      { complexity: 'M', time: '7-30 min', prices: { '12h': 2.86, '24h': 2.20, '48h': 1.98, '72h': 1.87, '7d': 1.76 } },
      { complexity: 'C', time: '30min-1h', prices: { '12h': 4.67, '24h': 3.59, '48h': 3.23, '72h': 3.05, '7d': 2.87 } },
    ]
  },
  'ghost-mannequin': {
    tiers: [
      { complexity: 'S', time: '10-20 min', prices: { '12h': 1.11, '24h': 0.85, '48h': 0.77, '72h': 0.72, '7d': 0.68 } },
      { complexity: 'M', time: '20-40 min', prices: { '12h': 2.46, '24h': 1.89, '48h': 1.70, '72h': 1.61, '7d': 1.51 } },
      { complexity: 'C', time: '40min-1h 20m', prices: { '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 } },
    ]
  }
};

const EXCLUDED_IDS = new Set([
  'raster-to-vector',
  'raster-vector',
  'ai-product-photography',
  'ai-product-photo',
  'ai-video-generation',
  'ai-video-gen',
  'sketch-to-reality',
  'sketch-to-image',
  'sketch-reality',
  'ai-generated-image-refinement',
  'ai-refinement',
  'ai-editing-fixing',
]);

async function updateServicesPricing() {
  const section = await prisma.section.findFirst({
    where: { sectionId: 'services' }
  });
  
  if (!section) {
    console.log('Services section not found');
    return;
  }
  
  const currentContent = JSON.parse(section.content);
  
  // Filter out retired services and update each remaining service with pricing tiers
  const remainingItems = (currentContent.items || []).filter((item: any) => !EXCLUDED_IDS.has(item.id));
  const updatedItems = remainingItems.map((item: any) => {
    const pricing = pricingMatrix[item.id];
    if (pricing) {
      return {
        ...item,
        price: pricing.tiers[0].prices['24h'], // Keep simple price for backward compatibility
        startingPrice: pricing.tiers[0].prices['24h'],
        tiers: pricing.tiers.map(t => ({
          complexity: t.complexity,
          processingTime: t.time,
          prices: t.prices
        }))
      };
    }
    return item;
  });
  
  await prisma.section.update({
    where: { id: section.id },
    data: { content: JSON.stringify({ items: updatedItems }) }
  });
  
  console.log('Services pricing updated with full pricing matrix');
}

updateServicesPricing()
  .catch(console.error)
  .finally(() => prisma.$disconnect());