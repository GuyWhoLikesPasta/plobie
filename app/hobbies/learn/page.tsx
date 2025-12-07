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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">📚 Learn</h1>
          <p className="text-base sm:text-xl text-blue-100">
            Expand your plant knowledge and earn +1 XP per article (cap 5/day)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* XP Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <p className="text-blue-900">
              <strong>Earn +1 XP</strong> for each article you read (up to 5 articles per day)
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => router.push(`/hobbies/learn/${article.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all cursor-pointer p-6"
            >
              <div className="text-5xl mb-4">{article.icon}</div>
              <div className="text-sm text-green-600 font-medium mb-2">
                {article.category}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {article.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                {article.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{article.readTime}</span>
                <span className="text-green-600 font-medium">+1 XP</span>
              </div>
            </div>
          ))}
        </div>

        {/* More Coming Soon */}
        <div className="mt-12 text-center bg-white rounded-lg shadow p-8">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            More Articles Coming Soon
          </h3>
          <p className="text-gray-600">
            We're constantly adding new content to help you become a better plant parent!
          </p>
        </div>
      </div>
    </div>
  );
}

