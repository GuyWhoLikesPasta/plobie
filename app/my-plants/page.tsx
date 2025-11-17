import { requireAuth } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MyPlantsPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  
  // Fetch user's claimed pots
  const { data: pots } = await supabase
    .from('pots')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🌿 My Plants</h1>
          <p className="text-green-100">
            Your digital garden of claimed pottery
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🏺</div>
            <p className="text-2xl font-bold text-gray-900">{pots?.length || 0}</p>
            <p className="text-sm text-gray-600">Total Pots</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🎮</div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Game Sessions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-600">Total XP</p>
          </div>
        </div>

        {/* No Pots State */}
        {(!pots || pots.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏺</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Pots Claimed Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Purchase pottery from our shop or scan a QR code to claim your first pot!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                🛍️ Shop Pottery
              </Link>
              
              <button
                disabled
                className="px-6 py-3 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
              >
                📷 Scan QR Code (Coming Soon)
              </button>
            </div>
          </div>
        )}

        {/* Pots Grid */}
        {pots && pots.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Your Collection
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pots.map((pot: any) => (
                <div
                  key={pot.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <span className="text-6xl">🏺</span>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Pot #{pot.code}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Claimed
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Design:</strong> {pot.design || 'Classic'}</p>
                      <p><strong>Size:</strong> {pot.size || 'Medium'}</p>
                      <p><strong>Claimed:</strong> {new Date(pot.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    <button
                      disabled
                      className="w-full mt-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      View in Garden (Coming Soon)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Earn XP Section */}
        <section className="mt-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">🎯 Earn XP & Grow Your Garden</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-semibold mb-1">🏺 Claim a Pot</p>
              <p className="text-sm text-white/90">+50 XP (one-time)</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-semibold mb-1">🎮 Play Garden Games</p>
              <p className="text-sm text-white/90">+2 XP per 30 min (max 4/day)</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-semibold mb-1">💬 Post in Hobbies</p>
              <p className="text-sm text-white/90">+3 XP per post (max 5/day)</p>
            </div>
            
            <div className="bg-white/20 rounded-lg p-4">
              <p className="font-semibold mb-1">📚 Read Learn Articles</p>
              <p className="text-sm text-white/90">+1 XP per article (max 5/day)</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-white/90">
            Daily cap: 100 XP total
          </p>
        </section>
      </div>
    </div>
  );
}

