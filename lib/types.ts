import { z } from 'zod';

// Database types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  xp_total: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Pot = {
  id: string;
  code: string;
  design: string | null;
  size: string | null;
  created_at: string;
};

export type PotClaim = {
  id: string;
  pot_id: string;
  user_id: string;
  xp_awarded: number;
  claimed_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string | null;
  featured: boolean;
  category: string;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_cents: number;
  stripe_price_id: string | null;
  stock_qty: number;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_cents: number;
  shipping_address: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string | null;
  quantity: number;
  price_cents: number;
  created_at: string;
};

export type XPEvent = {
  id: string;
  user_id: string;
  action_type: XPActionType;
  amount: number;
  metadata: Record<string, any>;
  created_at: string;
};

export type XPBalance = {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  group_slug: string;
  content: string;
  image_url: string | null;
  hidden: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  hidden: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  entity_type: 'post' | 'comment' | 'profile';
  entity_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
};

export type GameSession = {
  id: string;
  user_id: string;
  game_slug: string;
  duration_minutes: number;
  xp_awarded: number;
  started_at: string;
};

export type FeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
};

// XP Action Types - Based on Connor's "Site XP Explained and Defined" doc
export type XPActionType =
  // My Plants
  | 'pot_claim' // 500 XP - Claim a new pot
  | 'pot_scan' // 200 XP - Scan another's pot
  | 'garden_care' // 25 XP - Daily garden interactions (cap 200/day)
  | 'neighbor_visit' // 50 XP - Visit neighbor (max 2/day)
  | 'neighbor_garden_care' // 40 XP - Care for neighbor's garden (cap 200/day)
  | 'plant_register' // 150 XP - Register a plant
  | 'garden_editor_first' // 150 XP - First time opening garden editor
  | 'true_neighbors' // 200 XP - Mutual garden care (1/day)
  | 'plant_week_1' // 100 XP - 7 days with plant
  | 'plant_month_1' // 300 XP - 30 days with plant
  | 'plant_anniversary' // 750 XP - Plant yearly anniversary
  // Hobbies
  | 'post_create' // 20 XP - Create a post
  | 'post_like_received' // 1 XP - Receive a like on post
  | 'post_comment_received' // 1 XP - Receive a comment
  | 'comment_create' // 2 XP - Comment on another's post
  | 'comment_like_received' // 1 XP - Receive like on comment
  | 'post_of_week' // 500 XP - Admin-awarded post of the week
  | 'learn_read' // 10 XP - Complete learn session
  // Games
  | 'game_new' // 10 XP - Load a new game
  | 'game_play_30m' // 20 XP - Play for 30 min block
  | 'game_session' // 2 XP per 30min - Legacy session tracking
  // Milestones
  | 'milestone_plants' // 200 XP - Plant collection milestones
  | 'milestone_stickers' // 80 XP - Sticker milestones
  | 'milestone_visits' // 300 XP - Garden visit milestones
  | 'taxonomy_collector' // 1000 XP - Collect all taxonomy classes
  | 'biome_collector' // 1000 XP - Collect all biomes
  // Legacy/Admin
  | 'pot_link' // 500 XP - Legacy pot linking
  | 'admin_adjust'; // Variable - Admin XP adjustment

// Zod Validators
export const CreateCheckoutSchema = z.object({
  variant_ids: z.array(z.string().uuid()).min(1).max(20),
  quantities: z.array(z.number().int().positive()).min(1).max(20),
});

export const ClaimTokenRequestSchema = z.object({
  code: z.string().min(6).max(20),
});

export const PotClaimSchema = z.object({
  claim_token: z.string().min(10),
});

export const CreatePostSchema = z.object({
  group_slug: z.string().min(1).max(50),
  content: z.string().min(1).max(5000),
  image_url: z.string().url().optional(),
});

export const CreateCommentSchema = z.object({
  post_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export const CreateReportSchema = z.object({
  entity_type: z.enum(['post', 'comment', 'profile']),
  entity_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export const RecordGameSessionSchema = z.object({
  game_slug: z.string().min(1).max(50),
  duration_minutes: z.number().int().positive().max(240),
});

// API Response Types
export type ApiSuccess<T = any> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
};

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

// Error Codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE: 'DUPLICATE',
  RATE_LIMIT: 'RATE_LIMIT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  POT_ALREADY_CLAIMED: 'POT_ALREADY_CLAIMED',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_CLAIM_TOKEN: 'INVALID_CLAIM_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  XP_DAILY_CAP_REACHED: 'XP_DAILY_CAP_REACHED',
} as const;
