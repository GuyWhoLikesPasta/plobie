import { XPActionType } from './types';
import { createAdminClient } from './supabase';

// =====================================================
// XP SYSTEM - Based on Connor's "Site XP Explained and Defined" doc
// =====================================================
// Leveling Curve:
// - Tier 1 (L1-50): 150 + 17*(L-1) XP per level, ~3 months consistent play
// - Tier 2 (L50-100): 1000 + 30*(L-50) XP per level, ~8 months total
// - Tier 3 (L100-250): 2500 + 40*(L-100) XP per level, ~4 years total
// =====================================================

// XP Rules Configuration - Updated to match Connor's specs
export const XP_RULES = {
  // My Plants
  pot_claim: { base: 500, dailyCap: null, cooldown: 'once per pot' },
  pot_scan: { base: 200, dailyCap: null, cooldown: 'once per pot' },
  garden_care: { base: 25, dailyCap: 8, cooldown: null }, // Cap 200/day = 8 actions
  neighbor_visit: { base: 50, dailyCap: 2, cooldown: null },
  neighbor_garden_care: { base: 40, dailyCap: 5, cooldown: null }, // Cap 200/day
  plant_register: { base: 150, dailyCap: null, cooldown: 'once per plant' },
  garden_editor_first: { base: 150, dailyCap: null, cooldown: 'once' },
  true_neighbors: { base: 200, dailyCap: 1, cooldown: null },
  plant_week_1: { base: 100, dailyCap: null, cooldown: 'once per plant' },
  plant_month_1: { base: 300, dailyCap: null, cooldown: 'once per plant' },
  plant_anniversary: { base: 750, dailyCap: null, cooldown: 'once per plant per year' },

  // Hobbies
  post_create: { base: 20, dailyCap: 10, cooldown: null },
  post_like_received: { base: 1, dailyCap: 50, cooldown: null },
  post_comment_received: { base: 1, dailyCap: 50, cooldown: null },
  comment_create: { base: 2, dailyCap: 20, cooldown: null },
  comment_like_received: { base: 1, dailyCap: 50, cooldown: null },
  post_of_week: { base: 500, dailyCap: null, cooldown: 'admin award' },
  learn_read: { base: 10, dailyCap: 10, cooldown: '1 day per article' },

  // Games
  game_new: { base: 10, dailyCap: 5, cooldown: 'once per game' },
  game_play_30m: { base: 20, dailyCap: 6, cooldown: '30 min blocks' }, // ~2 hrs max
  game_session: { base: 2, dailyCap: 6, cooldown: '30 min blocks' }, // Legacy support

  // Milestones (awarded by system)
  milestone_plants: { base: 200, dailyCap: null, cooldown: 'milestone' },
  milestone_stickers: { base: 80, dailyCap: null, cooldown: 'milestone' },
  milestone_visits: { base: 300, dailyCap: null, cooldown: 'milestone' },
  taxonomy_collector: { base: 1000, dailyCap: null, cooldown: 'once' },
  biome_collector: { base: 1000, dailyCap: null, cooldown: 'once' },

  // Admin
  admin_adjust: { base: null, dailyCap: null, cooldown: null },

  // Legacy support
  pot_link: { base: 500, dailyCap: null, cooldown: 'once per pot' },
} as const;

// Daily cap: 3000 XP per Connor's spec
export const DAILY_TOTAL_CAP = 3000;

// Max level
export const MAX_LEVEL = 250;

/**
 * Calculate XP required to go from level L to L+1
 * Based on Connor's tiered formula
 */
export function xpForNextLevel(level: number): number {
  if (level < 1) return 150;
  if (level >= MAX_LEVEL) return Infinity;

  if (level < 50) {
    // Tier 1: Levels 1-49
    return 150 + 17 * (level - 1);
  } else if (level < 100) {
    // Tier 2: Levels 50-99
    return 1000 + 30 * (level - 50);
  } else {
    // Tier 3: Levels 100-249
    return 2500 + 40 * (level - 100);
  }
}

/**
 * Calculate total XP needed to reach a given level from level 1
 */
export function totalXpForLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;

  let total = 0;
  for (let l = 1; l < targetLevel; l++) {
    total += xpForNextLevel(l);
  }
  return total;
}

