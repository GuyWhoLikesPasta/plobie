/**
 * POST /api/xp/award
 *
 * Award XP to a user for completing an action.
 * Enforces daily caps, per-action caps, and cooldowns via stored procedure.
 *
 * This endpoint should be called from server-side code only (not exposed to clients).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';
import { trackEvent, GA4_EVENTS } from '@/lib/analytics';

const RequestSchema = z.object({
  profile_id: z.string().uuid(),
  action_type: z.enum([
    'post_create',
    'comment_create',
    'learn_read',
    'game_play_30m',
    'pot_link',
    'admin_adjust',
  ]),
  amount: z.number().int().optional(), // Only used for admin_adjust
  description: z.string().optional(),
  reference_id: z.string().uuid().optional(),
});

type XPAwardResult = {
  success: boolean;
  xp_awarded: number;
  reason: string;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ xp_awarded: number; new_total: number }>>> {
  try {
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

    const { profile_id, action_type, amount, description, reference_id } = validation.data;

    // Validate amount for admin_adjust
    if (action_type === 'admin_adjust' && amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Amount is required for admin_adjust action type',
          },
        },
        { status: 400 }
      );
    }

    // Call stored procedure using admin client (service role)
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile_id,
      p_action_type: action_type,
      p_xp_amount: amount || 0,
      p_description: description || null,
      p_reference_id: reference_id || null,
    });

    if (error) {
      console.error('XP stored procedure error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to award XP',
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // Parse result from stored procedure
    const result = data as unknown as XPAwardResult[];
    const xpResult = result[0];

    if (!xpResult.success) {
      // Cap reached or other reason
      return NextResponse.json(
        {
          success: false,
          error: {
            code: xpResult.reason.includes('cap')
              ? ErrorCodes.XP_DAILY_CAP_REACHED
              : ErrorCodes.VALIDATION_ERROR,
            message: xpResult.reason,
          },
        },
        { status: 400 }
      );
    }

    // Get updated balance
    const { data: balance } = await adminSupabase
      .from('xp_balances')
      .select('total_xp')
      .eq('profile_id', profile_id)
      .single();

    // Track analytics event
    trackEvent('xp_awarded', action_type, xpResult.xp_awarded, balance?.total_xp || 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          xp_awarded: xpResult.xp_awarded,
          new_total: balance?.total_xp || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('XP award error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to award XP',
        },
      },
      { status: 500 }
    );
  }
}
