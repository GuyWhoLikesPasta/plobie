'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function GiftCardSuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-stone-900 dark:to-stone-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
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
          <h1 className="text-3xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
            Gift Card Purchased!
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            Your gift card is ready to share
          </p>

          {code && (
            <div className="bg-stone-100 dark:bg-stone-700 rounded-xl p-6 mb-6">
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">Gift Card Code</p>
              <p className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 tracking-wider">
                {code}
              </p>
            </div>
          )}

          <div className="space-y-3 text-left bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ Gift card is active and ready to use
            </p>
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ Valid for 1 year from today
            </p>
            <p className="text-sm text-green-800 dark:text-green-300">
              ✓ Share the code above with the recipient
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                if (code) {
                  navigator.clipboard.writeText(code);
                  alert('Code copied to clipboard!');
                }
              }}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              Copy Code
            </button>
            <Link
              href="/shop"
              className="block w-full py-3 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 text-stone-900 dark:text-white font-semibold rounded-lg transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GiftCardSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <GiftCardSuccessContent />
    </Suspense>
  );
}