/**
 * Calculate level from total XP
 */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  let xpUsed = 0;

  while (level < MAX_LEVEL) {
    const needed = xpForNextLevel(level);
    if (xpUsed + needed > totalXp) break;
    xpUsed += needed;
    level++;
  }

  return level;
}

/**
 * Get XP progress within current level
 */
export function xpProgressInLevel(totalXp: number): {
  current: number;
  required: number;
  percentage: number;
} {
  const level = levelFromTotalXp(totalXp);
  const xpAtLevelStart = totalXpForLevel(level);
  const xpForNext = xpForNextLevel(level);
  const current = totalXp - xpAtLevelStart;

  return {
    current,
    required: xpForNext,
    percentage: Math.min(100, Math.round((current / xpForNext) * 100)),
  };
}

/**
 * Apply XP for a user action with daily caps and cooldowns
 */
export async function applyXP(
  userId: string,
  actionType: XPActionType,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; xp_awarded: number; new_balance: number; error?: string }> {
  const supabase = createAdminClient();
  const rule = XP_RULES[actionType as keyof typeof XP_RULES];

  // Check if action type exists
  if (!rule) {
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Invalid action type' };
  }

  // Get today's XP events for this user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayEvents, error: eventsError } = await supabase
    .from('xp_events')
    .select('action_type, xp_amount, metadata')
    .eq('profile_id', userId)
    .gte('created_at', startOfDay.toISOString());

  if (eventsError) {
    console.error('Error fetching XP events:', eventsError);
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Database error' };
  }

  // Check daily cap for this action type
  if (rule.dailyCap !== null) {
    const actionCount = todayEvents?.filter(e => e.action_type === actionType).length || 0;
    if (actionCount >= rule.dailyCap) {
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'XP_ACTION_CAP_REACHED' };
    }
  }

  // Check daily total cap
  const todayTotal = todayEvents?.reduce((sum, e) => sum + (e.xp_amount || 0), 0) || 0;
  if (todayTotal >= DAILY_TOTAL_CAP) {
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'XP_DAILY_TOTAL_CAP_REACHED' };
  }

  // Check cooldowns (simplified - expand as needed)
  if (actionType === 'learn_read' && metadata.article_id) {
    const alreadyRead = todayEvents?.some(
      e => e.action_type === 'learn_read' && e.metadata?.article_id === metadata.article_id
    );
    if (alreadyRead) {
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'Article already read today' };
    }
  }

  // Determine XP amount
  const amount = actionType === 'admin_adjust' ? metadata.amount || 0 : rule.base!;

  // Cap amount to not exceed daily limit
  const cappedAmount = Math.min(amount, DAILY_TOTAL_CAP - todayTotal);

  try {
    // Call stored procedure to apply XP atomically
    const { data: xpData, error: applyError } = await supabase.rpc('apply_xp', {
      p_profile_id: userId,
      p_action_type: actionType,
      p_xp_amount: cappedAmount,
      p_description: metadata.description || null,
      p_reference_id: metadata.reference_id || null,
    });

    if (applyError) {
      console.error('Error applying XP:', applyError);
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'Failed to apply XP' };
    }

    const result = (xpData as any[])?.[0];

    return {
      success: true,
      xp_awarded: result?.xp_awarded || cappedAmount,
      new_balance: result?.new_total_xp || 0,
    };
  } catch (error) {
    console.error('Error in applyXP:', error);
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Internal error' };
  }
}

/**
 * Get user's current XP balance and level info
 */
export async function getUserXP(userId: string): Promise<{
  total_xp: number;
  daily_xp: number;
  level: number;
  xp_for_next_level: number;
  xp_progress: number;
  remaining_today: number;
}> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('xp_balances')
    .select('total_xp, daily_xp')
    .eq('profile_id', userId)
    .single();

  const totalXp = data?.total_xp || 0;
  const dailyXp = data?.daily_xp || 0;
  const level = levelFromTotalXp(totalXp);
  const progress = xpProgressInLevel(totalXp);

  return {
    total_xp: totalXp,
    daily_xp: dailyXp,
    level,
    xp_for_next_level: progress.required,
    xp_progress: progress.current,
    remaining_today: Math.max(0, DAILY_TOTAL_CAP - dailyXp),
  };
}

/**
 * Get user's XP history
 */
export async function getUserXPHistory(userId: string, limit: number = 50) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('xp_events')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching XP history:', error);
    return [];
  }

  return data || [];
}
