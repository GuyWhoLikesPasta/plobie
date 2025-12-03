import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-cyan-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]"></div>
      
      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-32 text-center">
        <div className="max-w-5xl mx-auto animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 glass rounded-full mb-8 text-sm font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-emerald-400">Plant-Centered Social Commerce</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-7xl md:text-8xl font-black mb-6 leading-tight">
            <span className="gradient-text">Grow Together</span>
            <br />
            <span className="text-white">With Plobie</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Connect with plant lovers worldwide, build your digital garden, earn XP,
            and discover beautiful handcrafted pottery
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group relative px-10 py-5 min-h-[56px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold text-lg hover:shadow-glow hover:scale-105 transition-all overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
            >
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>
            <Link
              href="/shop"
              className="px-10 py-5 min-h-[56px] glass-strong text-white rounded-2xl font-bold text-lg hover:border-emerald-400/50 hover:scale-105 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              Explore Shop →
            </Link>
          </div>
        </div>
        
        {/* Floating emoji decorations */}
        <div className="absolute top-20 left-10 text-6xl animate-float" style={{ animationDelay: '0s' }}>🌱</div>
        <div className="absolute top-40 right-20 text-5xl animate-float" style={{ animationDelay: '1s' }}>🏺</div>
        <div className="absolute bottom-20 left-1/4 text-4xl animate-float" style={{ animationDelay: '2s' }}>🌿</div>
      </section>

      {/* Features Bento Grid */}
      <section className="relative container mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-4">
          Everything You Need
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          All the tools to grow your plant community
        </p>
        
        <div className="bento-grid max-w-7xl mx-auto">
          {/* Shop - Large */}
          <Link href="/shop" className="bento-item md:col-span-2 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🛍️</div>
              <h3 className="text-3xl font-bold text-white mb-3">Shop</h3>
              <p className="text-gray-400 text-lg">
                Browse curated collection of handcrafted pottery and premium plant accessories
              </p>
            </div>
          </Link>

          {/* Hobbies */}
          <Link href="/hobbies" className="bento-item group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="text-2xl font-bold text-white mb-3">Community</h3>
              <p className="text-gray-400">
                Join hobby groups, share your journey, earn XP
              </p>
            </div>
          </Link>

          {/* My Plants */}
          <Link href="/my-plants" className="bento-item group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🌿</div>
              <h3 className="text-2xl font-bold text-white mb-3">My Plants</h3>
              <p className="text-gray-400">
                Track collection, level up, manage your garden
              </p>
            </div>
          </Link>

          {/* Games - Large */}
          <Link href="/games" className="bento-item md:col-span-2 group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
              <h3 className="text-3xl font-bold text-white mb-3">Games & Unity Garden</h3>
              <p className="text-gray-400 text-lg">
                Play mini-games, explore your 3D garden, and earn rewards
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* XP System Showcase */}
      <section className="relative container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto glass-strong rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10"></div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              🎯 Earn XP, Level Up, Grow
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Every action grows your garden and unlocks rewards
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-3">🏺</div>
                <p className="text-3xl font-bold text-emerald-400 mb-2">+50 XP</p>
                <p className="text-gray-400 text-sm">Claim a Pot</p>
              </div>
              
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-3xl font-bold text-cyan-400 mb-2">+3 XP</p>
                <p className="text-gray-400 text-sm">Create Post</p>
              </div>
              
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-3">🎮</div>
                <p className="text-3xl font-bold text-purple-400 mb-2">+2 XP</p>
                <p className="text-gray-400 text-sm">Play Games</p>
              </div>
              
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform">
                <div className="text-5xl mb-3">📚</div>
                <p className="text-3xl font-bold text-pink-400 mb-2">+1 XP</p>
                <p className="text-gray-400 text-sm">Read Article</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative container mx-auto px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Grow Your
            <br />
            <span className="gradient-text">Digital Garden?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of plant lovers building their collection
          </p>
          <Link
            href="/signup"
            className="inline-block px-12 py-6 min-h-[60px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold text-xl hover:shadow-glow hover:scale-105 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
          >
            Sign Up Free →
          </Link>
        </div>
      </section>
    </div>
  );
}
