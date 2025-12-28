/**
 * GET /api/my-plants
 *
 * Get current user's claimed pots and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ pots: any[]; stats: any }>>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in',
          },
        },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single();

    if (!profile) {
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

    // Get claimed pots
    const { data: claims } = await supabase
      .from('pot_claims')
      .select(
        `
        *,
        pots:pot_id (
          id,
          pot_code,
          design,
          size
        )
      `
      )
      .eq('profile_id', profile.id)
      .order('claimed_at', { ascending: false });

    // Get XP balance
    const { data: xpBalance } = await supabase
      .from('xp_balances')
      .select('total_xp, level')
      .eq('profile_id', profile.id)
      .single();

    // Get game sessions count
    const { count: sessionCount } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profile.id);

    // Get total XP from pots
    const potXP = (claims?.length || 0) * 50;

    const stats = {
      totalPots: claims?.length || 0,
      totalXP: xpBalance?.total_xp || 0,
      level: xpBalance?.level || 1,
      gameSessions: sessionCount || 0,
      potXP,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          pots: claims || [],
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('My plants fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch my plants data',
        },
      },
      { status: 500 }
    );
  }
}
