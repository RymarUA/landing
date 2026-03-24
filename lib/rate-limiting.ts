/**
 * lib/rate-limiting.ts
 *
 * Rate limiting utilities for API endpoints.
 * Uses persistent KV storage for serverless environments.
 */

import { getKVStore, type PersistentKVStore } from './persistent-kv-store';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private store: PersistentKVStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.store = getKVStore();
  }

  /**
   * Check if a request is allowed based on rate limit
   */
  async check(req: any): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const now = Date.now();
    
    // Get current rate limit data
    const current = await this.store.get<RateLimitData>(key);
    
    if (!current || current.resetTime < now) {
      // Reset window
      const newData: RateLimitData = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
      };
      
      await this.store.set(key, newData, Math.ceil(this.config.windowMs / 1000));
      
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: newData.resetTime,
      };
    }

    // Check if limit exceeded
    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    // Increment counter
    const updatedData: RateLimitData = {
      ...current,
      count: current.count + 1,
    };
    
    await this.store.set(key, updatedData, Math.ceil(this.config.windowMs / 1000));

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - updatedData.count,
      resetTime: updatedData.resetTime,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(req: any): Promise<void> {
    const key = this.getKey(req);
    await this.store.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(req: any): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const now = Date.now();
    
    const current = await this.store.get<RateLimitData>(key);
    
    if (!current || current.resetTime < now) {
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      allowed: current.count < this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - current.count),
      resetTime: current.resetTime,
      retryAfter: current.count >= this.config.maxRequests 
        ? Math.ceil((current.resetTime - now) / 1000)
        : undefined,
    };
  }

  private getKey(req: any): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key based on IP - use Headers API for Next.js
    const ip = req.headers?.get ? (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip')) : 'unknown';
    return `rate_limit:${ip || req.ip || 'unknown'}`;
  }
}

interface RateLimitData {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// Predefined rate limiters for common use cases
export const checkoutRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 checkout attempts per 15 minutes
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
});

export const generalApiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

/**
 * Express/Next.js middleware for rate limiting
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async function rateLimitMiddleware(req: any, res: any, next?: any) {
    try {
      const result = await limiter.check(req);
      
      // Set rate limit headers
      const headers = {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      };

      if (req.headers) {
        Object.assign(req.headers, headers);
      }

      if (!result.allowed) {
        const error = {
          error: 'Too many requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        };

        if (res?.json) {
          return res.status(429).set(headers).json(error);
        } else if (res?.status) {
          res.status(429);
          Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
          return res.json(error);
        }
      }

      if (next) {
        next();
      }
      return true;
    } catch (error) {
      console.error('[Rate Limit] Error:', error);
      // Allow request on error (fail open)
      if (next) {
        next();
      }
      return true;
    }
  };
}

/**
 * Helper function to apply rate limiting to Next.js API routes
 */
export async function applyRateLimit(
  req: any, 
  limiter: RateLimiter
): Promise<{ allowed: boolean; headers: Record<string, string>; error?: any }> {
  try {
    const result = await limiter.check(req);
    
    const headers = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };

    if (!result.allowed) {
      return {
        allowed: false,
        headers,
        error: {
          error: 'Too many requests',
          message: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }
      };
    }

    return { allowed: true, headers };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // Allow request on error (fail open)
    return { allowed: true, headers: {} };
  }
}
