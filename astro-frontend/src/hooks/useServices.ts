import { useState, useEffect, useMemo } from 'react';
import { SERVICES as HARDCODED_SERVICES } from '../data/services';
import { getApiEndpoint } from '../lib/apiConfig';
import { isExcludedService } from '../context/ServicesContext';

interface ServiceTier {
  complexity: string;
  processingTime: string;
  prices: {
    '12h': number;
    '24h': number;
    '48h': number;
    '72h': number;
    '7d': number;
  };
}

interface DbService {
  id: string;
  name: string;
  price: number;
  startingPrice?: number;
  description?: string;
  tiers?: ServiceTier[];
  [key: string]: any;
}

export interface DynamicService {
  id: string;
  name: string;
  price: number;
  startingPrice?: number;
  description?: string;
  categoryId: string;
  icon?: any;
  detail?: string;
  includes?: string[];
  bestFor?: string;
  keywords?: string[];
  beforeImage?: string;
  afterImage?: string;
  examples?: { before: string; after: string; label?: string }[];
  tiers?: ServiceTier[];
  metaTitle?: string;
  metaDescription?: string;
  searchTerms?: string[];
}

interface UseServicesResult {
  services: DynamicService[];
  isLoading: boolean;
  isFromDb: boolean;
  error: string | null;
  refetch: () => void;
}

export const useServices = (): UseServicesResult => {
  const [dbServices, setDbServices] = useState<DynamicService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromDb, setIsFromDb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiEndpoint('/sections/services'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.content) {
        const content = typeof result.data.content === 'string' 
          ? JSON.parse(result.data.content) 
          : result.data.content;
        
        if (content.items && Array.isArray(content.items)) {
          // Map DB format to frontend format, filtering out retired services
          const mapped = content.items
            .filter((item: DbService) => !isExcludedService(item))
            .map((item: DbService) => ({
            id: item.id,
            name: item.name,
            price: item.startingPrice || item.price,
            startingPrice: item.startingPrice || item.price,
            description: item.description || '',
            categoryId: getCategoryForService(item.id),
            tiers: item.tiers || [],
            metaTitle: item.metaTitle,
            metaDescription: item.metaDescription,
            searchTerms: item.searchTerms,
          }));
          
          setDbServices(mapped);
          setIsFromDb(true);
        }
      }
    } catch {
      console.warn('[useServices] Database fetch failed, using hardcoded data');
      setError('Using fallback data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Memoize the result - use DB if available, fallback to hardcoded
  const services = useMemo(() => {
    if (dbServices.length > 0) {
      return dbServices.filter(s => !isExcludedService(s));
    }
    // Fallback to hardcoded
    return (HARDCODED_SERVICES as DynamicService[]).filter(s => !(s as any).hidden && !isExcludedService(s));
  }, [dbServices]);

  return {
    services,
    isLoading,
    isFromDb,
    error,
    refetch: fetchServices,
  };
};

// Helper to assign category based on service ID
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

// Hook for getting full pricing matrix from DB
export const usePricingMatrix = () => {
  const { services, isLoading, isFromDb } = useServices();

  const pricingMatrix = useMemo(() => {
    return services.map(service => ({
      id: service.id,
      name: service.name,
      price: service.startingPrice || service.price,
      tiers: service.tiers || [],
    }));
  }, [services]);

  return { pricingMatrix, isLoading, isFromDb };
};

export default useServices;
