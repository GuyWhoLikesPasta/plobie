import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { DAILY_TOTAL_CAP, levelFromTotalXp } from '@/lib/xp-engine';

// =====================================
// DEV: XP STATUS
// =====================================
// Get detailed XP status for testing
// ⚠️ ONLY WORKS IN DEVELOPMENT MODE

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get XP balance
    const { data: xpBalance, error: balanceError } = await adminSupabase
      .from('xp_balances')
      .select('total_xp, level')
      .eq('profile_id', user.id)
      .single();

    if (balanceError) {
      console.error('Error fetching XP balance:', balanceError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch XP balance' },
        { status: 500 }
      );
    }

    // Get today's XP events
    const today = new Date().toISOString().split('T')[0];
    const { data: todayEvents, error: eventsError } = await adminSupabase
      .from('xp_events')
      .select('action_type, xp_amount, created_at')
      .eq('profile_id', user.id)
      .eq('date', today);

    if (eventsError) {
      console.error('Error fetching XP events:', eventsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch XP events' },
        { status: 500 }
      );
    }

    // Calculate today's totals
    const todayTotal = todayEvents?.reduce((sum, e) => sum + e.xp_amount, 0) || 0;
    const gamesXPToday =
      todayEvents
        ?.filter(e => e.action_type === 'game_session')
        .reduce((sum, e) => sum + e.xp_amount, 0) || 0;
    const sessionsToday = todayEvents?.filter(e => e.action_type === 'game_session').length || 0;

    // Get today's game sessions
    const { data: sessions, error: sessionsError } = await adminSupabase
      .from('game_sessions')
      .select('id, started_at, ended_at, duration_minutes, xp_earned, status')
      .eq('user_id', user.id)
      .gte('started_at', today);

    if (sessionsError) {
      console.error('Error fetching game sessions:', sessionsError);
    }

    return NextResponse.json({
      success: true,
      xp_status: {
        total_xp: xpBalance.total_xp,
        level: levelFromTotalXp(xpBalance.total_xp),
        today_total: todayTotal,
        today_cap: DAILY_TOTAL_CAP,
        today_remaining: Math.max(0, DAILY_TOTAL_CAP - todayTotal),
        games_xp_today: gamesXPToday,
        games_cap: 6, // 6 x 30-min blocks = 120 XP/day from games
        games_remaining: Math.max(0, 6 - gamesXPToday),
        sessions_today: sessionsToday,
        sessions_cap: 6,
        sessions_remaining: Math.max(0, 6 - sessionsToday),
      },
      today_events: todayEvents,
      today_sessions: sessions || [],
    });
  } catch (error) {
    console.error('Error in GET /api/dev/xp-status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
