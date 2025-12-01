'use client';

import { useRouter } from 'next/navigation';

// Sample articles (will move to database later)
const articles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Complete Guide to Indoor Plant Care',
    category: 'Indoor Plants',
    description: 'Learn the fundamentals of keeping your indoor plants healthy and thriving.',
    readTime: '8 min read',
    icon: '🪴',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Succulent & Cacti Care 101',
    category: 'Succulents',
    description: 'Everything you need to know about watering, sunlight, and soil for succulents.',
    readTime: '6 min read',
    icon: '🌵',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Growing Herbs Indoors Year-Round',
    category: 'Herbs & Edibles',
    description: 'A practical guide to growing fresh herbs in your kitchen all year.',
    readTime: '7 min read',
    icon: '🌿',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Orchid Care Mastery',
    category: 'Orchids',
    description: 'Master the art of keeping orchids blooming with this comprehensive guide.',
    readTime: '10 min read',
    icon: '🌸',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Bonsai Basics for Beginners',
    category: 'Bonsai',
    description: 'Start your bonsai journey with this beginner-friendly introduction.',
    readTime: '12 min read',
    icon: '🌳',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Propagation Techniques That Always Work',
    category: 'Propagation',
    description: 'Learn foolproof methods for propagating your favorite plants.',
    readTime: '9 min read',
    icon: '🌱',
  },
];

export default function LearnPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden glass-strong py-16 border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-3">📚 Learn</h1>
          <p className="text-xl md:text-2xl text-gray-300">
            Expand your knowledge and earn <span className="text-cyan-400 font-bold">+1 XP</span> per article (max 5/day)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP Notice */}
        <div className="glass-strong border border-cyan-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <p className="text-gray-300">
              <strong className="text-cyan-400">Earn +1 XP</strong> for each article you read (up to 5 articles per day)
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => router.push(`/hobbies/learn/${article.id}`)}
              className="glass-strong rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer p-6 border border-white/10 hover:border-cyan-500/50 group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{article.icon}</div>
              <div className="text-sm text-cyan-400 font-bold mb-2 px-3 py-1 glass rounded-full inline-block">
                {article.category}
              </div>
              <h3 className="text-2xl font-black text-white mb-3 group-hover:text-cyan-400 transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-300 mb-4 text-sm">
                {article.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{article.readTime}</span>
                <span className="text-cyan-400 font-bold px-3 py-1 glass rounded-full">+1 XP</span>
              </div>
            </div>
          ))}
        </div>

        {/* More Coming Soon */}
        <div className="mt-12 text-center glass-strong rounded-3xl shadow-lg p-12 border border-white/10">
          <div className="text-7xl mb-6 animate-float">🌱</div>
          <h3 className="text-3xl font-black text-white mb-3">
            More Articles Coming Soon
          </h3>
          <p className="text-gray-300 text-lg">
            We're constantly adding new content to help you become a better plant parent!
          </p>
        </div>
      </div>
    </div>
  );
}
