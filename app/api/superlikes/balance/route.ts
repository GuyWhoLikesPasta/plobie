import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

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

    // Get superlike balance
    const { data: balance } = await supabase
      .from('superlike_balances')
      .select('balance, total_purchased, total_used')
      .eq('user_id', user.id)
      .single();

    // Get creator earnings
    const { data: earnings } = await supabase
      .from('creator_earnings')
      .select('balance_cents, lifetime_earned_cents, lifetime_paid_cents')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        superlike_balance: balance || { balance: 0, total_purchased: 0, total_used: 0 },
        creator_earnings: earnings || {
          balance_cents: 0,
          lifetime_earned_cents: 0,
          lifetime_paid_cents: 0,
        },
      },
    });
  } catch (error) {
    console.error('Superlike balance error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to fetch balance' },
      },
      { status: 500 }
    );
  }
}
