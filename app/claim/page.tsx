'use client';

/**
 * QR Claim Landing Page
 *
 * URL: /claim?code=ABC123
 * Users land here after scanning a QR code on a pot.
 */

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

type ClaimState = 'loading' | 'ready' | 'claiming' | 'success' | 'error';

function ClaimContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const potCode = searchParams.get('code');

  const [state, setState] = useState<ClaimState>('loading');
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [xpAwarded, setXpAwarded] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const generateToken = useCallback(async () => {
    if (!potCode) {
      setState('error');
      setError('No pot code provided. Please scan a QR code.');
      return;
    }

    try {
      const response = await fetch('/api/pots/claim-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pot_code: potCode }),
      });

      const data = await response.json();

      if (!data.success) {
        setState('error');
        setError(data.error?.message || 'Failed to generate claim token');
        return;
      }

      setToken(data.data.token);
      setState('ready');
    } catch (_err) {
      setState('error');
      setError('Network error. Please check your connection.');
    }
  }, [potCode]);

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    if (!user && potCode) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/claim?code=${encodeURIComponent(potCode)}`);
    }
  }, [potCode, router]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && potCode) {
      void generateToken();
    }
  }, [isAuthenticated, potCode, generateToken]);

  const handleClaim = async () => {
    if (!token) return;

    setState('claiming');
    setError('');

    try {
      const response = await fetch('/api/pots/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!data.success) {
        setState('error');
        setError(data.error?.message || 'Failed to claim pot');
        return;
      }

      setXpAwarded(data.data.xp_awarded);
      setState('success');
    } catch (_err) {
      setState('error');
      setError('Network error. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🌱</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Claim Your Pot</h1>
          {potCode && (
            <p className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-3 py-1 rounded">
              {potCode}
            </p>
          )}
        </div>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Preparing your claim...</p>
          </div>
        )}

        {/* Ready State */}
        {state === 'ready' && (
          <div className="text-center">
            <p className="text-gray-700 mb-6">
              You're about to claim this pot and add it to your collection. You'll earn{' '}
              <span className="font-bold text-green-600">+500 XP</span> for linking it!
            </p>
            <button
              onClick={handleClaim}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 min-h-[48px] rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              Claim This Pot
            </button>
            <p className="text-xs text-gray-500 mt-4">
              This pot will be added to your My Plants collection
            </p>
          </div>
        )}

        {/* Claiming State */}
        {state === 'claiming' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Claiming your pot...</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pot Claimed Successfully!</h2>
            <p className="text-gray-700 mb-4">
              You earned <span className="font-bold text-green-600">+{xpAwarded} XP</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/my-plants')}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                View My Plants
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="w-full bg-white text-green-600 px-6 py-3 rounded-lg font-medium border-2 border-green-600 hover:bg-green-50 transition-all"
              >
                Shop More Pots
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Claim Failed</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setState('loading');
                  generateToken();
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="w-full bg-white text-gray-600 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-all"
              >
                Back to Shop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
