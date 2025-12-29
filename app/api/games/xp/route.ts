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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // Award XP using stored procedure
    const { data: xpData, error: xpError } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile.id,
      p_action_type: action,
      p_xp_amount: xp_amount, // Fixed: was p_base_amount
      p_description: metadata ? JSON.stringify(metadata) : action, // Fixed: was p_metadata_json
      p_reference_id: null,
    });

    if (xpError) {
      console.error('Error applying XP:', xpError);
      return NextResponse.json({ success: false, error: 'Failed to award XP' }, { status: 500 });
    }

    const xpResult = (xpData as unknown as any[])?.[0];

    if (!xpResult) {
      return NextResponse.json(
        { success: false, error: 'XP award returned no data' },
        { status: 500 }
      );
    }

    const xpAwarded = xpResult.xp_awarded || 0; // Fixed: was awarded_xp
    const newTotalXp = xpResult.new_total_xp || 0;
    const newDailyXp = xpResult.new_daily_xp || 0;
    const levelAfter = xpResult.level_after || 1;
    const levelBefore = xpResult.level_before || 1;

    return NextResponse.json({
      success: true,
      xp_result: {
        awarded: xpAwarded, // Fixed: was result.awarded_xp
        capped: xpResult.capped || false,
        new_total_xp: newTotalXp,
        new_level: levelAfter,
        level_up: levelAfter > levelBefore,
        remaining_today: 100 - newDailyXp,
      },
      message:
        xpAwarded > 0
          ? `Awarded ${xpAwarded} XP for ${action}`
          : xpResult.capped
            ? 'Daily XP cap reached'
            : 'No XP awarded',
    });
  } catch (error) {
    console.error('Error in POST /api/games/xp:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
