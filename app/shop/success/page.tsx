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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order has been successfully placed.
          </p>

          {/* Order Details */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono text-xs text-gray-900 break-all">
                {order.id}
              </p>
              <p className="text-sm text-gray-600 mt-3 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(order.total_cents / 100).toFixed(2)}
              </p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              What's Next?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ You'll receive an email confirmation shortly</li>
              <li>✓ Your order will be processed within 1-2 business days</li>
              <li>✓ Check your pottery's QR code to link it to your garden!</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/my-plants"
              className="block w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              🌿 Go to My Plants
            </Link>
            <Link
              href="/shop"
              className="block w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

