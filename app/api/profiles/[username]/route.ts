/**
 * GET /api/profiles/[username]
 *
 * Get a user's profile data including posts, stats, and XP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';
import { levelFromTotalXp } from '@/lib/xp-engine';

function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    post: 'post',
    comment: 'comment',
    claim: 'claim',
    article_read: 'article',
    game_session: 'game',
    game_action: 'game',
    admin_award: 'award',
    achievement_bonus: 'achievement',
    daily_login: 'login',
  };
  return icons[actionType] || 'default';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse<ApiResponse<{ profile: any; posts: any[]; stats: any; activity: any[] }>>> {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername);

    const supabase = await createServerSupabaseClient();

    // Get profile (case-insensitive lookup)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Get XP balance
    const { data: xpBalance } = await supabase
      .from('xp_balances')
      .select('total_xp')
      .eq('profile_id', profile.id)
      .single();

    // Calculate level from total XP using tiered formula
    const totalXp = xpBalance?.total_xp || 0;
    const level = levelFromTotalXp(totalXp);

    // Get user's posts (no FK joins, manual enrichment)
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', profile.id)
      .or('hidden.is.null,hidden.eq.false')
      .order('created_at', { ascending: false })
      .limit(20);

    // Enrich posts with comment counts
    if (posts && posts.length > 0) {
      const postIds = posts.map((p: any) => p.id);
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds);

      const commentCountMap = (commentCounts || []).reduce(
        (acc: Record<string, number>, c: any) => {
          acc[c.post_id] = (acc[c.post_id] || 0) + 1;
          return acc;
        },
        {}
      );

      const { data: reactionCounts } = await supabase
        .from('post_reactions')
        .select('post_id')
        .in('post_id', postIds)
        .eq('reaction_type', 'like');

      const reactionCountMap = (reactionCounts || []).reduce(
        (acc: Record<string, number>, r: any) => {
          acc[r.post_id] = (acc[r.post_id] || 0) + 1;
          return acc;
        },
        {}
      );

      posts.forEach((post: any) => {
        post.comments = [{ count: commentCountMap[post.id] || 0 }];
        post.reactions = [{ count: reactionCountMap[post.id] || 0 }];
      });
    }

    // Get stats
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .or('hidden.is.null,hidden.eq.false');

    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    const { count: potCount } = await supabase
      .from('pot_claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // Get recent XP activity
    const { data: recentActivity } = await supabase
      .from('xp_events')
      .select('id, action_type, xp_amount, description, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get earned achievements count
    const { count: achievementCount } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    const stats = {
      posts: postCount || 0,
      comments: commentCount || 0,
      pots: potCount || 0,
      achievements: achievementCount || 0,
      xp: totalXp,
      level: level,
    };

    // Format activity with icons
    const activityWithIcons = (recentActivity || []).map(event => ({
      ...event,
      icon: getActionIcon(event.action_type),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          profile: {
            ...profile,
            ...stats,
          },
          posts: posts || [],
          activity: activityWithIcons,
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch profile',
        },
      },
      { status: 500 }
    );
  }
}
