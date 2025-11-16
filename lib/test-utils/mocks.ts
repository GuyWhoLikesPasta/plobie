import { vi } from 'vitest';

// Mock Supabase Client
export const createMockSupabaseClient = () => {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
};

// Mock Stripe
export const createMockStripe = () => {
  return {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
          payment_intent: 'pi_test_123',
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn((body: string, sig: string, secret: string) => ({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_intent: 'pi_test_123',
            metadata: { order_id: 'order_test_123' },
          },
        },
      })),
    },
  };
};

// Mock User for Tests
export const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

// Mock Profile
export const mockProfile = {
  id: 'profile_123',
  user_id: 'user_123',
  username: 'testuser',
  avatar_url: null,
  xp_total: 0,
  is_admin: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Product
export const mockProduct = {
  id: 'product_123',
  name: 'Test Pot',
  description: 'A test pottery product',
  stripe_product_id: 'prod_test_123',
  featured: true,
  category: 'pottery',
  created_at: new Date().toISOString(),
};

// Mock Product Variant
export const mockVariant = {
  id: 'variant_123',
  product_id: 'product_123',
  sku: 'TEST-MD-TER',
  size: 'medium',
  color: 'terracotta',
  price_cents: 1800,
  stripe_price_id: 'price_test_123',
  stock_qty: 50,
  created_at: new Date().toISOString(),
};

// Mock Pot
export const mockPot = {
  id: 'pot_123',
  code: 'TEST001',
  design: 'classic',
  size: 'medium',
  created_at: new Date().toISOString(),
};

