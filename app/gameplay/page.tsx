'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import TopPostsBanner from '@/components/shared/TopPostsBanner';
import PromoRotator from '@/components/shared/PromoRotator';
import LoginPromptBanner from '@/components/shared/LoginPromptBanner';

interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
}

const GAMES: Game[] = [
  {
    id: 'soccer-bubbles',
    name: 'Soccer Bubbles',
    description: 'Classic bubble shooter with a soccer twist',
    url: 'https://play.famobi.com/soccer-bubbles',
  },
  {
    id: 'curve-ball-3d',
    name: 'Curve Ball 3D',
    description: 'Fast-paced 3D pong game',
    url: 'https://play.famobi.com/curve-ball-3d',
  },
  {
    id: 'goalkeeper-champ',
    name: 'Goalkeeper Champ',
    description: 'Test your reflexes as a goalkeeper',
    url: 'https://play.famobi.com/goalkeeper-champ',
  },
  {
    id: 'table-tennis',
    name: 'Table Tennis World Tour',
    description: 'Compete in table tennis worldwide',
    url: 'https://play.famobi.com/table-tennis-world-tour',
  },
  {
    id: 'color-tunnel',
    name: 'Color Tunnel',
    description: 'Navigate through a colorful tunnel',
    url: 'https://play.famobi.com/color-tunnel',
  },
  {
    id: 'soccer-heads',
    name: 'Soccer Heads',
    description: 'Action packed soccer for 1-2 players',
    url: 'https://games.famobi.com/best-games/soccer-heads?technology=web',
  },
  {
    id: 'square-stacker',
    name: 'Square Stacker',
    description: 'Stack squares to build the highest tower',
    url: 'https://play.famobi.com/square-stacker',
  },
  {
    id: 'crazy-hill-driver',
    name: 'Crazy Hill Driver',
    description: 'How fast can you climb the hill?',
    url: 'https://games.famobi.com/webgl-games/crazy-hill-driver?technology=web',
  },
];

const XP_INTERVAL_SECONDS = 1800;

function GameControllerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
      />
    </svg>
  );
}

export default function GamePlayPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const iframeRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const awardXP = useCallback(
    async (game: Game) => {
      if (!user) return;
      try {
        await fetch('/api/xp/award', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: user.id,
            action_type: 'game_play_30m',
            description: `Arcade: ${game.name}`,
          }),
        });
      } catch {
        // XP award is best-effort; don't disrupt gameplay
      }
    },
    [user]
  );

  const startXPTimer = useCallback(
    (game: Game) => {
      if (timerRef.current) clearInterval(timerRef.current);
      elapsedRef.current = 0;

      timerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          elapsedRef.current += 1;
        }
        if (elapsedRef.current >= XP_INTERVAL_SECONDS) {
          awardXP(game);
          elapsedRef.current = 0;
        }
      }, 1000);
    },
    [awardXP]
  );

  const stopXPTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    elapsedRef.current = 0;
  }, []);

  useEffect(() => {
    return () => stopXPTimer();
  }, [stopXPTimer]);

  const handleSelectGame = useCallback(
    (game: Game) => {
      setSelectedGame(game);
      stopXPTimer();

      if (user) {
        startXPTimer(game);
      }

      requestAnimationFrame(() => {
        iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },
    [user, startXPTimer, stopXPTimer]
  );

  const handleCloseGame = useCallback(() => {
    setSelectedGame(null);
    stopXPTimer();
  }, [stopXPTimer]);

  const otherGames = selectedGame ? GAMES.filter(g => g.id !== selectedGame.id) : [];

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
            Game Play
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-500 dark:text-stone-400">
            Plobie Arcade &mdash; play games and earn XP
          </p>
        </div>

        {/* Login prompt */}
        {!authLoading && !user && <LoginPromptBanner context="play" />}

        {/* Active game area */}
        {selectedGame && (
          <section ref={iframeRef} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white truncate">
                {selectedGame.name}
              </h2>
              <button
                onClick={handleCloseGame}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                aria-label="Close game"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* XP badge */}
            {user && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/40 text-green-700 dark:text-green-400 text-xs font-medium">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
                Earn XP for playing! +20 XP per 30 minutes
              </div>
            )}

            {/* Iframe container */}
            <div className="relative bg-stone-100 dark:bg-stone-900 rounded-2xl overflow-hidden shadow-lg shadow-stone-200/50 dark:shadow-stone-950/50 border border-stone-200 dark:border-stone-800">
              <iframe
                src={selectedGame.url}
                title={selectedGame.name}
                className="w-full rounded-2xl"
                style={{ height: '70vh' }}
                allow="autoplay; fullscreen; gamepad"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>

            {/* Other games horizontal scroll */}
            {otherGames.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
                  More games
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {otherGames.map(game => (
                    <button
                      key={game.id}
                      onClick={() => handleSelectGame(game)}
                      className="group shrink-0 w-40 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-left hover:border-green-200 dark:hover:border-green-900/50 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-2 group-hover:bg-green-50 dark:group-hover:bg-green-950/40 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        <GameControllerIcon className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-stone-900 dark:text-white truncate">
                        {game.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Game catalog grid */}
        <section>
          {selectedGame && (
            <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">All Games</h3>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {GAMES.map(game => (
              <div
                key={game.id}
                className={`group relative bg-white dark:bg-stone-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50 ${
                  selectedGame?.id === game.id
                    ? 'border-green-300 dark:border-green-800 ring-1 ring-green-200 dark:ring-green-900/50'
                    : 'border-stone-100 dark:border-stone-800 hover:border-green-200 dark:hover:border-green-900/50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-4 group-hover:bg-green-50 dark:group-hover:bg-green-950/40 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  <GameControllerIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                  {game.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4 line-clamp-2">
                  {game.description}
                </p>
                <button
                  onClick={() => handleSelectGame(game)}
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-medium rounded-xl hover:bg-stone-800 dark:hover:bg-stone-100 transition-all"
                >
                  {selectedGame?.id === game.id ? 'Playing' : 'Play'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-content sections */}
        <div className="space-y-8 pt-4">
          <TopPostsBanner count={3} title="From Plant Hobbies" />
          <PromoRotator />
        </div>
      </div>
    </div>
  );
}
