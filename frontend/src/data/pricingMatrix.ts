// Pricing Matrix Data from CSV
// Complexity tiers: S=Small, M=Medium, A=Advanced, C=Complex, SC=Super Complex

export interface PricingTier {
  complexity: string;
  processingTime: string;
  price12h: number;
  price24h: number;
  price48h: number;
  price72h: number;
  price7d: number;
}

export interface ServicePricing {
  id: string;
  name: string;
  categoryId: string;
  tiers: PricingTier[];
}

export const PRICING_MATRIX: ServicePricing[] = [
  // Background Removal
  {
    id: 'background-removal',
    name: 'Background Removal',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'S', processingTime: '3-5 min', price12h: 0.51, price24h: 0.39, price48h: 0.35, price72h: 0.33, price7d: 0.31 },
      { complexity: 'M', processingTime: '5-12 min', price12h: 1.01, price24h: 0.78, price48h: 0.70, price72h: 0.66, price7d: 0.62 },
      { complexity: 'A', processingTime: '12-25 min', price12h: 1.62, price24h: 1.25, price48h: 1.12, price72h: 1.06, price7d: 1.00 },
      { complexity: 'C', processingTime: '25min-1h 20m', price12h: 3.24, price24h: 2.50, price48h: 2.25, price72h: 2.12, price7d: 2.00 },
    ],
  },
  
  // Clipping Path
  {
    id: 'clipping-path',
    name: 'Clipping Path',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'S', processingTime: '5-7 min', price12h: 0.51, price24h: 0.39, price48h: 0.35, price72h: 0.33, price7d: 0.31 },
      { complexity: 'M', processingTime: '8-15 min', price12h: 0.66, price24h: 0.51, price48h: 0.46, price72h: 0.43, price7d: 0.41 },
      { complexity: 'A', processingTime: '15-45 min', price12h: 1.22, price24h: 0.99, price48h: 0.89, price72h: 0.84, price7d: 0.79 },
      { complexity: 'C', processingTime: '45min-1h 20m', price12h: 1.71, price24h: 1.90, price48h: 1.71, price72h: 1.62, price7d: 1.52 },
      { complexity: 'SC', processingTime: '1h 20m-2h', price12h: 3.84, price24h: 2.99, price48h: 2.69, price72h: 2.54, price7d: 2.39 },
    ],
  },
  
  // Multi-Clipping Path
  {
    id: 'multi-clipping-path',
    name: 'Multi-Clipping Path',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'S', processingTime: '8-12 min', price12h: 1.17, price24h: 0.90, price48h: 0.81, price72h: 0.77, price7d: 0.72 },
      { complexity: 'M', processingTime: '12-25 min', price12h: 2.16, price24h: 1.67, price48h: 1.50, price72h: 1.42, price7d: 1.33 },
      { complexity: 'A', processingTime: '25-45 min', price12h: 2.93, price24h: 2.25, price48h: 2.03, price72h: 1.91, price7d: 1.80 },
      { complexity: 'C', processingTime: '45min-1h 30m', price12h: 4.98, price24h: 3.83, price48h: 3.45, price72h: 3.26, price7d: 3.06 },
      { complexity: 'SC', processingTime: '1h 30m-2h 30m', price12h: 6.73, price24h: 5.18, price48h: 4.66, price72h: 4.40, price7d: 4.14 },
    ],
  },
  
  // Color Correction
  {
    id: 'color-correction',
    name: 'Color Correction',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'Single', processingTime: '5-8 min', price12h: 0.46, price24h: 0.35, price48h: 0.32, price72h: 0.30, price7d: 0.28 },
      { complexity: 'Multiple', processingTime: '8-15 min', price12h: 1.04, price24h: 0.80, price48h: 0.72, price72h: 0.68, price7d: 0.64 },
    ],
  },
  
  // Color Change
  {
    id: 'color-change',
    name: 'Color Change',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'Single', processingTime: '5-8 min', price12h: 0.39, price24h: 0.30, price48h: 0.27, price72h: 0.26, price7d: 0.24 },
      { complexity: 'Multiple', processingTime: '8-15 min', price12h: 0.91, price24h: 0.70, price48h: 0.63, price72h: 0.60, price7d: 0.56 },
    ],
  },
  
  // Pattern Change
  {
    id: 'pattern-change',
    name: 'Pattern Change',
    categoryId: 'enhancement',
    tiers: [
      { complexity: 'Single', processingTime: '20-30 min', price12h: 1.63, price24h: 1.25, price48h: 1.13, price72h: 1.06, price7d: 1.00 },
      { complexity: 'Multicolor', processingTime: '40-50 min', price12h: 0.50, price24h: 0.50, price48h: 0.50, price72h: 0.50, price7d: 0.50 },
      { complexity: 'Multiple', processingTime: '50min-1h 30m', price12h: 3.64, price24h: 2.80, price48h: 2.52, price72h: 2.38, price7d: 2.24 },
      { complexity: 'Multicolor', processingTime: '1h 30m-2h 30m', price12h: 1.00, price24h: 1.00, price48h: 1.00, price72h: 1.00, price7d: 1.00 },
    ],
  },
  
  // Shadow Creation
  {
    id: 'shadow-creation',
    name: 'Shadow Creation',
    categoryId: 'enhancement',
    tiers: [
      { complexity: 'S', processingTime: '3-5 min', price12h: 0.46, price24h: 0.35, price48h: 0.32, price72h: 0.30, price7d: 0.28 },
      { complexity: 'M', processingTime: '5-10 min', price12h: 0.77, price24h: 0.59, price48h: 0.53, price72h: 0.50, price7d: 0.47 },
      { complexity: 'C', processingTime: '10-20 min', price12h: 1.29, price24h: 0.99, price48h: 0.89, price72h: 0.84, price7d: 0.79 },
    ],
  },
  
  // Manipulation
  {
    id: 'manipulation',
    name: 'Manipulation',
    categoryId: 'enhancement',
    tiers: [
      { complexity: 'S', processingTime: '30min-1h', price12h: 5.19, price24h: 3.99, price48h: 3.59, price72h: 3.39, price7d: 3.19 },
      { complexity: 'C', processingTime: '1-2h 30m', price12h: 11.69, price24h: 8.99, price48h: 8.09, price72h: 7.64, price7d: 7.19 },
    ],
  },
  
  // Retouching
  {
    id: 'retouching',
    name: 'Retouching',
    categoryId: 'retouch',
    tiers: [
      { complexity: 'Basic', processingTime: '6-10 min', price12h: 0.72, price24h: 0.55, price48h: 0.50, price72h: 0.47, price7d: 0.44 },
      { complexity: 'Advanced', processingTime: '10-25 min', price12h: 2.59, price24h: 1.99, price48h: 1.79, price72h: 1.69, price7d: 1.59 },
      { complexity: 'High-end', processingTime: '25min-1h 20m', price12h: 5.20, price24h: 4.00, price48h: 3.60, price72h: 3.40, price7d: 3.20 },
    ],
  },
  
  // Jewelry Retouch
  {
    id: 'jewelry-retouch',
    name: 'Jewelry Retouch',
    categoryId: 'retouch',
    tiers: [
      { complexity: 'Basic', processingTime: '6-10 min', price12h: 1.04, price24h: 0.80, price48h: 0.72, price72h: 0.68, price7d: 0.64 },
      { complexity: 'Advanced', processingTime: '10-25 min', price12h: 2.59, price24h: 1.99, price48h: 1.79, price72h: 1.69, price7d: 1.59 },
      { complexity: 'High-end', processingTime: '25min-1h 20m', price12h: 6.50, price24h: 5.00, price48h: 4.50, price72h: 4.25, price7d: 4.00 },
    ],
  },
  
  // Garment Retouch
  {
    id: 'garment-retouch',
    name: 'Garment Retouch',
    categoryId: 'retouch',
    tiers: [
      { complexity: 'S', processingTime: '5-7 min', price12h: 0.72, price24h: 0.55, price48h: 0.50, price72h: 0.47, price7d: 0.44 },
      { complexity: 'M', processingTime: '7-15 min', price12h: 1.29, price24h: 0.99, price48h: 0.89, price72h: 0.84, price7d: 0.79 },
      { complexity: 'C', processingTime: '15-30 min', price12h: 2.59, price24h: 1.99, price48h: 1.79, price72h: 1.69, price7d: 1.59 },
    ],
  },
  
  // Model Retouch
  {
    id: 'model-retouch',
    name: 'Model Retouch',
    categoryId: 'retouch',
    tiers: [
      { complexity: 'S', processingTime: '5-7 min', price12h: 1.56, price24h: 1.20, price48h: 1.08, price72h: 1.02, price7d: 0.96 },
      { complexity: 'M', processingTime: '7-30 min', price12h: 2.86, price24h: 2.20, price48h: 1.98, price72h: 1.87, price7d: 1.76 },
      { complexity: 'C', processingTime: '30min-1h', price12h: 4.67, price24h: 3.59, price48h: 3.23, price72h: 3.05, price7d: 2.87 },
    ],
  },
  
  // Ghost Mannequin
  {
    id: 'ghost-mannequin',
    name: 'Ghost Mannequin',
    categoryId: 'foundation',
    tiers: [
      { complexity: 'S', processingTime: '10-20 min', price12h: 1.11, price24h: 0.85, price48h: 0.77, price72h: 0.72, price7d: 0.68 },
      { complexity: 'M', processingTime: '20-40 min', price12h: 2.46, price24h: 1.89, price48h: 1.70, price72h: 1.61, price7d: 1.51 },
      { complexity: 'C', processingTime: '40min-1h 20m', price12h: 5.19, price24h: 3.99, price48h: 3.59, price72h: 3.39, price7d: 3.19 },
    ],
  },
  
];

// Turnaround multipliers (based on 24h as baseline)
export const TURNAROUND_MULTIPLIERS = {
  '12h': 1.3,
  '24h': 1.0,
  '48h': 0.9,
  '72h': 0.85,
  '7d': 0.8,
};

// Volume discounts
export const VOLUME_DISCOUNTS = [
  { minQuantity: 500, discount: 0.20 },
  { minQuantity: 200, discount: 0.15 },
  { minQuantity: 100, discount: 0.10 },
  { minQuantity: 50, discount: 0.05 },
];
