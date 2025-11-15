import { XPActionType } from './types';
import { createAdminClient } from './supabase';

// XP Rules Configuration
export const XP_RULES = {
  post_create: { base: 3, dailyCap: 5, cooldown: null },
  comment_create: { base: 1, dailyCap: 10, cooldown: null },
  learn_read: { base: 1, dailyCap: 5, cooldown: '1 day per article' },
  game_play_30m: { base: 2, dailyCap: 4, cooldown: '30 min blocks' },
  pot_link: { base: 50, dailyCap: null, cooldown: 'once per pot' },
  admin_adjust: { base: null, dailyCap: null, cooldown: null },
} as const;

export const DAILY_TOTAL_CAP = 100;

/**
 * Apply XP for a user action with daily caps and cooldowns
 */
export async function applyXP(
  userId: string,
  actionType: XPActionType,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; xp_awarded: number; new_balance: number; error?: string }> {
  const supabase = createAdminClient();
  const rule = XP_RULES[actionType];

  // Check if action type exists
  if (!rule) {
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Invalid action type' };
  }

  // Get today's XP events for this user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayEvents, error: eventsError } = await supabase
    .from('xp_events')
    .select('action_type, amount, metadata')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());

  if (eventsError) {
    console.error('Error fetching XP events:', eventsError);
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Database error' };
  }

  // Check daily cap for this action type
  if (rule.dailyCap !== null) {
    const actionCount = todayEvents?.filter(e => e.action_type === actionType).length || 0;
    if (actionCount >= rule.dailyCap) {
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'XP_DAILY_CAP_REACHED' };
    }
  }

  // Check daily total cap
  const todayTotal = todayEvents?.reduce((sum, e) => sum + e.amount, 0) || 0;
  if (todayTotal >= DAILY_TOTAL_CAP) {
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'XP_DAILY_TOTAL_CAP_REACHED' };
  }

  // Check cooldowns (simplified - expand as needed)
  if (actionType === 'learn_read' && metadata.article_id) {
    const alreadyRead = todayEvents?.some(
      e => e.action_type === 'learn_read' && e.metadata.article_id === metadata.article_id
    );
    if (alreadyRead) {
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'Article already read today' };
    }
  }

  // Determine XP amount
  const amount = actionType === 'admin_adjust' 
    ? (metadata.amount || 0) 
    : rule.base!;

  try {
    // Call stored procedure to apply XP atomically
    const { error: applyError } = await supabase.rpc('apply_xp', {
      p_user: userId,
      p_amount: amount,
      p_action: actionType,
      p_metadata: metadata,
    });

    if (applyError) {
      console.error('Error applying XP:', applyError);
      return { success: false, xp_awarded: 0, new_balance: 0, error: 'Failed to apply XP' };
    }

    // Get updated balance
    const { data: balance } = await supabase
      .from('xp_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    return {
      success: true,
      xp_awarded: amount,
      new_balance: balance?.balance || amount,
    };
  } catch (error) {
    console.error('Error in applyXP:', error);
    return { success: false, xp_awarded: 0, new_balance: 0, error: 'Internal error' };
  }
}

/**
 * Get user's current XP balance
 */
export async function getUserXP(userId: string): Promise<number> {
  const supabase = createAdminClient();
  
  const { data } = await supabase
    .from('xp_balances')
    .select('balance')
    .eq('user_id', userId)
    .single();

  return data?.balance || 0;
}

/**
 * Get user's XP history
 */
export async function getUserXPHistory(userId: string, limit: number = 50) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching XP history:', error);
    return [];
  }

  return data || [];
}

