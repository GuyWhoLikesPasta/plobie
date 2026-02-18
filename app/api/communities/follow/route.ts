/**
 * Community Follow API
 *
 * POST   /api/communities/follow - Follow a community (requires auth)
 * DELETE /api/communities/follow - Unfollow a community (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const FollowBodySchema = z.object({
  community_slug: z.string().min(1, 'community_slug must be a non-empty string'),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ followed: boolean }>>> {
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
            message: 'You must be logged in to follow a community',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = FollowBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { community_slug } = validation.data;

    const { error: insertError } = await supabase.from('community_follows').insert({
      profile_id: user.id,
      community_slug,
    });

    if (insertError) {
      // Handle duplicate (already following)
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            success: true,
            data: { followed: true },
          },
          { status: 201 }
        );
      }
      console.error('Community follow error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to follow community: ${insertError.message || insertError.code || 'Unknown error'}`,
            details: insertError,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { followed: true },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Community follow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to follow community',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ unfollowed: boolean }>>> {
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
            message: 'You must be logged in to unfollow a community',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = FollowBodySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { community_slug } = validation.data;

    const { error: deleteError } = await supabase
      .from('community_follows')
      .delete()
      .eq('profile_id', user.id)
      .eq('community_slug', community_slug);

    if (deleteError) {
      console.error('Community unfollow error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to unfollow community: ${deleteError.message || deleteError.code || 'Unknown error'}`,
            details: deleteError,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { unfollowed: true },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Community unfollow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to unfollow community',
        },
      },
      { status: 500 }
    );
  }
}
