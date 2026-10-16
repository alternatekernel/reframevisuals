import {
  EraserIcon, PenTool01Icon, PathIcon, ColorsIcon, PaintBucketIcon,
  Layers01Icon, RepairIcon, UngroupItemsIcon,
  MaterialAndTextureIcon, BrushIcon, Diamond01Icon, ClothesIcon,
  UserEdit01Icon, TShirtIcon,
  MagicWand01Icon as MagicWandIcon
} from 'hugeicons-react';

export interface Turnaround {
  key: string;
  label: string;
  badge?: string;
}

export const TURNAROUNDS: Turnaround[] = [
  { key: '12h', label: '12h', badge: '\u26A1' },
  { key: '24h', label: '24h' },
  { key: '48h', label: '48h' },
  { key: '72h', label: '72h' },
  { key: '7d', label: '7d' },
];

export const TIER_LABELS: Record<string, string> = {
  S: 'Simple', M: 'Medium', A: 'Advanced', C: 'Complex', SC: 'Super Complex',
  Single: 'Single', Multiple: 'Multiple', Multicolor: 'Multicolor',
  Basic: 'Basic', 'High-end': 'High-end',
};

export const CATEGORIES: Record<string, { services: string[]; color: string }> = {
  Foundation: { 
    services: ['Background Removal', 'Clipping Path', 'Multi-Clipping Path', 'Ghost Mannequin'], 
    color: '#EA580C' 
  },
  Enhancement: { 
    services: ['Color Correction', 'Color Change', 'Shadow Creation'], 
    color: '#0284C7' 
  },
  Retouch: { 
    services: ['Retouching', 'Jewelry Retouch', 'Garment Retouch', 'Model Retouch'], 
    color: '#16A34A' 
  },
  Advanced: {
    services: ['Manipulation', 'Pattern Change'],
    color: '#7C3AED'
  },
  'AI-Driven': {
    services: ['AI-Generated Image Refinement'],
    color: '#A855F7'
  },
};

export interface ServicePricing {
  icon: any;
  tiers: Record<string, string>;
  prices: Record<string, Record<string, number>>;
}

