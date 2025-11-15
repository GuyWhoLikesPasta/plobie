import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { CreateCheckoutSchema, ErrorCodes } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = CreateCheckoutSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Invalid request', details: validation.error } },
        { status: 400 }
      );
    }

    const { variant_ids, quantities } = validation.data;

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
          { success: false, error: { code: ErrorCodes.VALIDATION_ERROR, message: `Insufficient stock for ${variants[i].sku}` } },
          { status: 400 }
        );
      }
    }

    // Calculate total
    const total_cents = variants.reduce((sum, variant, i) => {
      return sum + (variant.price_cents * quantities[i]);
    }, 0);

    // Create draft order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_cents,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to create order' } },
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

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to create order' } },
        { status: 500 }
      );
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

    // Create Stripe Checkout Session with idempotency key
    const session = await stripe.checkout.sessions.create(
      {
        mode: STRIPE_CONFIG.mode,
        payment_method_types: STRIPE_CONFIG.payment_methods,
        line_items,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
        customer_email: user.email,
      },
      {
        idempotencyKey: order.id, // Use order ID as idempotency key
      }
    );

    // Update order with session ID
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        url: session.url,
        order_id: order.id,
      },
    });
  } catch (error) {
    console.error('Unexpected error in checkout:', error);
    return NextResponse.json(
      { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

