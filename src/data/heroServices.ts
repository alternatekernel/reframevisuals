// Mirrors SERVICES + HERO_CONFIG.PRIORITY_IDS from the original frontend/src/data/services.ts

const BASE = 'https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_800/reframe/services/';

export interface HeroService {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  beforeImage: string;
  afterImage: string;
}

export const HERO_SERVICES: HeroService[] = [
  {
    id: 'jewelry-retouch',
    categoryId: 'retouch',
    name: 'Jewelry Retouch',
    description: 'Specialized retouching for jewelry and accessories.',
    beforeImage: `${BASE}jewelry-retouch-before.jpg`,
    afterImage: `${BASE}jewelry-retouch-after.jpg`,
  },
  {
    id: 'color-change',
    categoryId: 'foundation',
    name: 'Color Change',
    description: 'Swap product colours or fabrics while preserving natural texture and lighting.',
    beforeImage: `${BASE}color-change-before.jpg`,
    afterImage: `${BASE}color-change-after.jpg`,
  },
  {
    id: 'pattern-change',
    categoryId: 'enhancement',
    name: 'Pattern Change',
    description: 'Replace patterns and prints on garments while preserving folds and shadows.',
    beforeImage: `${BASE}pattern-change-before.jpg`,
    afterImage: `${BASE}pattern-change-after.jpg`,
  },
  {
    id: 'ghost-mannequin',
    categoryId: 'foundation',
    name: 'Ghost Mannequin',
    description: 'Invisible mannequin compositing for a clean, hollow product look.',
    beforeImage: `${BASE}ghost-mannequin-before.jpg`,
    afterImage: `${BASE}ghost-mannequin-after.jpg`,
  },
  {
    id: 'model-retouch',
    categoryId: 'retouch',
    name: 'Model Retouch',
    description: 'Natural skin retouching, blemish removal, and lifestyle photo polish.',
    beforeImage: `${BASE}model-retouch-before.jpg`,
    afterImage: `${BASE}model-retouch-after.jpg`,
  },
  {
    id: 'garment-retouch',
    categoryId: 'retouch',
    name: 'Garment Retouch',
    description: 'Fabric cleanup, crease removal, and lint/dust correction for flat-lay and on-model shots.',
    beforeImage: `${BASE}garment-retouch-before.jpg`,
    afterImage: `${BASE}garment-retouch-after.jpg`,
  },
  {
    id: 'manipulation',
    categoryId: 'enhancement',
    name: 'Image Manipulation',
    description: 'Creative compositing, object removal, and scene construction.',
    beforeImage: `${BASE}manipulation-before.jpg`,
    afterImage: `${BASE}manipulation-after.jpg`,
  },
  {
    id: 'background-removal',
    categoryId: 'foundation',
    name: 'Background Removal',
    description: 'Manual Pen Tool background removal with pixel-perfect edges.',
    beforeImage: `${BASE}background-removal-before.jpg`,
    afterImage: `${BASE}background-removal-after.jpg`,
  },
  {
    id: 'color-correction',
    categoryId: 'foundation',
    name: 'Color Correction',
    description: 'White balance, exposure correction, and true-to-life colour grading.',
    beforeImage: `${BASE}color-correction-before.jpg`,
    afterImage: `${BASE}color-correction-after.jpg`,
  },
  {
    id: 'retouching',
    categoryId: 'retouch',
    name: 'Retouching',
    description: 'High-end product retouching for catalogs, ads, and marketplaces.',
    beforeImage: `${BASE}retouching-before.jpg`,
    afterImage: `${BASE}retouching-after.jpg`,
  },
];
