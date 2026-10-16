import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis: Max retries reached, caching disabled');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('Redis: Connected');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        console.warn('Redis: Connection error (caching disabled):', err.message);
      });

      this.redis.connect().catch(() => {
        console.warn('Redis: Failed to connect, running without cache');
      });
    } catch (error) {
      console.warn('Redis: Not available, running without cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch {
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.redis) return 0;
    try {
      let count = 0;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100, // Process in batches
      });

      return new Promise((resolve, reject) => {
        stream.on('data', async (keys) => {
          if (keys.length > 0) {
            // Pause stream while deleting
            stream.pause();
            await this.redis!.del(...keys);
            count += keys.length;
            stream.resume();
          }
        });

        stream.on('end', () => resolve(count));
        stream.on('error', (err) => reject(err));
      });
    } catch (err) {
      console.error('Redis: delPattern failed:', err);
      return 0;
    }
  }

  // Cache helpers for common patterns
  async cacheWithTenant<T>(
    tenantId: string,
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 300
  ): Promise<T> {
    const cacheKey = `tenant:${tenantId}:${key}`;
    const cached = await this.get<T>(cacheKey);
    if (cached) return cached;

    const data = await fetchFn();
    await this.set(cacheKey, data, ttl);
    return data;
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.delPattern(`tenant:${tenantId}:*`);
  }

  isEnabled(): boolean {
    return this.isConnected;
  }
}

export const cache = new CacheService();

export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  DAY: 86400,     // 24 hours
};