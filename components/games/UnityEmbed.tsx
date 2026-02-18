'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;

const UNITY_BUILD_URL = process.env.NEXT_PUBLIC_UNITY_BUILD_URL || '/unity/index.html';

type GameState =
  | 'loading'
  | 'checking-auth'
  | 'not-logged-in'
  | 'mobile'
  | 'ready'
  | 'playing'
  | 'error';

declare global {
  interface Window {
    plobie?: {
      getAccessToken: () => string;
      isLoggedIn: () => boolean;
      getUserId: () => string;
      getApiUrl: () => string;
      log: (msg: string) => void;
      redirectToLogin: () => void;
      version: string;
    };
  }
}

interface UnityEmbedProps {
  redirectPath?: string;
  className?: string;
}

export default function UnityEmbed({ redirectPath = '/my-plants', className }: UnityEmbedProps) {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  const setupUnityBridge = useCallback(
    (token: string, userId: string) => {
      window.plobie = {
        getAccessToken: () => token,
        isLoggedIn: () => !!token,
        getUserId: () => userId,
        getApiUrl: () => window.location.origin + '/api',
        log: (msg: string) => {
          if (process.env.NODE_ENV === 'development') console.log('[Unity]', msg);
        },
        redirectToLogin: () => router.push(loginUrl),
        version: '1.0.0',
      };
    },
    [router, loginUrl]
  );

  useEffect(() => {
    const checkRequirements = async () => {
      try {
        const mobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) || window.innerWidth < 768;

        setIsMobile(mobile);

        if (mobile) {
          setGameState('mobile');
          return;
        }

        setGameState('checking-auth');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error('Failed to verify authentication');
        }

        if (!session?.user) {
          setGameState('not-logged-in');
          return;
        }

        setUser(session.user);
        setAccessToken(session.access_token);

        setupUnityBridge(session.access_token, session.user.id);

        setError(null);
        setGameState('ready');
      } catch (err) {
        console.error('Game page error:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setGameState('error');
      }
    };

    checkRequirements();
  }, [supabase.auth, retryCount, setupUnityBridge]);

  const handleRetry = () => {
    setError(null);
    setGameState('loading');
    setRetryCount(prev => prev + 1);
  };

  const handleUnityLoad = () => {
    setUnityLoaded(true);
    setGameState('playing');
  };

  const handlePlay = () => {
    if (!UNITY_BUILD_URL) {
      setError('Game build not available.');
      return;
    }
    setGameState('playing');
  };

  const renderContent = () => {
    switch (gameState) {
      case 'loading':
      case 'checking-auth':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4" />
            <p className="text-stone-600 dark:text-stone-400">Loading...</p>
          </div>
        );

      case 'not-logged-in':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-stone-400 dark:text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
              Login Required
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6 text-center">
              Sign in to play games and earn XP for your garden!
            </p>
            <button
              onClick={() => router.push(loginUrl)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
            >
              Sign In to Play
            </button>
          </div>
        );

      case 'mobile':
        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-stone-400 dark:text-stone-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
                Desktop Only
              </h2>
              <p className="text-stone-600 dark:text-stone-400 mb-4 max-w-md">
                The garden game requires a desktop or laptop computer.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-1 rounded-xl">
                  Desktop
                </span>
                <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-1 rounded-xl">
                  Laptop
                </span>
                <span className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-3 py-1 rounded-xl">
                  Large Tablet
                </span>
              </div>
            </div>

            {/* Plant Care Tips while waiting */}
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl p-5 border border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-white mb-4">
                Plant Care Tips
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  <div>
                    <p className="text-stone-800 dark:text-stone-200 font-medium">Water Wisely</p>
                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                      Most plants prefer morning watering when it&apos;s cooler.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-stone-800 dark:text-stone-200 font-medium">Light Matters</p>
                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                      Know if your plant loves sun or prefers shade.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 20h16v4H4zM6 20V10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v10"
                    />
                  </svg>
                  <div>
                    <p className="text-stone-800 dark:text-stone-200 font-medium">
                      Drainage is Key
                    </p>
                    <p className="text-stone-600 dark:text-stone-400 text-sm">
                      Ensure pots have drainage holes to prevent root rot.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => router.push('/hobbies')}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl transition-colors text-sm border border-stone-200 dark:border-stone-700"
              >
                Browse Community
              </button>
              <button
                onClick={() => router.push('/hobbies/learn')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm"
              >
                Learn & Earn XP
              </button>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8 relative overflow-hidden">
            <div className="mb-4">
              <svg
                className="w-20 h-20 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
              Your Garden Awaits
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6 text-center max-w-md">
              Enter your virtual garden, tend to your plants, and earn XP!
            </p>

            {UNITY_BUILD_URL ? (
              <button
                onClick={handlePlay}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-105"
              >
                Enter Garden
              </button>
            ) : (
              <div className="text-center">
                <div className="px-8 py-4 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 font-semibold rounded-xl mb-3">
                  Build Unavailable
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Unity build not deployed
                </p>
              </div>
            )}

            {error && <p className="text-red-600 dark:text-red-400 mt-4 text-sm">{error}</p>}
          </div>
        );

      case 'playing':
        return (
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800">
            {/* Unity WebGL Container */}
            <div
              className="relative"
              style={{
                width: '100%',
                maxWidth: GAME_WIDTH,
                aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`,
                margin: '0 auto',
              }}
            >
              {!unityLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mb-4" />
                  <p className="text-white text-lg">Loading Garden...</p>
                  <p className="text-stone-400 text-sm mt-2">This may take a moment</p>
                </div>
              )}

              {UNITY_BUILD_URL ? (
                <iframe
                  src={UNITY_BUILD_URL}
                  className="w-full h-full border-0"
                  style={{
                    aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`,
                  }}
                  onLoad={handleUnityLoad}
                  allow="autoplay; fullscreen"
                  title="Plobie Garden Game"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900">
                  <div className="mb-4">
                    <svg
                      className="w-16 h-16 text-stone-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 20h16v4H4zM6 20V10a4 4 0 014-4h4a4 4 0 014 4v10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Build Not Available</h3>
                  <p className="text-stone-400 text-center max-w-sm">
                    The Unity game build hasn&apos;t been deployed yet.
                  </p>
                  <button
                    onClick={() => setGameState('ready')}
                    className="mt-6 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl transition-colors text-sm"
                  >
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Go Back
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Game Controls Bar */}
            <div className="bg-stone-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGameState('ready')}
                  className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-white text-sm rounded-xl transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Exit
                </button>
                <span className="text-stone-400 text-sm hidden sm:inline">
                  Playing as <span className="text-green-400">{user?.email || 'Guest'}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-stone-500 hidden sm:inline">Connected</span>
                </div>

                <div className="h-4 w-px bg-stone-700 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-stone-400">XP</span>
                  <span className="text-green-400 font-semibold">+0</span>
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="bg-stone-950 px-4 py-2 flex items-center justify-center gap-6 text-xs text-stone-500">
              <span>
                <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-400">WASD</kbd> Move
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-400">E</kbd> Interact
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-400">ESC</kbd> Menu
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-stone-400">F</kbd>{' '}
                Fullscreen
              </span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-8">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
              Something Went Wrong
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mb-6 text-center max-w-md">
              {error || "We couldn't load the game. Please try again."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/hobbies')}
                className="px-6 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold rounded-xl transition-colors border border-stone-200 dark:border-stone-700"
              >
                <span className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Hobbies
                </span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className={className}>{renderContent()}</div>;
}
