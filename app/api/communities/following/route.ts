/**
 * Community Following API
 *
 * GET /api/communities/following - List communities the current user follows (requires auth)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

export async function GET(): Promise<NextResponse<ApiResponse<{ communities: string[] }>>> {
  try {
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
            message: 'You must be logged in to view followed communities',
          },
        },
        { status: 401 }
      );
    }

    const { data: follows, error } = await supabase
      .from('community_follows')
      .select('community_slug')
      .eq('profile_id', user.id);

    if (error) {
      console.error('Community following fetch error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to fetch followed communities: ${error.message || error.code || 'Unknown error'}`,
            details: error,
          },
        },
        { status: 500 }
      );
    }

    const communities = (follows || []).map((f: { community_slug: string }) => f.community_slug);

    return NextResponse.json(
      {
        success: true,
        data: { communities },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Community following fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch followed communities',
        },
      },
      { status: 500 }
    );
  }
}
