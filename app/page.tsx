import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            🌱 Welcome to Plobie
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Plant-Centered Social Commerce
          </p>
          <p className="text-lg text-gray-700 mb-12">
            Connect with plant lovers, grow your digital garden, and shop for beautiful pottery
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transition"
            >
              Browse Shop
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything You Need
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Shop */}
          <Link href="/shop" className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Shop</h3>
            <p className="text-gray-600">
              Browse beautiful handcrafted pottery and plant accessories
            </p>
          </Link>

          {/* Hobbies */}
          <Link href="/hobbies" className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-5xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Hobbies</h3>
            <p className="text-gray-600">
              Join interest groups and share your plant journey
            </p>
          </Link>

          {/* My Plants */}
          <Link href="/my-plants" className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">My Plants</h3>
            <p className="text-gray-600">
              Track your pottery collection and digital garden
            </p>
          </Link>

          {/* Games */}
          <Link href="/games" className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
            <div className="text-5xl mb-4">🎮</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Games</h3>
            <p className="text-gray-600">
              Play mini-games and earn XP for your garden
            </p>
          </Link>
        </div>
      </section>

      {/* XP System Teaser */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">🎯 Earn XP & Grow</h2>
          <p className="text-lg mb-6">
            Engage with the community, claim pots, play games, and level up your digital garden
          </p>
          <div className="flex gap-6 justify-center text-sm">
            <div>
              <p className="font-semibold">+50 XP</p>
              <p className="opacity-90">Claim a Pot</p>
            </div>
            <div>
              <p className="font-semibold">+3 XP</p>
              <p className="opacity-90">Create a Post</p>
            </div>
            <div>
              <p className="font-semibold">+2 XP</p>
              <p className="opacity-90">Play Games</p>
            </div>
            <div>
              <p className="font-semibold">+1 XP</p>
              <p className="opacity-90">Read Articles</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Ready to Start Your Plant Journey?
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Join our community of plant lovers today
        </p>
        <Link
          href="/signup"
          className="inline-block px-12 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition"
        >
          Sign Up Free
        </Link>
      </section>
    </div>
  );
}
