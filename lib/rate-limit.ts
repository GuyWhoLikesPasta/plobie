/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for MVP.
 * TODO: Upgrade to Upstash Redis for production multi-instance deployment.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Check if request is allowed under rate limit
   * @param key - Unique identifier (IP, user ID, etc.)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests and reset time
   */
  getStatus(key: string): { remaining: number; resetAt: number; limit: number } {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || entry.resetAt <= now) {
      return { remaining: 0, resetAt: now, limit: 0 };
    }

    return {
      remaining: Math.max(0, entry.count),
      resetAt: entry.resetAt,
      limit: entry.count,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear cleanup interval (for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Pre-configured rate limiters for common use cases
export const RateLimits = {
  /**
   * QR claim token generation: 5 requests per minute per IP
   */
  claimToken: (identifier: string) => rateLimiter.check(`claim-token:${identifier}`, 5, 60 * 1000),

  /**
   * QR claim execution: 3 claims per hour per user
   */
  claimExecution: (userId: string) => rateLimiter.check(`claim-exec:${userId}`, 3, 60 * 60 * 1000),

  /**
   * Post creation: 10 posts per hour per user
   */
  postCreate: (userId: string) => rateLimiter.check(`post-create:${userId}`, 10, 60 * 60 * 1000),

  /**
   * Comment creation: 30 comments per hour per user
   */
  commentCreate: (userId: string) =>
    rateLimiter.check(`comment-create:${userId}`, 30, 60 * 60 * 1000),

  /**
   * Checkout: 10 checkout attempts per hour per user
   */
  checkout: (userId: string) => rateLimiter.check(`checkout:${userId}`, 10, 60 * 60 * 1000),

  /**
   * Gift card purchase: 5 purchases per hour per user
   */
  giftCardPurchase: (userId: string) => rateLimiter.check(`gift-card:${userId}`, 5, 60 * 60 * 1000),

  /**
   * Generic rate limit check
   */
  check: (key: string, limit: number, windowMs: number) => rateLimiter.check(key, limit, windowMs),

  /**
   * Get rate limit status
   */
  getStatus: (key: string) => rateLimiter.getStatus(key),

  /**
   * Reset rate limit
   */
  reset: (key: string) => rateLimiter.reset(key),
};

export default rateLimiter;
