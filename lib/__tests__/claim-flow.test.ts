import { describe, it, expect, beforeEach } from 'vitest';
import { generateClaimToken, verifyClaimToken, decodeClaimToken } from '../claim-tokens';
import { RateLimits } from '../rate-limit';

describe('Claim Token Generation', () => {
  it('should generate a valid JWT token', () => {
    const token = generateClaimToken('TEST001');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('should include pot_code in payload', () => {
    const token = generateClaimToken('TEST002');
    const decoded = decodeClaimToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded?.pot_code).toBe('TEST002');
  });

  it('should include expiration', () => {
    const token = generateClaimToken('TEST003');
    const decoded = decodeClaimToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded?.exp).toBeDefined();
    expect(decoded?.iat).toBeDefined();
  });
});

describe('Claim Token Verification', () => {
  it('should verify a valid token', () => {
    const token = generateClaimToken('DEMO123');
    const verified = verifyClaimToken(token);
    
    expect(verified).toBeDefined();
    expect(verified?.pot_code).toBe('DEMO123');
  });

  it('should reject an invalid token', () => {
    const verified = verifyClaimToken('invalid.token.here');
    expect(verified).toBeNull();
  });

  it('should reject a malformed token', () => {
    const verified = verifyClaimToken('not-a-jwt');
    expect(verified).toBeNull();
  });

  it('should reject an empty token', () => {
    const verified = verifyClaimToken('');
    expect(verified).toBeNull();
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    RateLimits.reset('test-ip-1');
    RateLimits.reset('test-user-1');
    RateLimits.reset('claim-token:test-ip-1');
    RateLimits.reset('claim-exec:test-user-1');
  });

  it('should allow requests within limit', () => {
    const allowed1 = RateLimits.check('test-ip-1', 5, 60000);
    const allowed2 = RateLimits.check('test-ip-1', 5, 60000);
    const allowed3 = RateLimits.check('test-ip-1', 5, 60000);
    
    expect(allowed1).toBe(true);
    expect(allowed2).toBe(true);
    expect(allowed3).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    // Make 5 requests (the limit)
    for (let i = 0; i < 5; i++) {
      RateLimits.check('test-ip-2', 5, 60000);
    }
    
    // 6th request should be blocked
    const blocked = RateLimits.check('test-ip-2', 5, 60000);
    expect(blocked).toBe(false);
  });

  it('should enforce claim token rate limit (5/min)', () => {
    // Make 5 token requests
    for (let i = 0; i < 5; i++) {
      const allowed = RateLimits.claimToken('192.168.1.1');
      expect(allowed).toBe(true);
    }
    
    // 6th should be blocked
    const blocked = RateLimits.claimToken('192.168.1.1');
    expect(blocked).toBe(false);
  });

  it('should enforce claim execution rate limit (3/hour)', () => {
    // Make 3 claims
    for (let i = 0; i < 3; i++) {
      const allowed = RateLimits.claimExecution('user-123');
      expect(allowed).toBe(true);
    }
    
    // 4th should be blocked
    const blocked = RateLimits.claimExecution('user-123');
    expect(blocked).toBe(false);
  });

  it('should isolate rate limits by key', () => {
    // Exhaust limit for user 1
    for (let i = 0; i < 3; i++) {
      RateLimits.claimExecution('user-a');
    }
    
    // User 2 should still be allowed
    const allowed = RateLimits.claimExecution('user-b');
    expect(allowed).toBe(true);
  });

  it('should reset after calling reset()', () => {
    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      RateLimits.check('test-reset', 5, 60000);
    }
    
    // Should be blocked
    expect(RateLimits.check('test-reset', 5, 60000)).toBe(false);
    
    // Reset
    RateLimits.reset('test-reset');
    
    // Should be allowed again
    expect(RateLimits.check('test-reset', 5, 60000)).toBe(true);
  });
});

describe('Post Creation Rate Limit', () => {
  beforeEach(() => {
    RateLimits.reset('post-create:user-123');
  });

  it('should allow 10 posts per hour', () => {
    for (let i = 0; i < 10; i++) {
      const allowed = RateLimits.postCreate('user-123');
      expect(allowed).toBe(true);
    }
    
    // 11th should be blocked
    const blocked = RateLimits.postCreate('user-123');
    expect(blocked).toBe(false);
  });
});

describe('Comment Creation Rate Limit', () => {
  beforeEach(() => {
    RateLimits.reset('comment-create:user-456');
  });

  it('should allow 30 comments per hour', () => {
    for (let i = 0; i < 30; i++) {
      const allowed = RateLimits.commentCreate('user-456');
      expect(allowed).toBe(true);
    }
    
    // 31st should be blocked
    const blocked = RateLimits.commentCreate('user-456');
    expect(blocked).toBe(false);
  });
});

