/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL is set (production).
 * Falls back to in-memory rate limiter for local development.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------- Upstash Redis (production) ----------

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (hasUpstash) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

function createUpstashLimiter(limit: number, windowSeconds: number) {
  return new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: 'plobie-ratelimit',
  });
}

// ---------- In-memory fallback (development) ----------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

const memoryLimiter = new InMemoryRateLimiter();

// ---------- Unified rate limit checker ----------

async function checkLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (hasUpstash && redis) {
    const limiter = createUpstashLimiter(limit, Math.floor(windowMs / 1000));
    const { success } = await limiter.limit(key);
    return success;
  }
  return memoryLimiter.check(key, limit, windowMs);
}

// ---------- Pre-configured rate limiters ----------

export const RateLimits = {
  /** QR claim token generation: 5 requests per minute per IP */
  claimToken: (identifier: string) => checkLimit(`claim-token:${identifier}`, 5, 60 * 1000),

  /** QR claim execution: 3 claims per hour per user */
  claimExecution: (userId: string) => checkLimit(`claim-exec:${userId}`, 3, 60 * 60 * 1000),

  /** Post creation: 10 posts per hour per user */
  postCreate: (userId: string) => checkLimit(`post-create:${userId}`, 10, 60 * 60 * 1000),

  /** Comment creation: 30 comments per hour per user */
  commentCreate: (userId: string) => checkLimit(`comment-create:${userId}`, 30, 60 * 60 * 1000),

  /** Checkout: 10 checkout attempts per hour per user */
  checkout: (userId: string) => checkLimit(`checkout:${userId}`, 10, 60 * 60 * 1000),

  /** Gift card purchase: 5 purchases per hour per user */
  giftCardPurchase: (userId: string) => checkLimit(`gift-card:${userId}`, 5, 60 * 60 * 1000),

  /** Generic rate limit check */
  check: (key: string, limit: number, windowMs: number) => checkLimit(key, limit, windowMs),

  /** Reset rate limit (in-memory only, no-op for Upstash) */
  reset: (key: string) => memoryLimiter.reset(key),
};

export default memoryLimiter;
