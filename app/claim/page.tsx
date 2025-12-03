'use client';

/**
 * QR Claim Landing Page
 * 
 * URL: /claim?code=ABC123
 * Users land here after scanning a QR code on a pot.
 */

import { useEffect, useState, Suspense } from 'react';
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

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && potCode) {
      generateToken();
    }
  }, [isAuthenticated, potCode]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);

    if (!user && potCode) {
      router.push(`/login?redirect=/claim?code=${encodeURIComponent(potCode)}`);
    }
  };

  const generateToken = async () => {
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
    } catch (err) {
      setState('error');
      setError('Network error. Please check your connection.');
    }
  };

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
    } catch (err) {
      setState('error');
      setError('Network error. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-400 text-lg animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      <div className="max-w-md w-full glass-strong rounded-3xl shadow-2xl p-8 md:p-10 border border-white/10 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 via-cyan-500 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg animate-float">
            <span className="text-4xl md:text-5xl">🌱</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
            Claim Your Pot
          </h1>
          {potCode && (
            <p className="text-sm text-gray-400 font-mono glass inline-block px-4 py-2 rounded-xl">
              {potCode}
            </p>
          )}
        </div>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-400">Preparing your claim...</p>
          </div>
        )}

        {/* Ready State */}
        {state === 'ready' && (
          <div className="text-center">
            <p className="text-gray-300 mb-8 text-base md:text-lg leading-relaxed">
              You're about to claim this pot and add it to your collection.
              You'll earn <span className="font-black text-emerald-400">+50 XP</span>!
            </p>
            <button
              onClick={handleClaim}
              className="w-full min-h-[52px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-glow transition-all text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Claim This Pot →
            </button>
            <p className="text-xs text-gray-500 mt-6">
              This pot will be added to your My Plants collection
            </p>
          </div>
        )}

        {/* Claiming State */}
        {state === 'claiming' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
            <p className="mt-6 text-gray-400">Claiming your pot...</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-emerald-500/30">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Pot Claimed!
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              You earned <span className="font-black text-emerald-400">+{xpAwarded} XP</span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/my-plants')}
                className="w-full min-h-[52px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-glow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                View My Plants →
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="w-full min-h-[52px] glass text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Shop More Pots
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-red-500/30">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Claim Failed
            </h2>
            <p className="text-red-400 mb-8 font-medium">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setState('loading');
                  generateToken();
                }}
                className="w-full min-h-[52px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-glow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="w-full min-h-[52px] glass text-gray-300 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}
