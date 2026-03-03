'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { createClient } from '@/lib/supabase';

interface Variant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_cents: number;
  stock_qty: number;
}

export default function AddToCartButton({
  variants,
  productName,
}: {
  variants: Variant[];
  productName: string;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [applyGiftCard, setApplyGiftCard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGiftCardBalance = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const res = await fetch('/api/gift-cards');
        const data = await res.json();
        if (data.success) {
          const totalBalance = (data.data.gift_cards || [])
            .filter((gc: any) => gc.redeemed_by === user.id && gc.status === 'active')
            .reduce((sum: number, gc: any) => sum + (gc.current_balance_cents || 0), 0);
          setGiftCardBalance(totalBalance);
        }
      } catch {
        // Ignore — gift card balance is optional
      }
    };
    fetchGiftCardBalance();
  }, []);

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const isInStock = selectedVariant && selectedVariant.stock_qty > 0;
  const maxQuantity = selectedVariant?.stock_qty || 1;

  const handleCheckout = async () => {
    if (!selectedVariant || !isInStock) return;

    setLoading(true);
    setError('');

    try {
      trackEvent('begin_checkout', selectedVariant.id, selectedVariant.price_cents * quantity);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_ids: [selectedVariantId],
          quantities: [quantity],
          apply_gift_card: applyGiftCard || undefined,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.paid_with_gift_card) {
        router.push(`/shop/success?order_id=${result.data.order_id}&gift_card=true`);
        return;
      } else if (result.success && result.data.url) {
        window.location.href = result.data.url;
      } else {
        if (result.error?.code === 'UNAUTHORIZED') {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }
        setError(result.error?.message || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (_err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Select Option
          </label>
          <select
            value={selectedVariantId}
            onChange={e => setSelectedVariantId(e.target.value)}
            className="w-full px-4 py-2.5 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            disabled={loading}
          >
            {variants.map(variant => (
              <option key={variant.id} value={variant.id} disabled={variant.stock_qty === 0}>
                {variant.size && `${variant.size} - `}
                {variant.color && `${variant.color} - `}${(variant.price_cents / 100).toFixed(2)}
                {variant.stock_qty === 0 && ' (Out of Stock)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Selector */}
      {isInStock && (
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={loading || quantity <= 1}
              className="w-10 h-10 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-stone-700 dark:text-stone-300"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={e =>
                setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))
              }
              min={1}
              max={maxQuantity}
              className="w-20 px-4 py-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white rounded-xl text-center focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              disabled={loading}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={loading || quantity >= maxQuantity}
              className="w-10 h-10 border border-stone-300 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-stone-700 dark:text-stone-300"
            >
              +
            </button>
            <span className="text-sm text-stone-500">{maxQuantity} available</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Total Price */}
      {selectedVariant && isInStock && (
        <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-stone-600 dark:text-stone-400">Total</span>
            <span className="font-bold text-stone-900 dark:text-white">
              ${((selectedVariant.price_cents * quantity) / 100).toFixed(2)}
            </span>
          </div>
          {giftCardBalance > 0 && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyGiftCard}
                    onChange={e => setApplyGiftCard(e.target.checked)}
                    className="rounded border-stone-300 text-green-600 focus:ring-green-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    Apply Gift Card Balance
                  </span>
                </label>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  ${(giftCardBalance / 100).toFixed(2)}
                </span>
              </div>
              {applyGiftCard && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400">You pay</span>
                  <span className="font-bold text-green-700 dark:text-green-300">
                    $
                    {(
                      Math.max(0, selectedVariant.price_cents * quantity - giftCardBalance) / 100
                    ).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || !isInStock}
        className="w-full py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-500 disabled:bg-stone-300 dark:disabled:bg-stone-700 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20 hover:shadow-green-500/30 disabled:shadow-none"
      >
        {loading ? 'Processing...' : !isInStock ? 'Out of Stock' : 'Checkout with Stripe'}
      </button>

      {/* Info Text */}
      <p className="text-xs text-stone-500 text-center">
        Secure checkout powered by Stripe. You&apos;ll be redirected to complete your purchase.
      </p>
    </div>
  );
}
