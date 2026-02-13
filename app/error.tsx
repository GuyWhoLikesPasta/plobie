'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center px-4 transition-colors"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1
          id="error-title"
          className="text-3xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight"
        >
          Something went wrong
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8">
          We encountered an unexpected error. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 min-h-[48px] bg-green-600 text-white rounded-xl font-medium hover:bg-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition"
            aria-label="Try loading the page again"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 min-h-[48px] flex items-center justify-center bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl font-medium hover:bg-stone-300 dark:hover:bg-stone-700 focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:focus:ring-offset-stone-950 transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
