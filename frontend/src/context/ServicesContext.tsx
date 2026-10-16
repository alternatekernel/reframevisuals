import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DynamicService } from '../hooks/useServices';
import { PRICING_MATRIX } from '../data/pricingMatrix';
import { ORDERED_SERVICES, Service, sortServicesByDisplayOrder } from '../data/services';
import { getApiEndpoint } from '../lib/apiConfig';

interface ServicesContextType {
  services: DynamicService[];
  isLoading: boolean;
  isFromDb: boolean;
  getStartingPrice: (serviceId: string, fallbackPrice?: number) => number;
  getServicePrice: (serviceId: string, complexity: string, turnaround: string) => number | null;
}

const ServicesContext = createContext<ServicesContextType | null>(null);

// Services retired from public display & pricing
const EXCLUDED_SERVICE_IDS = new Set([
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

const EXCLUDED_SERVICE_NAMES = new Set([
  'raster to vector',
  'ai product photography',
  'ai video generation',
  'sketch to image',
  'sketch to reality',
  'ai-generated image refinement',
  'ai generated image refinement',
  'ai-assisted image refinement',
  'ai refinement',
]);

export const isExcludedService = (item: any): boolean => {
  if (!item) return false;
  const id = typeof item.id === 'string' ? item.id.toLowerCase().trim() : '';
  const name = typeof item.name === 'string' ? item.name.toLowerCase().trim() : '';
  if (id && EXCLUDED_SERVICE_IDS.has(id)) return true;
  if (name && EXCLUDED_SERVICE_NAMES.has(name)) return true;
  return false;
};

// Initialize with fallback data immediately
const getFallbackServices = (): DynamicService[] => {
  return ORDERED_SERVICES
    .filter((svc: Service) => !isExcludedService(svc))
    .map((svc: Service) => {
    const pricingData = PRICING_MATRIX.find(p => p.id === svc.id);
    const tiers = pricingData?.tiers?.map(t => ({
      complexity: t.complexity,
      processingTime: t.processingTime || '',
      prices: {
        '12h': t.price12h,
        '24h': t.price24h,
        '48h': t.price48h,
        '72h': t.price72h,
        '7d': t.price7d,
      }
    })) || [];
    
    const startingPrice = tiers.length > 0 ? tiers[0].prices['24h'] : svc.price;
    
    return {
      id: svc.id,
      name: svc.name,
      price: svc.price,
      startingPrice,
      description: svc.description || '',
      detail: svc.detail || '',
      includes: svc.includes || [],
      bestFor: svc.bestFor || '',
      keywords: svc.keywords || [],
      beforeImage: svc.beforeImage,
      afterImage: svc.afterImage,
      examples: svc.examples,
      tiers,
      categoryId: svc.categoryId,
      icon: (svc as any).icon,
    };
  });
};

export const ServicesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<DynamicService[]>(getFallbackServices);
  const [isLoading] = useState(false); // Always false - data available immediately from fallback
  const [isFromDb, setIsFromDb] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(getApiEndpoint('/sections/services'));
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data?.content) {
            const content = typeof result.data.content === 'string' 
              ? JSON.parse(result.data.content) 
              : result.data.content;
            
            if (content.items && Array.isArray(content.items)) {
              const activeItems = content.items.filter((item: any) => !isExcludedService(item));
              const mapped = activeItems.map((item: any) => {
                // Normalize ID from 'basic-retouch' to 'retouching'
                const isLegacyRetouch = item.id === 'basic-retouch';
                const normalizedId = isLegacyRetouch ? 'retouching' : item.id;
                
                // Also normalize images if they point to legacy names
                const normalizeImagePath = (path: any) => {
                  if (typeof path === 'string' && path.includes('basic-retouch')) {
                    return path.replace('basic-retouch', 'retouching');
                  }
                  return path;
                };

                const fallback = getFallbackServices().find(s => s.id === normalizedId);
                return {
                  ...fallback,
                  id: normalizedId,
                  name: item.name || fallback?.name,
                  price: item.startingPrice || item.price || fallback?.price,
                  startingPrice: item.startingPrice || item.price || fallback?.startingPrice,
                  description: item.description || fallback?.description || '',
                  detail: item.detail || fallback?.detail || '',
                  includes: item.includes || fallback?.includes || [],
                  bestFor: item.bestFor || fallback?.bestFor || '',
                  keywords: item.keywords || fallback?.keywords || [],
                  beforeImage: normalizeImagePath(item.beforeImage) || fallback?.beforeImage,
                  afterImage: normalizeImagePath(item.afterImage) || fallback?.afterImage,
                  examples: (item.examples || fallback?.examples || []).map((ex: any) => ({
                    ...ex,
                    before: normalizeImagePath(ex.before),
                    after: normalizeImagePath(ex.after)
                  })),
                  tiers: item.tiers || fallback?.tiers || [],
                  categoryId: getCategoryForService(item.id),
                  icon: fallback?.icon,
                };
              });
              
              setServices(sortServicesByDisplayOrder(mapped));
              setIsFromDb(true);
              return;
            }
          }
        }
      } catch {
        console.warn('[ServicesContext] DB unavailable, using fallback data');
      }
      // Already initialized with fallback, no need to set again
    };

    fetchServices();
  }, []);

  const getStartingPrice = (serviceId: string, fallbackPrice?: number): number => {
    // Try DB first
    const dbService = services.find(s => s.id === serviceId);
    if (dbService?.startingPrice) {
      return dbService.startingPrice;
    }
    
    // Try hardcoded pricing matrix
    const matrixService = PRICING_MATRIX.find(p => p.id === serviceId);
    if (matrixService && matrixService.tiers.length > 0) {
      const prices = matrixService.tiers[0];
      return prices.price24h;
    }
    
    // Fallback to provided fallback or 0
    return fallbackPrice || 0;
  };

  const getServicePrice = (serviceId: string, complexity: string, turnaround: string): number | null => {
    // Try DB first
    const dbService = services.find(s => s.id === serviceId);
    if (dbService?.tiers) {
      const tier = dbService.tiers.find(t => t.complexity === complexity);
      if (tier?.prices[turnaround as keyof typeof tier.prices]) {
        return tier.prices[turnaround as keyof typeof tier.prices];
      }
    }
    
    // Try hardcoded matrix
    const matrixService = PRICING_MATRIX.find(p => p.id === serviceId);
    if (matrixService) {
      const tier = matrixService.tiers.find(t => t.complexity === complexity);
      if (tier) {
        const priceKey = `price${turnaround}` as keyof typeof tier;
        return (tier as any)[priceKey] || null;
      }
    }
    
    return null;
  };

  return (
    <ServicesContext.Provider value={{ services, isLoading, isFromDb, getStartingPrice, getServicePrice }}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServicesContext = (): ServicesContextType => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServicesContext must be used within ServicesProvider');
  }
  return context;
};

// Helper function
const getCategoryForService = (serviceId: string): string => {
  const categoryMap: Record<string, string> = {
    // Foundation
    'background-removal': 'foundation',
    'clipping-path': 'foundation',
    'multi-clipping-path': 'foundation',
    'ghost-mannequin': 'foundation',
    
    // Enhancement
    'color-correction': 'enhancement',
    'color-change': 'enhancement',
    'shadow-creation': 'enhancement',
    
    // Retouch
    'jewelry-retouch': 'retouch',
    'garment-retouch': 'retouch',
    'model-retouch': 'retouch',
    'background-retouch': 'retouch',
    'high-end-retouch': 'retouch',
    
    // Advanced
    'raster-to-vector': 'advanced',
    'manipulation': 'advanced',
    'pattern-change': 'advanced',
    'ai-editing-fixing': 'advanced',
    'sketch-to-reality': 'advanced',

    // AI-Driven
    'ai-refinement': 'ai-driven',
    'ai-product-photo': 'ai-driven',
    'ai-video-gen': 'ai-driven',
  };
  return categoryMap[serviceId] || 'foundation';
};
