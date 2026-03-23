import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Track last cleanup time to avoid cleaning on every request
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60000; // Cleanup every 60 seconds
const CLEANUP_BATCH_SIZE = 100; // Max entries to clean per request

/**
 * Lazy cleanup: removes expired entries during request processing
 * This is serverless/edge-compatible (no setInterval antipattern)
 */
function cleanupExpiredEntries(now: number): void {
  // Only cleanup if enough time has passed since last cleanup
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }
  
  lastCleanup = now;
  let cleaned = 0;
  
  // Cleanup expired entries (limit batch size to avoid blocking)
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
      cleaned++;
      
      // Limit cleanup batch size to avoid performance impact
      if (cleaned >= CLEANUP_BATCH_SIZE) {
        break;
      }
    }
  }
  
  if (cleaned > 0) {
    console.log(`[middleware] Cleaned ${cleaned} expired rate limit entries (map size: ${rateLimitMap.size})`);
  }
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';
    const now = Date.now();
    
    // Lazy cleanup: remove expired entries (serverless/edge-compatible)
    cleanupExpiredEntries(now);
    
    const windowMs = 60000;
    let maxRequests = 100;
    
    if (request.nextUrl.pathname === '/api/checkout') {
      maxRequests = 10;
    }
    
    const key = `${ip}:${request.nextUrl.pathname}`;
    
    const limit = rateLimitMap.get(key);
    
    if (limit && limit.resetTime > now) {
      if (limit.count >= maxRequests) {
        return NextResponse.json(
          { 
            error: 'Too Many Requests',
            message: 'Занадто багато запитів. Спробуйте пізніше.',
            retryAfter: Math.ceil((limit.resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((limit.resetTime - now) / 1000)),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(limit.resetTime),
            }
          }
        );
      }
      limit.count++;
    } else {
      rateLimitMap.set(key, { 
        count: 1, 
        resetTime: now + windowMs 
      });
    }
    
    const response = NextResponse.next();
    const currentLimit = rateLimitMap.get(key);
    if (currentLimit) {
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentLimit.count)));
      response.headers.set('X-RateLimit-Reset', String(currentLimit.resetTime));
    }
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

