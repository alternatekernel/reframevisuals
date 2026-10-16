// Simple TTL-based cache for API requests to improve admin dashboard performance
type CacheEntry = {
  data: any;
  timestamp: number;
};

const cache: Record<string, CacheEntry> = {};
const DEFAULT_TTL = 30000; // 30 seconds

export const fetchWithCache = async (url: string, options?: RequestInit, ttl: number = DEFAULT_TTL) => {
  const cacheKey = `${options?.method || 'GET'}-${url}-${JSON.stringify(options?.body || '')}`;
  
  // Return cached data if valid
  if (options?.method === 'GET' || !options?.method) {
    const entry = cache[cacheKey];
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data;
    }
  }

  // Fetch new data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API Request failed: ${response.statusText}`);
  }
  
  const data = await response.json();

  // Store in cache for GET requests
  if (options?.method === 'GET' || !options?.method) {
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
  } else {
    // Invalidate related caches on mutation (simplified)
    const baseUrl = url.split('?')[0];
    Object.keys(cache).forEach(key => {
      if (key.includes(baseUrl)) {
        delete cache[key];
      }
    });
  }

  return data;
};

export const invalidateCache = (urlPattern?: string) => {
  if (!urlPattern) {
    Object.keys(cache).forEach(key => delete cache[key]);
    return;
  }
  Object.keys(cache).forEach(key => {
    if (key.includes(urlPattern)) {
      delete cache[key];
    }
  });
};
