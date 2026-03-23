import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Periodic cleanup to prevent memory leak
// Runs every minute to remove expired entries
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[middleware] Cleaned ${cleaned} expired rate limit entries`);
    }
  }, 60000); // Cleanup every minute
  
  // Prevent the interval from keeping the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'unknown';
    const now = Date.now();
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

