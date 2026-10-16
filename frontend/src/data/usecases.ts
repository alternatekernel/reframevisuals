import { Package, Camera, Palette, ShoppingBag, LucideIcon } from 'lucide-react';

export interface UseCase {
  id: string;
  label: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  recommended: string[];
  optional: string[];
}

export const USE_CASES: UseCase[] = [
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    icon: Package,
    tagline: 'Product catalogs & marketplace listings',
    description: 'Product photos for Amazon, storefronts, and online stores.',
    recommended: ['Background Removal', 'Color Correction', 'Shadow Creation', 'Clipping Path'],
    optional: ['Color Change', 'Multi-Clipping Path', 'Ghost Mannequin'],
  },
  {
    id: 'editorial',
    label: 'Editorial',
    icon: Palette,
    tagline: 'Lifestyle, beauty & magazine-quality work',
    description: 'High-end retouching for fashion, beauty, and publications.',
    recommended: ['Retouching', 'Color Correction', 'Model Retouch'],
    optional: ['Manipulation', 'Shadow Creation'],
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: Camera,
    tagline: 'Portraits, events & commercial work',
    description: 'Professional photo editing for photographers and studios.',
    recommended: ['Retouching', 'Color Correction', 'Background Removal'],
    optional: ['Shadow Creation', 'Manipulation'],
  },
  {
    id: 'apparel',
    label: 'Apparel & Jewelry',
    icon: ShoppingBag,
    tagline: 'Clothing, accessories & jewelry',
    description: 'Specialized editing for fashion and jewelry brands.',
    recommended: ['Garment Retouch', 'Ghost Mannequin', 'Jewelry Retouch', 'Background Removal'],
    optional: ['Pattern Change', 'Model Retouch', 'Color Change'],
  },
];

export const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Background Removal': 'Remove or replace backgrounds for clean, professional product images.',
  'Clipping Path': 'Precise vector paths for isolating objects with clean edges.',
  'Multi-Clipping Path': 'Multiple paths for isolating individual parts of a product.',
  'Color Correction': 'Match colors across product shots for consistent brand appearance.',
  'Color Change': 'Change product colors to show different variants.',
  'Shadow Creation': 'Add natural-looking shadows for depth and realism.',
  'Manipulation': 'Creative compositing and image manipulation.',
  'Pattern Change': 'Swap patterns, textures, or materials on products.',
  'Retouching': 'Skin smoothing, blemish removal, and detail enhancement.',
  'Jewelry Retouch': 'Specialized retouching for rings, watches, and fine jewelry.',
  'Garment Retouch': 'Wrinkle removal, color fix, and fit adjustments for clothing.',
  'Model Retouch': 'Professional portrait and model photo retouching.',
  'Ghost Mannequin': 'Create invisible mannequin effect for apparel photography.',
};

export const TIER_DESCRIPTIONS: Record<string, string> = {
  S: 'Simple - straight edges, solid backgrounds, minimal detail',
  M: 'Medium - moderate curves, gradients, some complexity',
  A: 'Advanced - complex edges, hair, transparency, fine detail',
  C: 'Complex - multiple objects, intricate paths, heavy detail',
  SC: 'Super Complex - extreme detail, multiple intricate elements',
  Single: 'Single - one color or one element to adjust',
  Multiple: 'Multiple - several colors or elements to adjust',
  Multicolor: 'Multicolor - multiple color variations or patterns',
  Basic: 'Basic - light touch-ups, blemish removal, minor fixes',
  'High-end': 'High-end - magazine-quality, extensive enhancement',
};

export function getRecommendedServices(useCaseId: string): string[] {
  const uc = USE_CASES.find((u) => u.id === useCaseId);
  return uc ? uc.recommended : [];
}

export function getOptionalServices(useCaseId: string): string[] {
  const uc = USE_CASES.find((u) => u.id === useCaseId);
  return uc ? uc.optional : [];
}
