import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { z } from 'zod';
import { ErrorCodes } from '@/lib/types';

const RedeemSchema = z.object({
  code: z.string().min(10).max(20),
});

const CheckSchema = z.object({
  code: z.string().min(10).max(20),
});

// GET - Check gift card balance (by code in query param)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Code is required' },
        },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch gift card by code
    const adminSupabase = createAdminClient();
    const { data: giftCard, error } = await adminSupabase
      .from('gift_cards')
      .select('id, code, original_value_cents, current_balance_cents, status, expires_at')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (error || !giftCard) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Gift card not found' } },
        { status: 404 }
      );
    }

    // Check if expired
    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Gift card has expired' },
        },
        { status: 400 }
      );
    }

    // Check if active
    if (giftCard.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: `Gift card is ${giftCard.status}` },
        },
        { status: 400 }
      );
    }

    // Check balance
    if (giftCard.current_balance_cents <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Gift card has no remaining balance',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: giftCard.code,
        balance_cents: giftCard.current_balance_cents,
        original_value_cents: giftCard.original_value_cents,
        valid: true,
      },
    });
  } catch (error) {
    console.error('Gift card check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}

// POST - Apply gift card to user's account (claim it)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = RedeemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Invalid code format' },
        },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const normalizedCode = code.toUpperCase().trim();

    // Fetch gift card
    const { data: giftCard, error: fetchError } = await adminSupabase
      .from('gift_cards')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !giftCard) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Gift card not found' } },
        { status: 404 }
      );
    }

    // Validate gift card
    if (giftCard.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: `Gift card is ${giftCard.status}` },
        },
        { status: 400 }
      );
    }

    if (giftCard.expires_at && new Date(giftCard.expires_at) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Gift card has expired' },
        },
        { status: 400 }
      );
    }

    if (giftCard.current_balance_cents <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Gift card has no remaining balance',
          },
        },
        { status: 400 }
      );
    }

    // Check if already claimed by this user
    if (giftCard.redeemed_by === user.id) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Gift card already added to your account',
          balance_cents: giftCard.current_balance_cents,
        },
      });
    }

    // Claim the gift card (associate with user)
    const { error: updateError } = await adminSupabase
      .from('gift_cards')
      .update({
        redeemed_by: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', giftCard.id)
      .is('redeemed_by', null); // Only if not already claimed

    if (updateError) {
      console.error('Error claiming gift card:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to claim gift card' },
        },
        { status: 500 }
      );
    }

    // Log transaction
    await adminSupabase.from('gift_card_transactions').insert({
      gift_card_id: giftCard.id,
      amount_cents: 0,
      transaction_type: 'redemption',
      balance_after_cents: giftCard.current_balance_cents,
      notes: `Claimed by user ${user.id}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Gift card added to your account!',
        balance_cents: giftCard.current_balance_cents,
        code: giftCard.code,
      },
    });
  } catch (error) {
    console.error('Gift card redeem error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
