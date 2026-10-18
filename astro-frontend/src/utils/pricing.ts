import { PRICING_MATRIX } from '../data/pricingMatrix';
import { useServicesContext } from '../context/ServicesContext';

/**
 * Calculates the absolute lowest starting price for a service.
 * Priority: DB data → PRICING_MATRIX → fallbackPrice
 */
export const getStartingPrice = (serviceId: string, fallbackPrice?: number): number => {
  // Try to get from services context (DB-first)
  try {
    const context = useServicesContext();
    const dbPrice = context.getStartingPrice(serviceId);
    if (dbPrice > 0) return dbPrice;
  } catch {
    // Context not available, continue to fallback
  }
  
  // Fallback to hardcoded PRICING_MATRIX
  const servicePricing = PRICING_MATRIX.find(p => p.id === serviceId);
  
  if (!servicePricing) {
    return fallbackPrice || 0;
  }

  // Get the lowest price among all tiers and all turnaround times
  const allPrices: number[] = [];
  servicePricing.tiers.forEach(tier => {
    allPrices.push(tier.price12h, tier.price24h, tier.price48h, tier.price72h, tier.price7d);
  });

  return Math.min(...allPrices);
};

/**
 * Gets the standard turnaround time for a service.
 */
export const getTurnaroundTime = (serviceId: string): string => {
  try {
    const context = useServicesContext();
    const service = context.services.find(s => s.id === serviceId);
    if (service?.tiers?.[0]?.processingTime) {
      return service.tiers[0].processingTime;
    }
  } catch {
    // Context not available
  }
  
  const servicePricing = PRICING_MATRIX.find(p => p.id === serviceId);
  if (!servicePricing) return '24 Hours';
  
  return servicePricing.tiers[0]?.processingTime || '24 Hours';
};

/**
 * Get specific pricing for a service based on complexity and turnaround.
 * Returns null if not found.
 */
export const getSpecificPrice = (serviceId: string, complexity: string, turnaround: string): number | null => {
  try {
    const context = useServicesContext();
    return context.getServicePrice(serviceId, complexity, turnaround);
  } catch {
    // Context not available, try hardcoded
    const servicePricing = PRICING_MATRIX.find(p => p.id === serviceId);
    if (!servicePricing) return null;
    
    const tier = servicePricing.tiers.find(t => t.complexity === complexity);
    if (!tier) return null;
    
    const priceKey = `price${turnaround}` as keyof typeof tier;
    return (tier as any)[priceKey] || null;
  }
};
