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
  const router = useRouter();

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
        setError(result.error?.message || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option
          </label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={loading || quantity <= 1}
              className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={maxQuantity}
              className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={loading || quantity >= maxQuantity}
              className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition"
            >
              +
            </button>
            <span className="text-sm text-gray-500">
              {maxQuantity} available
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Total Price */}
      {selectedVariant && isInStock && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-gray-700">Total</span>
            <span className="font-bold text-gray-900">
              ${((selectedVariant.price_cents * quantity) / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading || !isInStock}
        className="w-full py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing...' : !isInStock ? 'Out of Stock' : '🛒 Checkout with Stripe'}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Secure checkout powered by Stripe. You'll be redirected to complete your purchase.
      </p>
    </div>
  );
}

