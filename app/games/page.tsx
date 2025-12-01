import { requireAuth } from '@/lib/auth';

export default async function GamesPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="relative glass-strong rounded-3xl p-8 md:p-12 mb-8 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-transparent"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">🎮 Games</h1>
            <p className="text-lg md:text-xl text-gray-300">
              Play mini-games, earn XP, grow your garden
            </p>
          </div>
        </div>

        {/* Unity WebGL Integration Notice */}
        <div className="glass-strong border border-cyan-500/30 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-3xl md:text-4xl flex-shrink-0">🎯</span>
            <div>
              <h3 className="font-black text-white text-lg md:text-xl mb-2">
                Unity WebGL Games Coming Soon!
              </h3>
              <p className="text-gray-300 text-sm md:text-base mb-3">
                Interactive garden games will be embedded here. Play 30 min to earn 2 XP (max 4 sessions/day).
              </p>
              <p className="text-gray-500 text-xs md:text-sm font-mono">
                Unity → JS Bridge → /api/game-sessions → XP
              </p>
            </div>
          </div>
        </div>

        {/* Game Previews */}
        <section>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Upcoming Games
          </h2>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plant Puzzle */}
            <div className="glass-strong rounded-2xl shadow-lg overflow-hidden border border-white/10 hover:border-emerald-500/50 transition-all group">
              <div className="aspect-video bg-gradient-to-br from-emerald-900/40 to-green-900/40 flex items-center justify-center relative overflow-hidden">
                <span className="text-8xl group-hover:scale-110 transition-transform">🧩</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-black text-white mb-3">
                  🌱 Plant Puzzle
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Match plants and grow your garden in this relaxing puzzle game.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    <p><strong className="text-emerald-400">XP:</strong> 2 per 30 min</p>
                    <p><strong className="text-amber-400">Daily:</strong> 8 XP max</p>
                  </div>
                  
                  <button
                    disabled
                    className="px-6 py-2 glass text-gray-500 rounded-xl font-bold cursor-not-allowed border border-white/10 w-full sm:w-auto"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Garden Builder */}
            <div className="glass-strong rounded-2xl shadow-lg overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all group">
              <div className="aspect-video bg-gradient-to-br from-cyan-900/40 to-blue-900/40 flex items-center justify-center relative overflow-hidden">
                <span className="text-8xl group-hover:scale-110 transition-transform">🏡</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-black text-white mb-3">
                  🏡 Garden Builder
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  Design and customize your virtual garden with your claimed pots.
                </p>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    <p><strong className="text-emerald-400">XP:</strong> 2 per 30 min</p>
                    <p><strong className="text-amber-400">Daily:</strong> 8 XP max</p>
                  </div>
                  
                  <button
                    disabled
                    className="px-6 py-2 glass text-gray-500 rounded-xl font-bold cursor-not-allowed border border-white/10 w-full sm:w-auto"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* XP Info */}
        <section className="mt-8 glass-strong rounded-2xl shadow-lg p-6 md:p-8 border border-white/10">
          <h2 className="text-3xl font-black text-white mb-6">
            🎯 How Game XP Works
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">⏱️</span>
              <div>
                <h3 className="font-bold text-white mb-2 text-lg">Play Time Tracking</h3>
                <p className="text-sm text-gray-300">
                  Sessions are tracked in 30-minute increments. Each 30 minutes earns you 2 XP.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">🚫</span>
              <div>
                <h3 className="font-bold text-white mb-2 text-lg">Daily Limit</h3>
                <p className="text-sm text-gray-300">
                  Play up to 4 sessions/day (2 hours) for max 8 XP from games.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0">🔒</span>
              <div>
                <h3 className="font-bold text-white mb-2 text-lg">Session Recording</h3>
                <p className="text-sm text-gray-300">
                  Sessions are recorded automatically and XP is awarded when you finish. 
                  100 XP daily cap applies across all activities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

