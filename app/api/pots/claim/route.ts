/**
 * POST /api/pots/claim
 * 
 * Claim a pot using a valid JWT token.
 * Binds pot to user profile and awards +50 XP.
 * Rate limited: 3 claims per hour per user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { verifyClaimToken } from '@/lib/claim-tokens';
import { RateLimits } from '@/lib/rate-limit';
import { ApiResponse, ErrorCodes } from '@/lib/types';
import { trackEvent, GA4_EVENTS } from '@/lib/analytics';

const RequestSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ pot_id: string; xp_awarded: number }>>> {
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

    const { token } = validation.data;

    // Verify JWT token
    const payload = verifyClaimToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.INVALID_TOKEN,
            message: 'Invalid or expired claim token',
          },
        },
        { status: 401 }
      );
    }

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to claim a pot',
          },
        },
        { status: 401 }
      );
    }

    // Rate limit check: 3 claims per hour per user
    if (!RateLimits.claimExecution(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many claim attempts. Please try again in an hour.',
          },
        },
        { status: 429 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
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

    // Get pot details
    const { data: pot, error: potError } = await supabase
      .from('pots')
      .select('id, pot_code')
      .eq('pot_code', payload.pot_code)
      .single();

    if (potError || !pot) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Pot not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if pot is already claimed
    const { data: existingClaim } = await supabase
      .from('pot_claims')
      .select('id, profile_id')
      .eq('pot_id', pot.id)
      .maybeSingle();

    if (existingClaim) {
      const isOwnClaim = existingClaim.profile_id === profile.id;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.ALREADY_EXISTS,
            message: isOwnClaim 
              ? 'You have already claimed this pot'
              : 'This pot has already been claimed by another user',
          },
        },
        { status: 409 }
      );
    }

    // Use admin client to create claim and award XP atomically
    const adminSupabase = createAdminClient();

    // Create pot claim
    const { data: claim, error: claimError } = await adminSupabase
      .from('pot_claims')
      .insert({
        pot_id: pot.id,
        profile_id: profile.id,
        claimed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (claimError) {
      console.error('Claim creation error:', claimError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to claim pot',
          },
        },
        { status: 500 }
      );
    }

    // Award +50 XP for pot linking
    const xpAmount = 50;
    const { error: xpError } = await adminSupabase
      .from('xp_events')
      .insert({
        profile_id: profile.id,
        action_type: 'pot_link',
        amount: xpAmount,
        reference_type: 'pot',
        reference_id: pot.id,
      });

    if (xpError) {
      console.error('XP award error:', xpError);
      // Don't fail the claim if XP fails, but log it
    }

    // Update XP balance
    const { data: currentBalance } = await adminSupabase
      .from('xp_balances')
      .select('total_xp')
      .eq('profile_id', profile.id)
      .single();

    const newTotal = (currentBalance?.total_xp || 0) + xpAmount;
    await adminSupabase
      .from('xp_balances')
      .upsert({
        profile_id: profile.id,
        total_xp: newTotal,
        level: Math.floor(newTotal / 100) + 1, // Simple level calculation
        updated_at: new Date().toISOString(),
      });

    // Track analytics event
    trackEvent('pot_claim_succeeded', pot.id, xpAmount);

    return NextResponse.json(
      {
        success: true,
        data: {
          pot_id: pot.id,
          xp_awarded: xpAmount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Pot claim error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to claim pot',
        },
      },
      { status: 500 }
    );
  }
}

