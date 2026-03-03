'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  price_cents: number;
  product_variants?: {
    size?: string;
    color?: string;
    products?: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_cents: number;
  created_at: string;
  items: OrderItem[];
}

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/shop/orders');
        return;
      }

      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.data.orders);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
            Order History
          </h1>
          <Link
            href="/shop"
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            Back to Shop
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <svg
              className="w-16 h-16 mx-auto text-stone-400 dark:text-stone-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-stone-900 dark:text-white mb-2">
              No orders yet
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Browse our shop and get your first pottery!
            </p>
            <Link
              href="/shop"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                      {order.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-stone-900 dark:text-white">
                      ${(order.total_cents / 100).toFixed(2)}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusBadge[order.status] || statusBadge.pending}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {order.items.length > 0 && (
                  <div className="border-t border-stone-100 dark:border-stone-800 pt-3 space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-stone-700 dark:text-stone-300">
                          {item.product_variants?.products?.name || 'Product'}{' '}
                          {item.product_variants?.size && `(${item.product_variants.size})`} x
                          {item.quantity}
                        </span>
                        <span className="text-stone-900 dark:text-white font-medium">
                          ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
