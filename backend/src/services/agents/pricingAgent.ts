import { prisma } from '../../database';

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  source: string;
}

/**
 * PRICING AGENT: Pure Logic for cost calculation.
 * No AI used here.
 */
export const PricingAgent = {
  name: 'PricingAgent',
  description: 'Calculates the exact cost for photo editing services based on volume and complexity.',
  
  async execute(params?: { serviceType?: string; photoCount?: number }): Promise<AgentResponse> {
    try {
      const serviceType = params?.serviceType || 'standard-rate';
      const photoCount = params?.photoCount || 1;
      
      const pricingPolicy = await prisma.platformPolicy.findUnique({
        where: { key: 'PRICING_MATRIX' }
      });

      const matrix = pricingPolicy ? JSON.parse(pricingPolicy.content) : {};
      const isAll = serviceType.toLowerCase() === 'all' || serviceType.toLowerCase() === 'list';
      
      if (isAll) {
        return {
          success: true,
          source: 'Pricing Matrix (Bulk)',
          data: {
            fullMatrix: matrix,
            note: "All current elite rates from the master manifest."
          }
        };
      }

      // 1. Direct Lookup for exact service match, or fallback to standard
      const unitPrice = matrix[serviceType.toLowerCase()] || matrix['standard-rate'] || 2.99;
      
      // 2. Simple Member Discount (Directly from Matrix %)
      const discountPercent = matrix['member-discount-percent'] || 0;
      const memberPrice = unitPrice * (1 - (discountPercent / 100));

      return {
        success: true,
        source: 'Pricing Matrix (Single Source of Truth)',
        data: {
          service: serviceType,
          standardUnitPrice: unitPrice.toFixed(2),
          memberUnitPrice: memberPrice.toFixed(2),
          totalStandard: (unitPrice * photoCount).toFixed(2),
          totalMember: (memberPrice * photoCount).toFixed(2),
          currency: 'USD',
          note: "Prices retrieved directly from platform policy."
        }
      };
    } catch (error) {
      return { success: false, source: 'PricingAgent', error: 'Calculation failure' };
    }
  }
};
