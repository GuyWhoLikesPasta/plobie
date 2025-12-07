import { requireAuth } from '@/lib/auth';

export default async function GamesPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 sm:p-8 mb-6 sm:mb-8 text-white">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">🎮 Games</h1>
          <p className="text-sm sm:text-base text-indigo-100">
            Play mini-games, earn XP, and grow your digital garden
          </p>
        </div>

        {/* Unity WebGL Integration Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Unity WebGL Games Coming Soon!
              </h3>
              <p className="text-blue-800 text-sm mb-2">
                Interactive garden games will be embedded here using Unity WebGL. 
                Play for 30 minutes to earn 2 XP (max 4 sessions per day).
              </p>
              <p className="text-blue-700 text-xs">
                Integration: Unity → JS Bridge → `/api/game-sessions` → XP system
              </p>
            </div>
          </div>
        </div>

        {/* Game Previews */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            Upcoming Games
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Plant Puzzle */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center">
                <span className="text-7xl">🧩</span>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  🌱 Plant Puzzle
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Match plants and grow your garden in this relaxing puzzle game.
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p><strong>XP:</strong> 2 per 30 min</p>
                    <p><strong>Daily Cap:</strong> 8 XP max</p>
                  </div>
                  
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Garden Builder */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center">
                <span className="text-7xl">🏡</span>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  🏡 Garden Builder
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Design and customize your virtual garden with your claimed pots.
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p><strong>XP:</strong> 2 per 30 min</p>
                    <p><strong>Daily Cap:</strong> 8 XP max</p>
                  </div>
                  
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* XP Info */}
        <section className="mt-8 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 How Game XP Works
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-semibold mb-1">Play Time Tracking</h3>
                <p className="text-sm text-gray-600">
                  Games track your session time in 30-minute increments. Each 30 minutes earns you 2 XP.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-semibold mb-1">Daily Limit</h3>
                <p className="text-sm text-gray-600">
                  You can play up to 4 sessions per day (2 hours total) for a maximum of 8 XP from games.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold mb-1">Session Recording</h3>
                <p className="text-sm text-gray-600">
                  Game sessions are recorded automatically and XP is awarded when you finish playing. 
                  All XP follows the same 100 XP daily cap across all activities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Info (for development) */}
        <section className="mt-8 bg-gray-100 rounded-lg p-6 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">🛠️ For Developers</h3>
          <div className="space-y-1 font-mono text-xs">
            <p>• Unity WebGL builds will be embedded in iframe/WebGL canvas</p>
            <p>• JS Bridge: Unity → `window.plobie.recordGameSession(slug, minutes)`</p>
            <p>• API: POST `/api/game-sessions` with RecordGameSessionSchema validation</p>
            <p>• XP applied via `apply_xp()` stored procedure with cooldown enforcement</p>
          </div>
        </section>
      </div>
    </div>
  );
}

