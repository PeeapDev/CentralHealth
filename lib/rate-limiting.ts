import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client if env variables are provided
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

interface RateLimitConfig {
  limit: number;    // Maximum number of requests
  window: number;   // Time window in seconds
}

// Default rate limit configurations
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  'password-reset': { limit: 5, window: 3600 }, // 5 requests per hour
  'login-attempts': { limit: 10, window: 600 }, // 10 attempts in 10 minutes
  'api-general': { limit: 100, window: 60 },    // 100 requests per minute
};

/**
 * Simple in-memory rate limiting for development when Redis isn't available
 */
const memoryStore: Record<string, { count: number, expires: number }> = {};

/**
 * Get a unique identifier for a request context (fallback method)
 * @returns A consistent identifier for the development environment or a random one for production
 */
export function getRequestIdentifier(): string {
  // Generate a random identifier for each request
  const randomId = Math.random().toString(36).substring(2, 15);
  
  // Use a consistent identifier for development to avoid rate limiting during development
  if (process.env.NODE_ENV === 'development') {
    return 'dev-environment';
  }
  
  // Use a unique identifier (less secure but avoids TypeScript errors)
  return `request-${randomId}`;
}

/**
 * Extract IP address and identifying information from a request
 * @param request The Next.js request object
 * @returns A string identifier for rate limiting
 */
export function getIdentifierFromRequest(request: Request | NextRequest): string {
  // Priority: x-forwarded-for > x-real-ip > fallback
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    
    // Try to get NextRequest specific info if available (Next.js middleware)
    if ('geo' in request && typeof request.geo === 'object' && request.geo && 'ip' in request.geo) {
      const ip = (request.geo as { ip?: string }).ip;
      if (ip) return ip;
    }
  } catch (error: unknown) {
    console.error('Error extracting IP from request:', error);
  }
  
  return getRequestIdentifier(); // Fall back to our basic identification
}

/**
 * Rate limiting middleware for API routes
 * @param identifier Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param rateLimitKey Key to identify the type of rate limit
 * @returns NextResponse if rate limit exceeded, null otherwise
 */
export async function rateLimit(
  identifier: string, 
  rateLimitKey: keyof typeof DEFAULT_RATE_LIMITS = 'api-general'
): Promise<NextResponse | null> {
  const { limit, window } = DEFAULT_RATE_LIMITS[rateLimitKey];
  const key = `rate-limit:${rateLimitKey}:${identifier}`;
  
  // Use Redis if configured, otherwise fall back to memory store
  if (redis) {
    try {
      // Get current count
      const count = await redis.incr(key);
      
      // Set expiration on first request
      if (count === 1) {
        await redis.expire(key, window);
      }
      
      // Get remaining TTL
      const ttl = await redis.ttl(key);
      
      // Set rate limit headers
      const responseHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, limit - count).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + ttl * 1000).toUTCString(),
      };
      
      // If limit exceeded, return error response with headers
      if (count > limit) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Rate limit exceeded. Please try again later.' 
          },
          { 
            status: 429,
            headers: {
              ...responseHeaders,
              'Retry-After': ttl.toString(),
            },
          }
        );
      }
    } catch (error: unknown) {
      console.error('Rate limiting error:', error);
      // Continue on error rather than blocking legitimate requests
    }
  } 
  // Memory store fallback (for development)
  else {
    const now = Date.now();
    const record = memoryStore[key];
    
    // Clean up expired records
    if (record && record.expires < now) {
      delete memoryStore[key];
    }
    
    // Initialize or increment
    if (!memoryStore[key]) {
      memoryStore[key] = { count: 1, expires: now + window * 1000 };
    } else {
      memoryStore[key].count++;
    }
    
    // Check if limit exceeded
    if (memoryStore[key].count > limit) {
      const ttl = Math.ceil((memoryStore[key].expires - now) / 1000);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rate limit exceeded. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(memoryStore[key].expires).toUTCString(),
            'Retry-After': ttl.toString(),
          },
        }
      );
    }
  }
  
  // If we got here, rate limit was not exceeded
  return null;
}
