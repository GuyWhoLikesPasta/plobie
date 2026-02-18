'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { useOnboarding } from '@/hooks/useOnboarding';
import UnityEmbed from '@/components/games/UnityEmbed';
import TopPostsBanner from '@/components/shared/TopPostsBanner';
import PromoRotator from '@/components/shared/PromoRotator';
import LoginPromptBanner from '@/components/shared/LoginPromptBanner';
import PlantdexView from '@/components/plantdex/PlantdexView';

interface PotDetails {
  pot_code?: string;
  design?: string;
  size?: string;
  name?: string;
  image_url?: string;
  artist_name?: string;
}

interface Pot {
  id: string;
  pot_id: string;
  claimed_at: string;
  pot?: PotDetails;
  pots?: PotDetails;
}

interface Stats {
  totalPots: number;
  totalXP: number;
  level: number;
  xpProgress: number;
  xpNeeded: number;
  gameSessions: number;
  potXP: number;
}

interface PlantSpecies {
  id: string;
  key: string;
  name: string;
  icon: string;
  growth_stages: number;
}

interface UserPlant {
  id: string;
  nickname: string | null;
  growth_stage: number;
  health: number;
  water_level: number;
  last_watered_at: string;
  planted_at: string;
  matured_at: string | null;
  is_dead: boolean;
  xp_earned: number;
  plant: PlantSpecies;
}

function MyPlantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'plantdex' ? 'plantdex' : 'garden';
  const [activeTab, setActiveTab] = useState<'garden' | 'plantdex'>(initialTab);
  const [pots, setPots] = useState<Pot[]>([]);
  const [userPlants, setUserPlants] = useState<UserPlant[]>([]);
  const [plantStats, setPlantStats] = useState<{
    total: number;
    alive: number;
    mature: number;
    totalXpEarned: number;
  } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>('');
  const { showOnboarding, completeOnboarding, isLoading: onboardingLoading } = useOnboarding();

  const handleTabChange = (tab: 'garden' | 'plantdex') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'plantdex') {
      url.searchParams.set('tab', 'plantdex');
    } else {
      url.searchParams.delete('tab');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const fetchMyPlants = useCallback(async () => {
    try {
      const response = await fetch('/api/my-plants');
      const data = await response.json();

      if (data.success) {
        setPots(data.data.pots);
        setStats(data.data.stats);
      }

      const plantsResponse = await fetch('/api/user/plants');
      const plantsData = await plantsResponse.json();

      if (plantsData.success) {
        setUserPlants(plantsData.plants || []);
        setPlantStats(plantsData.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch my plants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile?.username) {
        setUsername(profile.username);
      }

      fetchMyPlants();
    };

    checkAuth();
  }, [router, fetchMyPlants]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Onboarding Modal */}
      {showOnboarding && !onboardingLoading && isAuthenticated && (
        <WelcomeModal username={username} onComplete={completeOnboarding} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-stone-900 dark:text-white tracking-tight">
                My Plants
              </h1>
              <p className="text-base sm:text-xl text-stone-600 dark:text-stone-400">
                Your digital garden of claimed pottery and growing plants
              </p>
            </div>
            <Link
              href="/my-plants?tab=plantdex"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition whitespace-nowrap"
            >
              Browse Plantdex
            </Link>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex gap-2 mb-6 sm:mb-8">
          <button
            onClick={() => handleTabChange('garden')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'garden'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            My Garden
          </button>
          <button
            onClick={() => handleTabChange('plantdex')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'plantdex'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }`}
          >
            Plantdex
          </button>
        </div>

        {/* ── My Garden Tab ── */}
        {activeTab === 'garden' && (
          <>
            {/* Unity Game Embed or Login Prompt */}
            <section className="mb-6 sm:mb-8">
              {isAuthenticated ? (
                <UnityEmbed redirectPath="/my-plants" />
              ) : (
                <LoginPromptBanner context="play" />
              )}
            </section>

            {/* Top Posts Banner */}
            <section className="mb-6 sm:mb-8">
              <TopPostsBanner count={3} title="From Plant Hobbies" />
            </section>

            {/* Authenticated Dashboard Content */}
            {isAuthenticated && (
              <>
                {/* Stats Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-800 border-t-4 border-t-green-500">
                    <p className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
                      {stats?.totalPots || 0}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Pots Claimed</p>
                  </div>

                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-800">
                    <p className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
                      {stats?.level || 1}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Level</p>
                  </div>

                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-800">
                    <p className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
                      {stats?.totalXP || 0}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Total XP</p>
                  </div>

                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg p-6 border border-stone-200 dark:border-stone-800">
                    <p className="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
                      {stats?.gameSessions || 0}
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Game Sessions</p>
                  </div>
                </div>

                {/* XP Progress Bar */}
                {stats && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg p-6 mb-8 border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight">
                        Level {stats.level} Progress
                      </h3>
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {stats.xpProgress} / {stats.xpNeeded} XP
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-xl h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-3 rounded-xl transition-all duration-500"
                        style={{
                          width: `${stats.xpNeeded > 0 ? (stats.xpProgress / stats.xpNeeded) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* User Plants Section */}
                {userPlants && userPlants.length > 0 && (
                  <section className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                        Growing Plants ({plantStats?.alive || 0} alive)
                      </h2>
                      <Link
                        href="/my-plants?tab=plantdex"
                        className="text-green-600 dark:text-green-400 hover:underline text-sm font-medium"
                      >
                        + Add More
                      </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {userPlants.map(userPlant => (
                        <div
                          key={userPlant.id}
                          className={`bg-white dark:bg-stone-900 rounded-xl shadow-lg p-4 border border-stone-200 dark:border-stone-800 ${
                            userPlant.is_dead ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                              <svg
                                className="w-7 h-7 text-green-600 dark:text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-stone-900 dark:text-white truncate tracking-tight">
                                {userPlant.nickname || userPlant.plant?.name || 'Unknown Plant'}
                              </h3>
                              <p className="text-xs text-stone-600 dark:text-stone-400">
                                {userPlant.plant?.name}
                              </p>
                            </div>
                            {userPlant.matured_at && !userPlant.is_dead && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-lg font-medium">
                                Mature
                              </span>
                            )}
                            {userPlant.is_dead && (
                              <span className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-lg">
                                Dead
                              </span>
                            )}
                          </div>

                          {/* Growth Progress */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
                              <span>Growth</span>
                              <span>
                                {userPlant.growth_stage}/{userPlant.plant?.growth_stages || 5}
                              </span>
                            </div>
                            <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-xl h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-2 rounded-xl transition-all"
                                style={{
                                  width: `${(userPlant.growth_stage / (userPlant.plant?.growth_stages || 5)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Health & Water */}
                          <div className="mt-2 flex gap-2">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
                                <span>Health</span>
                                <span>{userPlant.health}%</span>
                              </div>
                              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-xl h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-xl transition-all ${
                                    userPlant.health > 60
                                      ? 'bg-green-500'
                                      : userPlant.health > 30
                                        ? 'bg-green-400'
                                        : 'bg-stone-500'
                                  }`}
                                  style={{ width: `${userPlant.health}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
                                <span>Water</span>
                                <span>{userPlant.water_level}%</span>
                              </div>
                              <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-xl h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-xl transition-all ${
                                    userPlant.water_level > 60
                                      ? 'bg-green-500'
                                      : userPlant.water_level > 30
                                        ? 'bg-green-400'
                                        : 'bg-stone-500'
                                  }`}
                                  style={{ width: `${userPlant.water_level}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* XP Earned */}
                          <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
                            <span className="text-stone-600 dark:text-stone-400">
                              Planted {new Date(userPlant.planted_at).toLocaleDateString()}
                            </span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              +{userPlant.xp_earned} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* No Plants CTA */}
                {(!userPlants || userPlants.length === 0) && (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-6 sm:mb-8 text-center">
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight">
                      Start Growing
                    </h3>
                    <p className="mt-1 text-stone-600 dark:text-stone-400 text-sm">
                      Browse the Plantdex and add plants to your garden
                    </p>
                    <Link
                      href="/my-plants?tab=plantdex"
                      className="inline-block mt-4 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition"
                    >
                      Browse Plantdex
                    </Link>
                  </div>
                )}

                {/* No Pots State */}
                {(!pots || pots.length === 0) && (
                  <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 p-8 sm:p-12 text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight">
                      No Pots Claimed Yet
                    </h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto">
                      Purchase pottery from our shop or scan a QR code to claim your first pot and
                      start earning XP!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <Link
                        href="/shop"
                        className="px-8 py-4 min-h-[56px] flex items-center justify-center bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all text-base sm:text-lg shadow-lg"
                      >
                        Shop Pottery
                      </Link>
                    </div>
                  </div>
                )}

                {/* Pots Collection */}
                {pots && pots.length > 0 && (
                  <section className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
                        Your Collection ({pots.length} {pots.length === 1 ? 'pot' : 'pots'})
                      </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {pots.map((claim: Pot) => (
                        <div
                          key={claim.id}
                          className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 hover:shadow-xl transition-all overflow-hidden"
                        >
                          <div className="aspect-square bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center relative">
                            <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                              +500 XP
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                                {claim.pots?.pot_code || 'Unknown'}
                              </h3>
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg font-medium">
                                Claimed
                              </span>
                            </div>

                            <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400 mb-4">
                              <p>
                                <strong className="text-stone-900 dark:text-white">Design:</strong>{' '}
                                {claim.pots?.design || 'Classic'}
                              </p>
                              <p>
                                <strong className="text-stone-900 dark:text-white">Size:</strong>{' '}
                                {claim.pots?.size || 'Medium'}
                              </p>
                              <p>
                                <strong className="text-stone-900 dark:text-white">Claimed:</strong>{' '}
                                {new Date(claim.claimed_at).toLocaleDateString()}
                              </p>
                            </div>

                            <button
                              disabled
                              className="w-full py-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 rounded-xl text-sm font-medium cursor-not-allowed"
                            >
                              View in Unity Garden
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Earn XP Guide */}
                <section className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-800 p-8">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-6 tracking-tight">
                    Earn XP & Level Up
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Claim Pot
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+500 XP</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Plant New
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+50 XP</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Water Plant
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+5 XP</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Plant Mature
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+100 XP</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Post
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+20 XP</p>
                    </div>

                    <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                      <p className="font-semibold mb-1 text-sm text-stone-900 dark:text-white">
                        Play Game
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400">+20 XP/30min</p>
                    </div>
                  </div>

                  <p className="text-center text-stone-600 dark:text-stone-400 font-medium text-sm">
                    Daily cap: 3,000 XP total across all activities
                  </p>
                </section>
              </>
            )}

            {/* Promo Rotator */}
            <section className="mt-6 sm:mt-8">
              <PromoRotator />
            </section>
          </>
        )}

        {/* ── Plantdex Tab ── */}
        {activeTab === 'plantdex' && <PlantdexView />}
      </div>
    </div>
  );
}

export default function MyPlantsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <MyPlantsContent />
    </Suspense>
  );
}
