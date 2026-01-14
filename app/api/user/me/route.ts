import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { levelFromTotalXp, xpProgressInLevel, DAILY_TOTAL_CAP } from '@/lib/xp-engine';

// =====================================
// USER PROFILE API
// =====================================
// Get current user's profile information
// Useful for Unity to display username, avatar, level, etc.

// =====================================
// GET - Get Current User Profile
// =====================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, is_admin, created_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Get user's XP balance
    const { data: xpBalance } = await supabase
      .from('xp_balances')
      .select('total_xp, daily_xp')
      .eq('profile_id', profile.id)
      .single();

    const totalXp = xpBalance?.total_xp || 0;
    const dailyXp = xpBalance?.daily_xp || 0;
    const level = levelFromTotalXp(totalXp);
    const progress = xpProgressInLevel(totalXp);
    const xpForNextLevel = progress.required;
    const xpProgress = progress.current;

    // Get user's pot count
    const { count: potCount } = await supabase
      .from('pot_claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // Get user's post count
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .eq('hidden', false);

    // Get user's comment count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin,
        joined_at: profile.created_at,
      },
      xp: {
        total_xp: totalXp,
        daily_xp: dailyXp,
        level: level,
        xp_for_next_level: xpForNextLevel,
        xp_progress: xpProgress, // XP earned within current level
        remaining_today: Math.max(0, DAILY_TOTAL_CAP - dailyXp),
      },
      stats: {
        pots: potCount || 0,
        posts: postCount || 0,
        comments: commentCount || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/me:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
