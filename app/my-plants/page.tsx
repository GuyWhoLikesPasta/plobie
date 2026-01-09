'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import { useOnboarding } from '@/hooks/useOnboarding';

interface Pot {
  id: string;
  pot_id: string;
  claimed_at: string;
  pot?: {
    name: string;
    image_url: string;
    artist_name: string;
  };
}

interface Stats {
  totalPots: number;
  totalXP: number;
  level: number;
  gameSessions: number;
  potXP: number;
}

export default function MyPlantsPage() {
  const router = useRouter();
  const [pots, setPots] = useState<Pot[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string>('');
  const { showOnboarding, completeOnboarding, isLoading: onboardingLoading } = useOnboarding();

  const fetchMyPlants = useCallback(async () => {
    try {
      const response = await fetch('/api/my-plants');
      const data = await response.json();

      if (data.success) {
        setPots(data.data.pots);
        setStats(data.data.stats);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Onboarding Modal */}
      {showOnboarding && !onboardingLoading && isAuthenticated && (
        <WelcomeModal username={username} onComplete={completeOnboarding} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 text-white">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">🌿 My Plants</h1>
          <p className="text-base sm:text-xl text-green-100">
            Your digital garden of claimed pottery
          </p>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="text-4xl mb-3">🏺</div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalPots || 0}</p>
            <p className="text-sm text-gray-600">Pots Claimed</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-3xl font-bold text-gray-900">{stats?.level || 1}</p>
            <p className="text-sm text-gray-600">Level</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalXP || 0}</p>
            <p className="text-sm text-gray-600">Total XP</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-3xl font-bold text-gray-900">{stats?.gameSessions || 0}</p>
            <p className="text-sm text-gray-600">Game Sessions</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        {stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Level {stats.level} Progress</h3>
              <span className="text-sm text-gray-600">{stats.totalXP % 100} / 100 XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalXP % 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* No Pots State */}
        {(!pots || pots.length === 0) && (
          <div className="bg-white rounded-xl shadow-xl p-8 sm:p-12 text-center mb-6 sm:mb-8">
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🏺</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              No Pots Claimed Yet
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg max-w-2xl mx-auto">
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Your Collection ({pots.length} {pots.length === 1 ? 'pot' : 'pots'})
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {pots.map((claim: any) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 flex items-center justify-center relative">
                    <span className="text-8xl group-hover:scale-110 transition-transform">🏺</span>
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      +50 XP
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {claim.pots?.pot_code || 'Unknown'}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        Claimed
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p>
                        <strong>Design:</strong> {claim.pots?.design || 'Classic'}
                      </p>
                      <p>
                        <strong>Size:</strong> {claim.pots?.size || 'Medium'}
                      </p>
                      <p>
                        <strong>Claimed:</strong> {new Date(claim.claimed_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      disabled
                      className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
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
        <section className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">🎯 Earn XP & Level Up</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-bold mb-2 text-lg">🏺 Claim a Pot</p>
              <p className="text-sm text-white/90">+50 XP (one-time per pot)</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-bold mb-2 text-lg">💬 Post in Hobbies</p>
              <p className="text-sm text-white/90">+3 XP per post (max 5/day)</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-bold mb-2 text-lg">📚 Read Articles</p>
              <p className="text-sm text-white/90">+1 XP per article (max 5/day)</p>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="font-bold mb-2 text-lg">🎮 Play Games</p>
              <p className="text-sm text-white/90">+2 XP per 30 min (max 4/day)</p>
            </div>
          </div>

          <p className="text-center text-white/90 font-medium">
            Daily cap: 100 XP total across all activities
          </p>
        </section>
      </div>
    </div>
  );
}
