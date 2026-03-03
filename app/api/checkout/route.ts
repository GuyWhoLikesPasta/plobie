import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { CreateCheckoutSchema, ErrorCodes } from '@/lib/types';
import { RateLimits } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
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

    // Rate limit: 10 checkouts per hour
    if (!(await RateLimits.checkout(user.id))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many checkout attempts. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = CreateCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request',
            details: validation.error,
          },
        },
        { status: 400 }
      );
    }

    const { variant_ids, quantities, apply_gift_card } = validation.data;

    // Fetch product variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*, products(*)')
      .in('id', variant_ids);

    if (variantsError || !variants || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Products not found' } },
        { status: 404 }
      );
    }

    // Check stock
    for (let i = 0; i < variants.length; i++) {
      if (variants[i].stock_qty < quantities[i]) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCodes.VALIDATION_ERROR,
              message: `Insufficient stock for ${variants[i].sku}`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Calculate total
    const total_cents = variants.reduce((sum, variant, i) => {
      return sum + variant.price_cents * quantities[i];
    }, 0);

    const adminSupabase = createAdminClient();

    // Check gift card balance if applying
    let giftCardDiscount = 0;
    let giftCardId: string | null = null;
    if (apply_gift_card) {
      const { data: giftCards } = await adminSupabase
        .from('gift_cards')
        .select('id, current_balance_cents')
        .eq('redeemed_by', user.id)
        .eq('status', 'active')
        .gt('current_balance_cents', 0)
        .order('current_balance_cents', { ascending: false })
        .limit(1);

      if (giftCards && giftCards.length > 0) {
        giftCardId = giftCards[0].id;
        giftCardDiscount = Math.min(giftCards[0].current_balance_cents, total_cents);
      }
    }

    const chargeAmount = total_cents - giftCardDiscount;

    // Create draft order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: chargeAmount <= 0 ? 'paid' : 'pending',
        total_cents,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to create order' },
        },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = variants.map((variant, i) => ({
      order_id: order.id,
      variant_id: variant.id,
      quantity: quantities[i],
      price_cents: variant.price_cents,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to create order' },
        },
        { status: 500 }
      );
    }

    // If gift card fully covers the order, skip Stripe
    if (chargeAmount <= 0 && giftCardId && giftCardDiscount > 0) {
      // Deduct from gift card
      const { data: card } = await adminSupabase
        .from('gift_cards')
        .select('current_balance_cents')
        .eq('id', giftCardId)
        .single();

      if (card) {
        await adminSupabase
          .from('gift_cards')
          .update({
            current_balance_cents: Math.max(0, card.current_balance_cents - giftCardDiscount),
          })
          .eq('id', giftCardId);
      }

      // Log transaction
      await adminSupabase.from('gift_card_transactions').insert({
        gift_card_id: giftCardId,
        amount_cents: -giftCardDiscount,
        transaction_type: 'purchase',
        balance_after_cents: 0,
        notes: `Order ${order.id}`,
      });

      return NextResponse.json({
        success: true,
        data: {
          order_id: order.id,
          paid_with_gift_card: true,
          gift_card_applied: giftCardDiscount,
        },
      });
    }

    // Create Stripe line items
    const line_items = variants.map((variant, i) => ({
      price_data: {
        currency: STRIPE_CONFIG.currency,
        unit_amount: variant.price_cents,
        product_data: {
          name: `${variant.products.name} - ${variant.size || ''} ${variant.color || ''}`.trim(),
          description: variant.products.description || undefined,
        },
      },
      quantity: quantities[i],
    }));

    // If partial gift card, add a discount line item
    if (giftCardDiscount > 0) {
      line_items.push({
        price_data: {
          currency: STRIPE_CONFIG.currency,
          unit_amount: -giftCardDiscount,
          product_data: {
            name: 'Gift Card Discount',
            description: `Gift card balance applied`,
          },
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session with idempotency key
    const session = await stripe.checkout.sessions.create(
      {
        mode: STRIPE_CONFIG.mode,
        payment_method_types: ['card'],
        line_items:
          giftCardDiscount > 0
            ? [
                {
                  price_data: {
                    currency: STRIPE_CONFIG.currency,
                    unit_amount: chargeAmount,
                    product_data: {
                      name: `Order Total (Gift Card: -$${(giftCardDiscount / 100).toFixed(2)})`,
                    },
                  },
                  quantity: 1,
                },
              ]
            : line_items,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
        metadata: {
          order_id: order.id,
          user_id: user.id,
          gift_card_id: giftCardId || '',
          gift_card_discount: giftCardDiscount.toString(),
        },
        customer_email: user.email,
      },
      {
        idempotencyKey: order.id,
      }
    );

    // Update order with session ID
    await supabase.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
        order_id: order.id,
        gift_card_applied: giftCardDiscount,
      },
    });
  } catch (error) {
    console.error('Unexpected error in checkout:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
