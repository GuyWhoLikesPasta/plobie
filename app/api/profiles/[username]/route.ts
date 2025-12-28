/**
 * GET /api/profiles/[username]
 *
 * Get a user's profile data including posts, stats, and XP
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<NextResponse<ApiResponse<{ profile: any; posts: any[]; stats: any }>>> {
  try {
    const { username } = await params;

    const supabase = await createServerSupabaseClient();

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
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

    // Calculate level from total XP (100 XP per level)
    const totalXp = xpBalance?.total_xp || 0;
    const level = Math.floor(totalXp / 100) + 1;

    // Get user's posts
    const { data: posts } = await supabase
      .from('posts')
      .select(
        `
        *,
        comments(count)
      `
      )
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get stats
    const { count: postCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id);

    const { count: potCount } = await supabase
      .from('pot_claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    const stats = {
      posts: postCount || 0,
      comments: commentCount || 0,
      pots: potCount || 0,
      xp: totalXp,
      level: level,
    };

    // Profile doesn't have sensitive fields to remove (id is public)

    return NextResponse.json(
      {
        success: true,
        data: {
          profile: {
            ...profile,
            ...stats,
          },
          posts: posts || [],
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
