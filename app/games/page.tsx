'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Unity WebGL container dimensions
const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;

// Unity WebGL build URL - hosted locally for same-origin auth bridge
// Can be overridden via env var for testing external builds
const UNITY_BUILD_URL = process.env.NEXT_PUBLIC_UNITY_BUILD_URL || '/unity/index.html';

type GameState =
  | 'loading'
  | 'checking-auth'
  | 'not-logged-in'
  | 'mobile'
  | 'ready'
  | 'playing'
  | 'error';

// Extend window for Unity bridge
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

export default function GamesPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Setup Unity bridge with the actual token
  const setupUnityBridge = useCallback(
    (token: string, userId: string) => {
      window.plobie = {
        getAccessToken: () => token,
        isLoggedIn: () => !!token,
        getUserId: () => userId,
        getApiUrl: () => window.location.origin + '/api',
        log: (msg: string) => console.log('[Unity]', msg),
        redirectToLogin: () => router.push('/login?redirect=/games'),
        version: '1.0.0',
      };
      console.log('[Games Page] Unity bridge configured with token');
      console.log('[Games Page] window.plobie.getAccessToken() ready:', !!token);
    },
    [router]
  );

  // Check auth and device on mount
  useEffect(() => {
    const checkRequirements = async () => {
      try {
        // Check if mobile
        const mobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) || window.innerWidth < 768;

        setIsMobile(mobile);

        if (mobile) {
          setGameState('mobile');
          return;
        }

        // Check auth
        setGameState('checking-auth');

        // Get both user and session (session contains the token)
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

        // Setup Unity bridge with the actual token
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

  // Retry handler
  const handleRetry = () => {
    setError(null);
    setGameState('loading');
    setRetryCount(prev => prev + 1);
  };

  // Handle Unity iframe load
  const handleUnityLoad = () => {
    setUnityLoaded(true);
    setGameState('playing');
  };

  // Handle play button click
  const handlePlay = () => {
    if (!UNITY_BUILD_URL) {
      setError('Game build not yet available. Coming soon!');
      return;
    }
    setGameState('playing');
  };

  // Render based on state
  const renderContent = () => {
    switch (gameState) {
      case 'loading':
      case 'checking-auth':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4" />
            <p className="text-slate-300">Loading...</p>
          </div>
        );

      case 'not-logged-in':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8">
            <span className="text-6xl mb-4">🔒</span>
            <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
            <p className="text-slate-300 mb-6 text-center">
              Sign in to play games and earn XP for your garden!
            </p>
            <button
              onClick={() => router.push('/login?redirect=/games')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In to Play
            </button>
          </div>
        );

      case 'mobile':
        return (
          <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <span className="text-6xl mb-4">📱</span>
              <h2 className="text-2xl font-bold text-white mb-2">Desktop Only</h2>
              <p className="text-amber-100 mb-4 max-w-md">
                The garden game requires a desktop or laptop computer.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-amber-200 text-sm">
                <span className="bg-amber-800/50 px-3 py-1 rounded-full">💻 Desktop</span>
                <span className="bg-amber-800/50 px-3 py-1 rounded-full">🖥️ Laptop</span>
                <span className="bg-amber-800/50 px-3 py-1 rounded-full">📺 Large Tablet</span>
              </div>
            </div>

            {/* Plant Care Tips while waiting */}
            <div className="bg-amber-950/50 rounded-xl p-5 border border-amber-800/50">
              <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                <span>🌱</span> Plant Care Tips
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💧</span>
                  <div>
                    <p className="text-amber-100 font-medium">Water Wisely</p>
                    <p className="text-amber-200/70 text-sm">
                      Most plants prefer morning watering when it&apos;s cooler.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">☀️</span>
                  <div>
                    <p className="text-amber-100 font-medium">Light Matters</p>
                    <p className="text-amber-200/70 text-sm">
                      Know if your plant loves sun or prefers shade.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🪴</span>
                  <div>
                    <p className="text-amber-100 font-medium">Drainage is Key</p>
                    <p className="text-amber-200/70 text-sm">
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
                className="px-4 py-2 bg-amber-800/50 hover:bg-amber-800 text-amber-100 rounded-lg transition-colors text-sm"
              >
                📖 Browse Community
              </button>
              <button
                onClick={() => router.push('/hobbies/learn')}
                className="px-4 py-2 bg-amber-800/50 hover:bg-amber-800 text-amber-100 rounded-lg transition-colors text-sm"
              >
                📚 Learn & Earn XP
              </button>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-2xl p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 text-8xl">🌱</div>
              <div className="absolute bottom-10 right-10 text-8xl">🌿</div>
              <div className="absolute top-20 right-20 text-6xl">🌻</div>
              <div className="absolute bottom-20 left-20 text-6xl">🌷</div>
            </div>

            <span className="text-7xl mb-4 relative z-10">🏡</span>
            <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Your Garden Awaits</h2>
            <p className="text-emerald-100 mb-6 text-center max-w-md relative z-10">
              Enter your virtual garden, tend to your plants, and earn XP!
            </p>

            {UNITY_BUILD_URL ? (
              <button
                onClick={handlePlay}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:scale-105 relative z-10"
              >
                🎮 Enter Garden
              </button>
            ) : (
              <div className="text-center relative z-10">
                <div className="px-8 py-4 bg-slate-700 text-slate-300 font-semibold rounded-xl mb-3">
                  🚧 Coming Soon
                </div>
                <p className="text-emerald-200 text-sm">Unity build in development</p>
              </div>
            )}

            {error && <p className="text-red-300 mt-4 text-sm relative z-10">{error}</p>}
          </div>
        );

      case 'playing':
        return (
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mb-4" />
                  <p className="text-white text-lg">Loading Garden...</p>
                  <p className="text-slate-400 text-sm mt-2">This may take a moment</p>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <span className="text-8xl mb-4 animate-bounce">🌱</span>
                  <h3 className="text-xl font-bold text-white mb-2">Build Not Available</h3>
                  <p className="text-slate-400 text-center max-w-sm">
                    The Unity game build hasn&apos;t been deployed yet. Check back soon!
                  </p>
                  <button
                    onClick={() => setGameState('ready')}
                    className="mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    ← Go Back
                  </button>
                </div>
              )}
            </div>

            {/* Game Controls Bar */}
            <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGameState('ready')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors flex items-center gap-1"
                >
                  <span>←</span> Exit
                </button>
                <span className="text-slate-400 text-sm hidden sm:inline">
                  Playing as <span className="text-emerald-400">{user?.email || 'Guest'}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {/* Connection indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-slate-500 hidden sm:inline">Connected</span>
                </div>

                <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">🎯</span>
                  <span className="text-emerald-400 font-semibold">+0 XP</span>
                </div>
              </div>
            </div>

            {/* Keyboard hints - desktop only */}
            <div className="bg-slate-950 px-4 py-2 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">WASD</kbd> Move
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">E</kbd> Interact
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">ESC</kbd> Menu
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">F</kbd>{' '}
                Fullscreen
              </span>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-red-900 to-rose-900 rounded-2xl p-8">
            <span className="text-6xl mb-4">⚠️</span>
            <h2 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h2>
            <p className="text-red-100 mb-6 text-center max-w-md">
              {error || "We couldn't load the game. Please try again."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => router.push('/hobbies')}
                className="px-6 py-3 bg-red-800/50 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
              >
                ← Back to Hobbies
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏡 Garden Game</h1>
          <p className="text-slate-400">Grow your virtual garden and earn XP</p>
        </div>

        {/* Main Game Area */}
        <div className="max-w-4xl mx-auto mb-8">{renderContent()}</div>

        {/* Info Section - Only show when not playing */}
        {gameState !== 'playing' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* XP Info Card */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span> How XP Works
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">⏱️</div>
                  <div className="text-emerald-400 font-bold">20 XP</div>
                  <div className="text-slate-400 text-sm">per 30 min session</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-emerald-400 font-bold">120 XP</div>
                  <div className="text-slate-400 text-sm">daily game cap</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-emerald-400 font-bold">3,000 XP</div>
                  <div className="text-slate-400 text-sm">total daily cap</div>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Garden Features
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌻</span>
                  <div>
                    <h3 className="font-semibold text-white">Plant & Grow</h3>
                    <p className="text-slate-400 text-sm">
                      Place pots, plant seeds, and watch them grow
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💧</span>
                  <div>
                    <h3 className="font-semibold text-white">Daily Care</h3>
                    <p className="text-slate-400 text-sm">Water and tend to your plants each day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🏡</span>
                  <div>
                    <h3 className="font-semibold text-white">Customize</h3>
                    <p className="text-slate-400 text-sm">Decorate with benches, paths, and more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🐾</span>
                  <div>
                    <h3 className="font-semibold text-white">Garden Pet</h3>
                    <p className="text-slate-400 text-sm">
                      A friendly companion to help in your garden
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Developer Info - Collapsed by default */}
            <details className="bg-slate-800/30 backdrop-blur rounded-xl border border-slate-700">
              <summary className="px-6 py-4 cursor-pointer text-slate-400 hover:text-white transition-colors">
                🛠️ Developer Info
              </summary>
              <div className="px-6 pb-4 pt-2 border-t border-slate-700 font-mono text-xs text-slate-500 space-y-1">
                <p>• Unity WebGL → iframe embed</p>
                <p>• Auth: window.plobie.getAccessToken()</p>
                <p>• API: GET /api/user/me, POST /api/games/*</p>
                <p>• XP: apply_xp() with daily caps</p>
                <p>• Build URL: {UNITY_BUILD_URL || 'Not configured'}</p>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
