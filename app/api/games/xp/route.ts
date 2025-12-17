import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// =====================================
// GAME XP API
// =====================================
// Award XP for specific in-game actions

// Request schema
const AwardXPSchema = z.object({
  action: z.string().min(1).max(50),
  xp_amount: z.number().int().min(1).max(100), // Reasonable per-action limit
  metadata: z.record(z.string(), z.any()).optional(),
});

// =====================================
// POST - Award Action XP
// =====================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = AwardXPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { action, xp_amount, metadata } = validation.data;

    // Get user's profile
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Award XP using stored procedure
    const { data: xpData, error: xpError } = await adminSupabase.rpc(
      'apply_xp',
      {
        p_profile_id: profile.id,
        p_action_type: action,
        p_base_amount: xp_amount,
        p_metadata_json: JSON.stringify(metadata || {}),
        p_reference_id: null,
      }
    );

    if (xpError) {
      console.error('Error applying XP:', xpError);
      return NextResponse.json(
        { success: false, error: 'Failed to award XP' },
        { status: 500 }
      );
    }

    if (!xpData || xpData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'XP award returned no data' },
        { status: 500 }
      );
    }

    const result = xpData[0];

    return NextResponse.json({
      success: true,
      xp_result: {
        awarded: result.awarded_xp,
        capped: result.capped,
        new_total_xp: result.new_total_xp,
        new_level: result.new_level,
        level_up: result.level_up,
        remaining_today: result.remaining_today,
      },
      message:
        result.awarded_xp > 0
          ? `Awarded ${result.awarded_xp} XP for ${action}`
          : result.capped
            ? 'Daily XP cap reached'
            : 'No XP awarded',
    });
  } catch (error) {
    console.error('Error in POST /api/games/xp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

