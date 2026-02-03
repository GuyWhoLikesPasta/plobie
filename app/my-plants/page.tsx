'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { useOnboarding } from '@/hooks/useOnboarding';

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

export default function MyPlantsPage() {
  const router = useRouter();
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

  const fetchMyPlants = useCallback(async () => {
    try {
      // Fetch pots
      const response = await fetch('/api/my-plants');
      const data = await response.json();

      if (data.success) {
        setPots(data.data.pots);
        setStats(data.data.stats);
      }

      // Fetch user plants
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
        router.push('/login?redirect=/my-plants');
        return;
      }

      setIsAuthenticated(true);

      // Get username for onboarding
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 transition-colors">
      {/* Onboarding Modal */}
      {showOnboarding && !onboardingLoading && isAuthenticated && (
        <WelcomeModal username={username} onComplete={completeOnboarding} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">🌿 My Plants</h1>
              <p className="text-base sm:text-xl text-green-100">
                Your digital garden of claimed pottery and growing plants
              </p>
            </div>
            <Link
              href="/plantdex"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition whitespace-nowrap"
            >
              🌱 Browse Plantdex
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-4xl mb-3">🏺</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.totalPots || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pots Claimed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.level || 1}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.totalXP || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.gameSessions || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Game Sessions</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        {stats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Level {stats.level} Progress
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.xpProgress} / {stats.xpNeeded} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                🌱 Growing Plants ({plantStats?.alive || 0} alive)
              </h2>
              <Link
                href="/plantdex"
                className="text-green-600 dark:text-green-400 hover:underline text-sm font-medium"
              >
                + Add More
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userPlants.map(userPlant => (
                <div
                  key={userPlant.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border-l-4 ${
                    userPlant.is_dead
                      ? 'border-gray-400 opacity-60'
                      : userPlant.matured_at
                        ? 'border-yellow-500'
                        : 'border-green-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-4xl">{userPlant.plant?.icon || '🌱'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {userPlant.nickname || userPlant.plant?.name || 'Unknown Plant'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {userPlant.plant?.name}
                      </p>
                    </div>
                    {userPlant.matured_at && !userPlant.is_dead && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                        Mature!
                      </span>
                    )}
                    {userPlant.is_dead && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                        Dead
                      </span>
                    )}
                  </div>

                  {/* Growth Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Growth</span>
                      <span>
                        {userPlant.growth_stage}/{userPlant.plant?.growth_stages || 5}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(userPlant.growth_stage / (userPlant.plant?.growth_stages || 5)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Health & Water */}
                  <div className="mt-2 flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>❤️ Health</span>
                        <span>{userPlant.health}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            userPlant.health > 60
                              ? 'bg-green-500'
                              : userPlant.health > 30
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${userPlant.health}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>💧 Water</span>
                        <span>{userPlant.water_level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            userPlant.water_level > 60
                              ? 'bg-blue-500'
                              : userPlant.water_level > 30
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${userPlant.water_level}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* XP Earned */}
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      Planted {new Date(userPlant.planted_at).toLocaleDateString()}
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                      +{userPlant.xp_earned} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Plants CTA */}
        {(!userPlants || userPlants.length === 0) && isAuthenticated && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6 mb-6 sm:mb-8 text-center">
            <span className="text-5xl">🌱</span>
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              Start Growing!
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">
              Browse the Plantdex and add plants to your garden
            </p>
            <Link
              href="/plantdex"
              className="inline-block mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition"
            >
              Browse Plantdex
            </Link>
          </div>
        )}

        {/* No Pots State */}
        {(!pots || pots.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 sm:p-12 text-center mb-6 sm:mb-8">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🏺</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-3">
              No Pots Claimed Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto">
              Purchase pottery from our shop or scan a QR code to claim your first pot and start
              earning XP!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/shop"
                className="px-8 py-4 min-h-[56px] flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all text-base sm:text-lg shadow-lg"
              >
                🛍️ Shop Pottery
              </Link>

              <Link
                href="/claim?code=TEST001"
                className="px-8 py-4 min-h-[56px] flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all text-base sm:text-lg shadow-lg"
              >
                📷 Try Claiming (Test)
              </Link>
            </div>
          </div>
        )}

        {/* Pots Collection */}
        {pots && pots.length > 0 && (
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                Your Collection ({pots.length} {pots.length === 1 ? 'pot' : 'pots'})
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {pots.map((claim: Pot) => (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl dark:hover:shadow-gray-900/50 transition-all overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center relative">
                    <span className="text-8xl group-hover:scale-110 transition-transform">🏺</span>
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      +500 XP
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {claim.pots?.pot_code || 'Unknown'}
                      </h3>
                      <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full font-medium">
                        Claimed
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <p>
                        <strong className="text-gray-800 dark:text-gray-200">Design:</strong>{' '}
                        {claim.pots?.design || 'Classic'}
                      </p>
                      <p>
                        <strong className="text-gray-800 dark:text-gray-200">Size:</strong>{' '}
                        {claim.pots?.size || 'Medium'}
                      </p>
                      <p>
                        <strong className="text-gray-800 dark:text-gray-200">Claimed:</strong>{' '}
                        {new Date(claim.claimed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      🎮 View in Unity Garden (Coming Soon)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Earn XP Guide */}
        <section className="bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-600 dark:to-orange-600 rounded-xl shadow-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">🎯 Earn XP & Level Up</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">🏺 Claim Pot</p>
              <p className="text-xs text-white/90">+500 XP</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">🌱 Plant New</p>
              <p className="text-xs text-white/90">+50 XP</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">💧 Water Plant</p>
              <p className="text-xs text-white/90">+5 XP</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">🌸 Plant Mature</p>
              <p className="text-xs text-white/90">+100 XP</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">💬 Post</p>
              <p className="text-xs text-white/90">+20 XP</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-3">
              <p className="font-bold mb-1 text-sm">🎮 Play Game</p>
              <p className="text-xs text-white/90">+20 XP/30min</p>
            </div>
          </div>

          <p className="text-center text-white/90 font-medium">
            Daily cap: 3,000 XP total across all activities
          </p>
        </section>
      </div>
    </div>
  );
}
