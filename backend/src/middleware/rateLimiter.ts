import rateLimit, { Store, ClientRateLimitInfo } from 'express-rate-limit';
import Redis from 'ioredis';

// Minimal Redis store for express-rate-limit v8.
// Falls back gracefully to in-memory behavior if Redis is unavailable.
class RedisRateLimitStore implements Store {
  private _redis: Redis;
  private _ns: string;
  private _windowMs: number;

  constructor(redis: Redis, ns: string, windowMs: number) {
    this._redis = redis;
    this._ns = ns;
    this._windowMs = windowMs;
  }

  private key(rawKey: string) {
    return `${this._ns}:${rawKey}`;
  }

  async increment(rawKey: string): Promise<ClientRateLimitInfo> {
    const key = this.key(rawKey);
    const ttlSeconds = Math.ceil(this._windowMs / 1000);
    try {
      const pipeline = this._redis.pipeline();
      pipeline.incr(key);
      pipeline.pttl(key);
      const results = await pipeline.exec();
      const hits = (results?.[0]?.[1] as number) ?? 1;
      const pttl = (results?.[1]?.[1] as number) ?? -1;
      if (pttl < 0) {
        await this._redis.expire(key, ttlSeconds);
      }
      const resetTime = new Date(Date.now() + (pttl > 0 ? pttl : this._windowMs));
      return { totalHits: hits, resetTime };
    } catch {
      return { totalHits: 1, resetTime: new Date(Date.now() + this._windowMs) };
    }
  }

  async decrement(rawKey: string): Promise<void> {
    try {
      await this._redis.decr(this.key(rawKey));
    } catch { /* silent */ }
  }

  async resetKey(rawKey: string): Promise<void> {
    try {
      await this._redis.del(this.key(rawKey));
    } catch { /* silent */ }
  }
}

// Shared Redis client — lazy, so startup doesn't fail if Redis is down
let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redisClient = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 1000)),
    });
    redisClient.connect().catch(() => { /* fall back to in-memory */ });
    return redisClient;
  } catch {
    return null;
  }
}

function makeStore(prefix: string, windowMs: number): Store | undefined {
  const redis = getRedis();
  return redis ? new RedisRateLimitStore(redis, prefix, windowMs) : undefined;
}

const AUTH_WINDOW = 1 * 60 * 1000;
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW,
  max: 20,
  store: makeStore('rl:auth', AUTH_WINDOW),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const API_WINDOW = 1 * 60 * 1000;
export const apiLimiter = rateLimit({
  windowMs: API_WINDOW,
  max: 100,
  store: makeStore('rl:api', API_WINDOW),
  message: {
    success: false,
    message: 'Too many requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const CHAT_WINDOW = 1 * 60 * 1000;
export const chatLimiter = rateLimit({
  windowMs: CHAT_WINDOW,
  max: 120,
  store: makeStore('rl:chat', CHAT_WINDOW),
  message: {
    success: false,
    message: 'You are sending messages too quickly. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const UPLOAD_WINDOW = 1 * 60 * 1000;
export const uploadLimiter = rateLimit({
  windowMs: UPLOAD_WINDOW,
  max: 30,
  store: makeStore('rl:upload', UPLOAD_WINDOW),
  message: {
    success: false,
    message: 'Too many file uploads. Please wait a moment before uploading again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
