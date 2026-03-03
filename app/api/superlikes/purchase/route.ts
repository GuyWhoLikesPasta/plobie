import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { ErrorCodes } from '@/lib/types';
import { RateLimits } from '@/lib/rate-limit';
import { SUPERLIKE_CONFIG } from '@/lib/superlike';

export async function POST() {
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

    if (!(await RateLimits.superlikePurchase(user.id))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many purchases. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: SUPERLIKE_CONFIG.PACK_PRICE_CENTS,
            product_data: {
              name: `Plobie Superlike Pack (${SUPERLIKE_CONFIG.PACK_SIZE} Superlikes)`,
              description: `Support your favorite creators! Each superlike earns creators $${(SUPERLIKE_CONFIG.CREATOR_EARNING_CENTS / 100).toFixed(2)}.`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/hobbies?superlike_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/hobbies`,
      metadata: {
        type: 'superlike_pack',
        user_id: user.id,
        pack_size: SUPERLIKE_CONFIG.PACK_SIZE.toString(),
      },
      customer_email: user.email,
    });

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Superlike purchase error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to create checkout' },
      },
      { status: 500 }
    );
  }
}
