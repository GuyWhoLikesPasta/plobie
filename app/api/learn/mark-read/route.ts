/**
 * POST /api/learn/mark-read
 *
 * Mark a learn article as read and award +1 XP (first read only, cap 5/day)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const RequestSchema = z.object({
  article_id: z.string().uuid(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ xp_awarded: number }>>> {
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
            message: 'You must be logged in to mark articles as read',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'User profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

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

    const { article_id } = validation.data;

    // Award XP for reading article (+1 XP, cap 5/day, no repeats)
    const adminSupabase = createAdminClient();
    const { data: xpData } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile.id,
      p_action_type: 'learn_read',
      p_amount: 1,
      p_reference_type: 'article',
      p_reference_id: article_id,
    });

    const xpResult = (xpData as unknown as any[])?.[0];

    if (!xpResult.success) {
      // Already read or cap reached
      return NextResponse.json(
        {
          success: false,
          error: {
            code: xpResult.reason.includes('cap')
              ? ErrorCodes.XP_DAILY_CAP_REACHED
              : ErrorCodes.ALREADY_EXISTS,
            message: xpResult.reason,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          xp_awarded: xpResult.xp_awarded,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to mark article as read',
        },
      },
      { status: 500 }
    );
  }
}
