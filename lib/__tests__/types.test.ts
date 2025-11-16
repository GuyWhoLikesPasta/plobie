import { describe, it, expect } from 'vitest';
import {
  CreateCheckoutSchema,
  ClaimTokenRequestSchema,
  PotClaimSchema,
  CreatePostSchema,
  CreateCommentSchema,
  CreateReportSchema,
  RecordGameSessionSchema,
  ErrorCodes,
} from '../types';

describe('Zod Schema Validation', () => {
  describe('CreateCheckoutSchema', () => {
    it('should validate valid checkout data', () => {
      const validData = {
        variant_ids: ['123e4567-e89b-12d3-a456-426614174000'],
        quantities: [1],
      };

      const result = CreateCheckoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty variant_ids', () => {
      const invalidData = {
        variant_ids: [],
        quantities: [1],
      };

      const result = CreateCheckoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        variant_ids: ['not-a-uuid'],
        quantities: [1],
      };

      const result = CreateCheckoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative quantities', () => {
      const invalidData = {
        variant_ids: ['123e4567-e89b-12d3-a456-426614174000'],
        quantities: [-1],
      };

      const result = CreateCheckoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject more than 20 items', () => {
      const invalidData = {
        variant_ids: Array(21).fill('123e4567-e89b-12d3-a456-426614174000'),
        quantities: Array(21).fill(1),
      };

      const result = CreateCheckoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ClaimTokenRequestSchema', () => {
    it('should validate valid pot code', () => {
      const validData = { code: 'TEST001' };
      const result = ClaimTokenRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject codes shorter than 6 characters', () => {
      const invalidData = { code: 'ABC' };
      const result = ClaimTokenRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject codes longer than 20 characters', () => {
      const invalidData = { code: 'A'.repeat(21) };
      const result = ClaimTokenRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('PotClaimSchema', () => {
    it('should validate valid claim token', () => {
      const validData = { claim_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' };
      const result = PotClaimSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short tokens', () => {
      const invalidData = { claim_token: 'short' };
      const result = PotClaimSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreatePostSchema', () => {
    it('should validate valid post data', () => {
      const validData = {
        group_slug: 'indoor-plants',
        content: 'My new succulent is thriving!',
      };

      const result = CreatePostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate post with image', () => {
      const validData = {
        group_slug: 'succulents',
        content: 'Check out my collection',
        image_url: 'https://example.com/image.jpg',
      };

      const result = CreatePostSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidData = {
        group_slug: 'indoor-plants',
        content: '',
      };

      const result = CreatePostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 5000 characters', () => {
      const invalidData = {
        group_slug: 'indoor-plants',
        content: 'A'.repeat(5001),
      };

      const result = CreatePostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URL', () => {
      const invalidData = {
        group_slug: 'indoor-plants',
        content: 'Post with invalid image',
        image_url: 'not-a-url',
      };

      const result = CreatePostSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCommentSchema', () => {
    it('should validate valid comment data', () => {
      const validData = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Great post!',
      };

      const result = CreateCommentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid post_id UUID', () => {
      const invalidData = {
        post_id: 'not-a-uuid',
        content: 'Great post!',
      };

      const result = CreateCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const invalidData = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        content: '',
      };

      const result = CreateCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject content exceeding 2000 characters', () => {
      const invalidData = {
        post_id: '123e4567-e89b-12d3-a456-426614174000',
        content: 'A'.repeat(2001),
      };

      const result = CreateCommentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateReportSchema', () => {
    it('should validate valid report data', () => {
      const validData = {
        entity_type: 'post' as const,
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Inappropriate content',
      };

      const result = CreateReportSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all entity types', () => {
      const entityTypes = ['post', 'comment', 'profile'] as const;

      entityTypes.forEach(type => {
        const data = {
          entity_type: type,
          entity_id: '123e4567-e89b-12d3-a456-426614174000',
          reason: 'Test reason',
        };

        const result = CreateReportSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid entity type', () => {
      const invalidData = {
        entity_type: 'invalid',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Test',
      };

      const result = CreateReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject reason exceeding 500 characters', () => {
      const invalidData = {
        entity_type: 'post' as const,
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'A'.repeat(501),
      };

      const result = CreateReportSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('RecordGameSessionSchema', () => {
    it('should validate valid game session data', () => {
      const validData = {
        game_slug: 'plant-puzzle',
        duration_minutes: 30,
      };

      const result = RecordGameSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative duration', () => {
      const invalidData = {
        game_slug: 'plant-puzzle',
        duration_minutes: -10,
      };

      const result = RecordGameSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject duration exceeding 240 minutes', () => {
      const invalidData = {
        game_slug: 'plant-puzzle',
        duration_minutes: 300,
      };

      const result = RecordGameSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Error Codes', () => {
  it('should have all required error codes defined', () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.DUPLICATE).toBe('DUPLICATE');
    expect(ErrorCodes.RATE_LIMIT).toBe('RATE_LIMIT');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCodes.POT_ALREADY_CLAIMED).toBe('POT_ALREADY_CLAIMED');
    expect(ErrorCodes.INVALID_CLAIM_TOKEN).toBe('INVALID_CLAIM_TOKEN');
    expect(ErrorCodes.XP_DAILY_CAP_REACHED).toBe('XP_DAILY_CAP_REACHED');
  });
});

