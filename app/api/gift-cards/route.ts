import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';
import { ErrorCodes } from '@/lib/types';

// Gift card denominations with promo values
// Mother's Day Promo: Spend $20 get $45 (125% bonus!)
export const GIFT_CARD_OPTIONS = [
  { price_cents: 1000, value_cents: 1500, label: '$10 → $15 value', bonus: '50% bonus' },
  {
    price_cents: 2000,
    value_cents: 4500,
    label: '$20 → $45 value',
    bonus: '125% bonus',
    featured: true,
  },
  { price_cents: 5000, value_cents: 7500, label: '$50 → $75 value', bonus: '50% bonus' },
  { price_cents: 10000, value_cents: 15000, label: '$100 → $150 value', bonus: '50% bonus' },
];

const PurchaseSchema = z.object({
  price_cents: z.number().int().positive(),
  recipient_email: z.string().email().optional(),
  recipient_name: z.string().max(100).optional(),
  sender_name: z.string().max(100).optional(),
  personal_message: z.string().max(500).optional(),
});

// GET - List user's gift cards
export async function GET(request: NextRequest) {
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

    // Get user's purchased and redeemed gift cards
    const { data: giftCards, error } = await supabase
      .from('gift_cards')
      .select('*')
      .or(`purchased_by.eq.${user.id},redeemed_by.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gift cards:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to fetch gift cards' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        gift_cards: giftCards || [],
        options: GIFT_CARD_OPTIONS,
      },
    });
  } catch (error) {
    console.error('Gift cards GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}

// POST - Purchase a gift card
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
    const validation = PurchaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { price_cents, recipient_email, recipient_name, sender_name, personal_message } =
      validation.data;

    // Find matching gift card option
    const option = GIFT_CARD_OPTIONS.find(o => o.price_cents === price_cents);
    if (!option) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Invalid gift card amount' },
        },
        { status: 400 }
      );
    }

    // Generate unique code using admin client to bypass RLS for function call
    const { data: codeResult, error: codeError } =
      await adminSupabase.rpc('generate_gift_card_code');

    let code = codeResult;
    if (codeError || !code) {
      // Fallback: generate code in JS
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      code = '';
      for (let i = 0; i < 12; i++) {
        if (i === 4 || i === 8) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    // Create Stripe checkout session for gift card
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: price_cents,
            product_data: {
              name: `Plobie Gift Card - ${option.label}`,
              description: `${option.bonus} - Give the gift of plants!`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/gift-cards/success?session_id={CHECKOUT_SESSION_ID}&code=${code}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/gift-cards`,
      metadata: {
        type: 'gift_card',
        gift_card_code: code,
        value_cents: option.value_cents.toString(),
        user_id: user.id,
        recipient_email: recipient_email || '',
        recipient_name: recipient_name || '',
        sender_name: sender_name || '',
        personal_message: personal_message || '',
      },
      customer_email: user.email,
    });

    // Create pending gift card record
    const { error: insertError } = await adminSupabase.from('gift_cards').insert({
      code,
      original_value_cents: option.value_cents,
      current_balance_cents: option.value_cents,
      purchased_by: user.id,
      recipient_email,
      recipient_name,
      sender_name,
      personal_message,
      status: 'active', // Will be confirmed by webhook
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
      metadata: {
        stripe_session_id: session.id,
        price_paid_cents: price_cents,
        pending_payment: true,
      },
    });

    if (insertError) {
      console.error('Error creating gift card:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to create gift card' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
        code,
      },
    });
  } catch (error) {
    console.error('Gift card purchase error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
