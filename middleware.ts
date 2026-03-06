import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limiting (для production рекомендуется использовать Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Очистка старых записей каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function middleware(request: NextRequest) {
  // Rate limiting только для API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'anonymous';
    const now = Date.now();
    const windowMs = 60000; // 1 минута
    const maxRequests = 100; // максимум запросов за окно
    
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
    
    // Добавить headers с информацией о rate limit
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