export const SERVICES: Record<string, ServicePricing> = {
  'Background Removal': {
    icon: EraserIcon,
    tiers: { S: 'Simple', M: 'Medium', A: 'Advanced', C: 'Complex' },
    prices: {
      S: { '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 },
      M: { '12h': 1.01, '24h': 0.78, '48h': 0.70, '72h': 0.66, '7d': 0.62 },
      A: { '12h': 1.62, '24h': 1.25, '48h': 1.12, '72h': 1.06, '7d': 1.00 },
      C: { '12h': 3.24, '24h': 2.50, '48h': 2.25, '72h': 2.12, '7d': 2.00 },
    },
  },
  'Clipping Path': {
    icon: PenTool01Icon,
    tiers: { S: 'Simple', M: 'Medium', A: 'Advanced', C: 'Complex', SC: 'Super Complex' },
    prices: {
      S:  { '12h': 0.51, '24h': 0.39, '48h': 0.35, '72h': 0.33, '7d': 0.31 },
      M:  { '12h': 0.66, '24h': 0.51, '48h': 0.46, '72h': 0.43, '7d': 0.41 },
      A:  { '12h': 1.22, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },
      C:  { '12h': 1.71, '24h': 1.90, '48h': 1.71, '72h': 1.62, '7d': 1.52 },
      SC: { '12h': 3.84, '24h': 2.99, '48h': 2.69, '72h': 2.54, '7d': 2.39 },
    },
  },
  'Multi-Clipping Path': {
    icon: PathIcon,
    tiers: { S: 'Simple', M: 'Medium', A: 'Advanced', C: 'Complex', SC: 'Super Complex' },
    prices: {
      S:  { '12h': 1.17, '24h': 0.90, '48h': 0.81, '72h': 0.77, '7d': 0.72 },
      M:  { '12h': 2.16, '24h': 1.67, '48h': 1.50, '72h': 1.42, '7d': 1.33 },
      A:  { '12h': 2.93, '24h': 2.25, '48h': 2.03, '72h': 1.91, '7d': 1.80 },
      C:  { '12h': 4.98, '24h': 3.83, '48h': 3.45, '72h': 3.26, '7d': 3.06 },
      SC: { '12h': 6.73, '24h': 5.18, '48h': 4.66, '72h': 4.40, '7d': 4.14 },
    },
  },
  'Color Correction': {
    icon: ColorsIcon,
    tiers: { Single: 'Single', Multiple: 'Multiple' },
    prices: {
      Single:   { '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 },
      Multiple: { '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 },
    },
  },
  'Color Change': {
    icon: PaintBucketIcon,
    tiers: { Single: 'Single', Multiple: 'Multiple' },
    prices: {
      Single:   { '12h': 0.39, '24h': 0.30, '48h': 0.27, '72h': 0.26, '7d': 0.24 },
      Multiple: { '12h': 0.91, '24h': 0.70, '48h': 0.63, '72h': 0.60, '7d': 0.56 },
    },
  },
  'Pattern Change': {
    icon: MaterialAndTextureIcon,
    tiers: { Single: 'Single', Multicolor: 'Multicolor', Multiple: 'Multiple' },
    prices: {
      Single:      { '12h': 1.63, '24h': 1.25, '48h': 1.13, '72h': 1.06, '7d': 1.00 },
      Multicolor:  { '12h': 0.50, '24h': 0.50, '48h': 0.50, '72h': 0.50, '7d': 0.50 },
      Multiple:    { '12h': 3.64, '24h': 2.80, '48h': 2.52, '72h': 2.38, '7d': 2.24 },
    },
  },
  'Shadow Creation': {
    icon: Layers01Icon,
    tiers: { S: 'Simple', M: 'Medium', C: 'Complex' },
    prices: {
      S: { '12h': 0.46, '24h': 0.35, '48h': 0.32, '72h': 0.30, '7d': 0.28 },
      M: { '12h': 0.77, '24h': 0.59, '48h': 0.53, '72h': 0.50, '7d': 0.47 },
      C: { '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },
    },
  },
  'Manipulation': {
    icon: UngroupItemsIcon,
    tiers: { S: 'Simple', C: 'Complex' },
    prices: {
      S: { '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 },
      C: { '12h': 11.69, '24h': 8.99, '48h': 8.09, '72h': 7.64, '7d': 7.19 },
    },
  },
  'Retouching': {
    icon: BrushIcon,
    tiers: { Basic: 'Basic', Advanced: 'Advanced', 'High-end': 'High-end' },
    prices: {
      Basic:     { '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 },
      Advanced:  { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
      'High-end': { '12h': 5.20, '24h': 4.00, '48h': 3.60, '72h': 3.40, '7d': 3.20 },
    },
  },
  'Jewelry Retouch': {
    icon: Diamond01Icon,
    tiers: { Basic: 'Basic', Advanced: 'Advanced', 'High-end': 'High-end' },
    prices: {
      Basic:      { '12h': 1.04, '24h': 0.80, '48h': 0.72, '72h': 0.68, '7d': 0.64 },
      Advanced:   { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
      'High-end': { '12h': 6.50, '24h': 5.00, '48h': 4.50, '72h': 4.25, '7d': 4.00 },
    },
  },
  'Garment Retouch': {
    icon: ClothesIcon,
    tiers: { S: 'Simple', M: 'Medium', C: 'Complex' },
    prices: {
      S: { '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 },
      M: { '12h': 1.29, '24h': 0.99, '48h': 0.89, '72h': 0.84, '7d': 0.79 },
      C: { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
    },
  },
  'Model Retouch': {
    icon: UserEdit01Icon,
    tiers: { S: 'Simple', M: 'Medium', C: 'Complex' },
    prices: {
      S: { '12h': 1.56, '24h': 1.20, '48h': 1.08, '72h': 1.02, '7d': 0.96 },
      M: { '12h': 2.86, '24h': 2.20, '48h': 1.98, '72h': 1.87, '7d': 1.76 },
      C: { '12h': 4.67, '24h': 3.59, '48h': 3.23, '72h': 3.05, '7d': 2.87 },
    },
  },
  'Ghost Mannequin': {
    icon: TShirtIcon,
    tiers: { S: 'Simple', M: 'Medium', C: 'Complex' },
    prices: {
      S: { '12h': 1.11, '24h': 0.85, '48h': 0.77, '72h': 0.72, '7d': 0.68 },
      M: { '12h': 2.46, '24h': 1.89, '48h': 1.70, '72h': 1.61, '7d': 1.51 },
      C: { '12h': 5.19, '24h': 3.99, '48h': 3.59, '72h': 3.39, '7d': 3.19 },
    },
  },
  'AI-Generated Image Refinement': {
    icon: MagicWandIcon,
    tiers: { S: 'Simple', C: 'Complex' },
    prices: {
      S: { '12h': 0.72, '24h': 0.55, '48h': 0.50, '72h': 0.47, '7d': 0.44 },
      C: { '12h': 2.59, '24h': 1.99, '48h': 1.79, '72h': 1.69, '7d': 1.59 },
    },
  },
};

export const getServiceCategory = (serviceName: string): { category: string; color: string } => {
  for (const [category, data] of Object.entries(CATEGORIES)) {
    if (data.services.includes(serviceName)) {
      return { category, color: data.color };
    }
  }
  return { category: 'Other', color: '#0A0A0B' };
};
