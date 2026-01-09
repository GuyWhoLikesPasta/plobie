'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Unity WebGL container dimensions
const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;

// Placeholder URL until James sends the Firebase link
const UNITY_BUILD_URL = process.env.NEXT_PUBLIC_UNITY_BUILD_URL || '';

type GameState =
  | 'loading'
  | 'checking-auth'
  | 'not-logged-in'
  | 'mobile'
  | 'ready'
  | 'playing'
  | 'error';

export default function GamesPage() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unityLoaded, setUnityLoaded] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check auth and device on mount
  useEffect(() => {
    const checkRequirements = async () => {
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
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setGameState('not-logged-in');
        return;
      }

      setUser(authUser);
      setGameState('ready');
    };

    checkRequirements();
  }, [supabase.auth]);

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
          <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-8">
            <span className="text-6xl mb-4">📱</span>
            <h2 className="text-2xl font-bold text-white mb-2">Desktop Only</h2>
            <p className="text-amber-100 mb-4 text-center max-w-md">
              The garden game requires a desktop or laptop computer. Please visit on a larger screen
              to play!
            </p>
            <div className="flex gap-3 text-amber-200 text-sm">
              <span>💻 Desktop</span>
              <span>•</span>
              <span>🖥️ Laptop</span>
              <span>•</span>
              <span>📺 Tablet (landscape)</span>
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
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGameState('ready')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                >
                  ← Exit Game
                </button>
                <span className="text-slate-400 text-sm">
                  Playing as <span className="text-emerald-400">{user?.email || 'Guest'}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">🎯 XP earned this session: </span>
                <span className="text-emerald-400 font-semibold">0</span>
              </div>
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
                  <div className="text-emerald-400 font-bold">2 XP</div>
                  <div className="text-slate-400 text-sm">per 30 min session</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-emerald-400 font-bold">8 XP</div>
                  <div className="text-slate-400 text-sm">daily game cap</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-emerald-400 font-bold">100 XP</div>
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
