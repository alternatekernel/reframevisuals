// Server-side port of the logic in context/ServicesContext.tsx (fallback list + DB upgrade + price helpers).
import { PRICING_MATRIX } from '../data/pricingMatrix';
import { ORDERED_SERVICES, sortServicesByDisplayOrder, type Service } from '../data/services';
import { apiGet } from './serverApi';

export interface ServiceTier {
  complexity: string;
  processingTime: string;
  prices: { '12h': number; '24h': number; '48h': number; '72h': number; '7d': number };
}
export interface DynamicService {
  id: string; name: string; price: number; startingPrice?: number; description?: string; categoryId: string; icon?: any;
  detail?: string; includes?: string[]; bestFor?: string; keywords?: string[]; beforeImage?: string; afterImage?: string; examples?: any[]; tiers?: ServiceTier[];
  [key: string]: any;
}

const EXCLUDED_IDS = new Set(['raster-to-vector', 'raster-vector', 'ai-product-photography', 'ai-product-photo', 'ai-video-generation', 'ai-video-gen', 'sketch-to-reality', 'sketch-to-image', 'sketch-reality', 'ai-generated-image-refinement', 'ai-refinement', 'ai-editing-fixing']);
const EXCLUDED_NAMES = new Set(['raster to vector', 'ai product photography', 'ai video generation', 'sketch to image', 'sketch to reality', 'ai-generated image refinement', 'ai generated image refinement', 'ai-assisted image refinement', 'ai refinement']);

export const isExcludedService = (item: any): boolean => {
  if (!item) return false;
  const id = typeof item.id === 'string' ? item.id.toLowerCase().trim() : '';
  const name = typeof item.name === 'string' ? item.name.toLowerCase().trim() : '';
  return Boolean((id && EXCLUDED_IDS.has(id)) || (name && EXCLUDED_NAMES.has(name)));
};

const CATEGORY: Record<string, string> = {
  'background-removal': 'foundation', 'clipping-path': 'foundation', 'multi-clipping-path': 'foundation', 'ghost-mannequin': 'foundation',
  'color-correction': 'enhancement', 'color-change': 'enhancement', 'shadow-creation': 'enhancement',
  'jewelry-retouch': 'retouch', 'garment-retouch': 'retouch', 'model-retouch': 'retouch', 'background-retouch': 'retouch', 'high-end-retouch': 'retouch',
  'raster-to-vector': 'advanced', manipulation: 'advanced', 'pattern-change': 'advanced', 'ai-editing-fixing': 'advanced', 'sketch-to-reality': 'advanced',
  'ai-refinement': 'ai-driven', 'ai-product-photo': 'ai-driven', 'ai-video-gen': 'ai-driven',
};
export const getCategoryForService = (id: string) => CATEGORY[id] || 'foundation';

export function getFallbackServices(): DynamicService[] {
  return ORDERED_SERVICES.filter((svc: Service) => !isExcludedService(svc)).map((svc: Service) => {
    const pricing = PRICING_MATRIX.find((p) => p.id === svc.id);
    const tiers = pricing?.tiers?.map((t) => ({
      complexity: t.complexity,
      processingTime: t.processingTime || '',
      prices: { '12h': t.price12h, '24h': t.price24h, '48h': t.price48h, '72h': t.price72h, '7d': t.price7d },
    })) || [];
    return {
      id: svc.id, name: svc.name, price: svc.price, startingPrice: tiers.length > 0 ? tiers[0].prices['24h'] : svc.price,
      description: svc.description || '', detail: svc.detail || '', includes: svc.includes || [], bestFor: svc.bestFor || '', keywords: svc.keywords || [],
      beforeImage: svc.beforeImage, afterImage: svc.afterImage, examples: svc.examples, tiers, categoryId: svc.categoryId, icon: (svc as any).icon,
    } as DynamicService;
  });
}

const normalizeImage = (p: any) => (typeof p === 'string' && p.includes('basic-retouch') ? p.replace('basic-retouch', 'retouching') : p);

let cache: { at: number; value: DynamicService[] } | null = null;
// Fallback list upgraded with the admin-managed services (same merge rules as the React ServicesProvider).
export async function loadServices(): Promise<DynamicService[]> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const fallback = getFallbackServices();
  let value = fallback;
  const res = await apiGet<{ success?: boolean; data?: { content?: any } }>('/sections/services');
  try {
    const raw = res?.data?.content;
    const content = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (res?.success && Array.isArray(content?.items)) {
      const mapped = content.items.filter((i: any) => !isExcludedService(i)).map((item: any) => {
        const id = item.id === 'basic-retouch' ? 'retouching' : item.id;
        const fb = fallback.find((s) => s.id === id);
        return {
          ...fb, id, name: item.name || fb?.name, price: item.startingPrice || item.price || fb?.price,
          startingPrice: item.startingPrice || item.price || fb?.startingPrice, description: item.description || fb?.description || '',
          detail: item.detail || fb?.detail || '', includes: item.includes || fb?.includes || [], bestFor: item.bestFor || fb?.bestFor || '',
          keywords: item.keywords || fb?.keywords || [], beforeImage: normalizeImage(item.beforeImage) || fb?.beforeImage, afterImage: normalizeImage(item.afterImage) || fb?.afterImage,
          examples: (item.examples || fb?.examples || []).map((ex: any) => ({ ...ex, before: normalizeImage(ex.before), after: normalizeImage(ex.after) })),
          tiers: item.tiers || fb?.tiers || [], categoryId: getCategoryForService(item.id), icon: fb?.icon,
        } as DynamicService;
      });
      if (mapped.length) value = sortServicesByDisplayOrder(mapped as any) as DynamicService[];
    }
  } catch { /* keep fallback */ }
  cache = { at: Date.now(), value };
  return value;
}

export function getStartingPrice(services: DynamicService[], serviceId: string, fallbackPrice?: number): number {
  const db = services.find((s) => s.id === serviceId);
  if (db?.startingPrice) return db.startingPrice;
  const m = PRICING_MATRIX.find((p) => p.id === serviceId);
  if (m && m.tiers.length > 0) return m.tiers[0].price24h;
  return fallbackPrice || 0;
}

export function getServicePrice(services: DynamicService[], serviceId: string, complexity: string, turnaround: string): number | null {
  const db = services.find((s) => s.id === serviceId);
  const tier = db?.tiers?.find((t) => t.complexity === complexity);
  const v = tier?.prices[turnaround as keyof ServiceTier['prices']];
  if (v) return v;
  const m = PRICING_MATRIX.find((p) => p.id === serviceId);
  const mt = m?.tiers.find((t) => t.complexity === complexity);
  return mt ? ((mt as any)[`price${turnaround}`] || null) : null;
}
