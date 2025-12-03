'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

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
  productName 
}: { 
  variants: Variant[]; 
  productName: string;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter(); // Used for login redirect

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const isInStock = selectedVariant && selectedVariant.stock_qty > 0;
  const maxQuantity = selectedVariant?.stock_qty || 1;

  const handleCheckout = async () => {
    if (!selectedVariant || !isInStock) return;

    setLoading(true);
    setError('');

    try {
      // Track analytics
      trackEvent('begin_checkout', selectedVariant.id, selectedVariant.price_cents * quantity);

      // Call checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_ids: [selectedVariantId],
          quantities: [quantity],
        }),
      });

      const result = await response.json();

      if (result.success && result.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url;
      } else {
        // Handle authentication error
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
    <div className="space-y-6">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">
            Select Option
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full px-4 py-3 glass text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            disabled={loading}
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock_qty === 0}>
                {variant.size && `${variant.size} - `}
                {variant.color && `${variant.color} - `}
                ${(variant.price_cents / 100).toFixed(2)}
                {variant.stock_qty === 0 && ' (Out of Stock)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Selector */}
      {isInStock && (
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={loading || quantity <= 1}
              className="w-12 h-12 glass border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-white text-xl"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={maxQuantity}
              className="w-24 px-4 py-3 glass text-white text-center rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold text-lg"
              disabled={loading}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={loading || quantity >= maxQuantity}
              className="w-12 h-12 glass border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-white text-xl"
            >
              +
            </button>
            <span className="text-sm text-gray-400 font-medium">
              {maxQuantity} available
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Total Price */}
      {selectedVariant && isInStock && (
        <div className="glass-strong rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between text-xl">
            <span className="font-bold text-gray-300">Total</span>
            <span className="font-black text-white text-2xl">
              ${((selectedVariant.price_cents * quantity) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || !isInStock}
        className="w-full py-4 min-h-[56px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-black text-lg hover:from-emerald-600 hover:to-cyan-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
      >
        {loading ? 'Processing...' : !isInStock ? 'Out of Stock' : '🛒 Checkout with Stripe'}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center font-medium">
        Secure checkout powered by Stripe. You'll be redirected to complete your purchase.
      </p>
    </div>
  );
}

