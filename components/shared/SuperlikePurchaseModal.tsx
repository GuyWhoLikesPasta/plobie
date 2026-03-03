'use client';

import { useState } from 'react';
import { SUPERLIKE_CONFIG } from '@/lib/superlike';

interface SuperlikePurchaseModalProps {
  onClose: () => void;
}

export default function SuperlikePurchaseModal({ onClose }: SuperlikePurchaseModalProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/superlikes/purchase', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
            Get Superlikes
          </h2>
          <p className="text-stone-600 dark:text-stone-400">
            Show extra love to your favorite posts and support creators!
          </p>
        </div>

        <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-semibold text-stone-900 dark:text-white">
              {SUPERLIKE_CONFIG.PACK_SIZE} Superlikes
            </span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${(SUPERLIKE_CONFIG.PACK_PRICE_CENTS / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Creators earn ${(SUPERLIKE_CONFIG.CREATOR_EARNING_CENTS / 100).toFixed(2)} for each
            superlike received
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Purchase'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
