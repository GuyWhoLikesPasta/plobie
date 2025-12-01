'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { StatsCardSkeleton } from '@/components/skeletons';
import Link from 'next/link';

export default function MyPlantsPage() {
  const router = useRouter();
  const [pots, setPots] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login?redirect=/my-plants');
      return;
    }

    setIsAuthenticated(true);
    fetchMyPlants();
  };

  const fetchMyPlants = async () => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-gray-400 animate-pulse">Loading your garden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden glass-strong rounded-3xl shadow-2xl p-10 mb-10 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-black mb-3">
              <span className="gradient-text">My Garden</span>
            </h1>
            <p className="text-xl text-gray-300">
              Your digital collection of claimed pottery
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="glass-strong rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500 hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🏺</div>
            <p className="text-4xl font-black text-white">{stats?.totalPots || 0}</p>
            <p className="text-sm text-gray-400 font-medium">Pots Claimed</p>
          </div>
          
          <div className="glass-strong rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-4xl font-black text-white">{stats?.level || 1}</p>
            <p className="text-sm text-gray-400 font-medium">Level</p>
          </div>
          
          <div className="glass-strong rounded-2xl shadow-lg p-6 border-l-4 border-amber-500 hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-4xl font-black text-white">{stats?.totalXP || 0}</p>
            <p className="text-sm text-gray-400 font-medium">Total XP</p>
          </div>
          
          <div className="glass-strong rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500 hover:scale-105 transition-transform">
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-4xl font-black text-white">{stats?.gameSessions || 0}</p>
            <p className="text-sm text-gray-400 font-medium">Game Sessions</p>
          </div>
        </div>

        {/* XP Progress Bar */}
        {stats && (
          <div className="glass-strong rounded-2xl shadow-lg p-8 mb-10 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">
                Level {stats.level} Progress
              </h3>
              <span className="text-sm text-gray-400 font-mono px-4 py-2 glass rounded-full">
                {stats.totalXP % 100} / 100 XP
              </span>
            </div>
            <div className="relative w-full bg-gray-800/50 rounded-full h-6 overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${(stats.totalXP % 100)}%` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        )}

        {/* No Pots State */}
        {(!pots || pots.length === 0) && (
          <div className="glass-strong rounded-3xl shadow-2xl p-16 text-center mb-10 border border-white/10">
            <div className="text-9xl mb-8 animate-float">🏺</div>
            <h2 className="text-4xl font-black text-white mb-4">
              No Pots Claimed Yet
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
              Purchase pottery from our shop or scan a QR code to claim your first pot and start earning XP!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold hover:shadow-glow hover:scale-105 transition-all text-lg"
              >
                🛍️ Shop Pottery
              </Link>
              
              <Link
                href="/claim?code=TEST001"
                className="px-10 py-5 glass-strong text-white rounded-2xl font-bold hover:bg-white/20 hover:scale-105 transition-all text-lg border border-white/20"
              >
                📷 Try Claiming (Test)
              </Link>
            </div>
          </div>
        )}

        {/* Pots Collection */}
        {pots && pots.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-black text-white">
                Your Collection <span className="text-gray-500">({pots.length})</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pots.map((claim: any) => (
                <div
                  key={claim.id}
                  className="glass-strong rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border border-white/10 hover:border-emerald-500/50"
                >
                  <div className="relative aspect-square bg-gradient-to-br from-emerald-900/30 via-purple-900/20 to-cyan-900/30 flex items-center justify-center overflow-hidden">
                    <span className="text-9xl group-hover:scale-110 transition-transform duration-500">🏺</span>
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                      +50 XP
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-black text-white">
                        {claim.pots?.pot_code || 'Unknown'}
                      </h3>
                      <span className="text-xs glass px-3 py-1.5 rounded-full font-bold text-emerald-400 border border-emerald-500/30">
                        Claimed
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-400 mb-6">
                      <p><strong className="text-gray-300">Design:</strong> {claim.pots?.design || 'Classic'}</p>
                      <p><strong className="text-gray-300">Size:</strong> {claim.pots?.size || 'Medium'}</p>
                      <p><strong className="text-gray-300">Claimed:</strong> {new Date(claim.claimed_at).toLocaleDateString()}</p>
                    </div>
                    
                    <button
                      disabled
                      className="w-full py-3 glass text-gray-500 rounded-xl text-sm font-bold cursor-not-allowed border border-white/10"
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
        <section className="relative glass-strong rounded-3xl shadow-2xl p-10 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-black text-white mb-8 text-center">
              🎯 Earn XP & Level Up
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform border border-white/10">
                <p className="font-bold mb-2 text-xl text-white">🏺 Claim a Pot</p>
                <p className="text-sm text-gray-400">+50 XP (one-time per pot)</p>
              </div>
              
              <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform border border-white/10">
                <p className="font-bold mb-2 text-xl text-white">💬 Post in Hobbies</p>
                <p className="text-sm text-gray-400">+3 XP per post (max 5/day)</p>
              </div>
              
              <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform border border-white/10">
                <p className="font-bold mb-2 text-xl text-white">📚 Read Articles</p>
                <p className="text-sm text-gray-400">+1 XP per article (max 5/day)</p>
              </div>
              
              <div className="glass-strong rounded-2xl p-6 hover:scale-105 transition-transform border border-white/10">
                <p className="font-bold mb-2 text-xl text-white">🎮 Play Games</p>
                <p className="text-sm text-gray-400">+2 XP per 30 min (max 4/day)</p>
              </div>
            </div>
            
            <p className="text-center text-gray-400 font-medium text-lg">
              Daily cap: <span className="text-amber-400 font-bold">100 XP</span> total across all activities
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
