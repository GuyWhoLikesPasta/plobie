import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const supabase = await createServerSupabaseClient();
  
  let order = null;
  
  if (searchParams.session_id) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', searchParams.session_id)
      .single();
    
    order = data;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="glass-strong rounded-3xl shadow-2xl p-10 md:p-12 text-center border border-white/10">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/30 shadow-lg">
            <svg
              className="w-12 h-12 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-300 mb-8 text-lg">
            Thank you for your purchase. Your order has been successfully placed.
          </p>

          {/* Order Details */}
          {order && (
            <div className="glass rounded-2xl p-6 mb-8 text-left border border-white/10">
              <p className="text-sm text-gray-400 mb-2">Order ID</p>
              <p className="font-mono text-xs text-gray-300 break-all mb-4">
                {order.id}
              </p>
              <p className="text-sm text-gray-400 mb-2">Total</p>
              <p className="text-3xl font-black text-white">
                ${(order.total_cents / 100).toFixed(2)}
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="glass border border-cyan-500/30 rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-white mb-4 text-lg">
              What's Next?
            </h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                You'll receive an email confirmation shortly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                Your order will be processed within 1-2 business days
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                Check your pottery's QR code to link it to your garden!
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/my-plants"
              className="block w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-glow transition-all text-lg"
            >
              🌿 Go to My Plants
            </Link>
            <Link
              href="/shop"
              className="block w-full py-4 glass text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
