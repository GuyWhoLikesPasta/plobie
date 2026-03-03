import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Dedupe: check if event already processed
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (existing) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, note: 'already processed' });
  }

  // Process event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataType = session.metadata?.type;

        if (metadataType === 'superlike_pack') {
          // Credit superlikes to user
          const userId = session.metadata?.user_id;
          const packSize = parseInt(session.metadata?.pack_size || '5', 10);

          if (userId) {
            // Upsert superlike balance
            const { data: existing } = await supabase
              .from('superlike_balances')
              .select('balance')
              .eq('user_id', userId)
              .single();

            if (existing) {
              await supabase
                .from('superlike_balances')
                .update({
                  balance: existing.balance + packSize,
                  total_purchased: (existing as any).total_purchased + packSize,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);
            } else {
              await supabase.from('superlike_balances').insert({
                user_id: userId,
                balance: packSize,
                total_purchased: packSize,
                total_used: 0,
              });
            }

            // Record transaction
            const newBalance = (existing?.balance || 0) + packSize;
            await supabase.from('superlike_transactions').insert({
              user_id: userId,
              type: 'purchase',
              amount: packSize,
              balance_after: newBalance,
              stripe_session_id: session.id,
            });

            console.log(`Credited ${packSize} superlikes to user ${userId}`);
          }
        } else {
          // Regular order
          const order_id = session.metadata?.order_id;

          if (order_id) {
            await supabase
              .from('orders')
              .update({
                status: 'paid',
                stripe_payment_intent_id: session.payment_intent as string,
              })
              .eq('id', order_id);

            // Deduct gift card balance if applied
            const gcId = session.metadata?.gift_card_id;
            const gcDiscount = parseInt(session.metadata?.gift_card_discount || '0', 10);
            if (gcId && gcDiscount > 0) {
              const { data: card } = await supabase
                .from('gift_cards')
                .select('current_balance_cents')
                .eq('id', gcId)
                .single();

              if (card) {
                await supabase
                  .from('gift_cards')
                  .update({
                    current_balance_cents: Math.max(0, card.current_balance_cents - gcDiscount),
                  })
                  .eq('id', gcId);

                await supabase.from('gift_card_transactions').insert({
                  gift_card_id: gcId,
                  amount_cents: -gcDiscount,
                  transaction_type: 'purchase',
                  balance_after_cents: Math.max(0, card.current_balance_cents - gcDiscount),
                  notes: `Order ${order_id}`,
                });
              }
            }

            console.log(`Order ${order_id} marked as paid`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;

        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', intent.id);

        console.log(`Payment failed for intent ${intent.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const payment_intent = charge.payment_intent as string;

        await supabase
          .from('orders')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', payment_intent);

        console.log(`Refund processed for payment intent ${payment_intent}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
