'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Sample articles (will move to database later)
const articles = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Complete Guide to Indoor Plant Care',
    category: 'Indoor Plants',
    description: 'Learn the fundamentals of keeping your indoor plants healthy and thriving.',
    readTime: '8 min read',
    icon: '🪴',
    difficulty: 'Beginner',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Succulent & Cacti Care 101',
    category: 'Succulents',
    description: 'Everything you need to know about watering, sunlight, and soil for succulents.',
    readTime: '6 min read',
    icon: '🌵',
    difficulty: 'Beginner',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Growing Herbs Indoors Year-Round',
    category: 'Herbs & Edibles',
    description: 'A practical guide to growing fresh herbs in your kitchen all year.',
    readTime: '7 min read',
    icon: '🌿',
    difficulty: 'Intermediate',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'Orchid Care Mastery',
    category: 'Orchids',
    description: 'Master the art of keeping orchids blooming with this comprehensive guide.',
    readTime: '10 min read',
    icon: '🌸',
    difficulty: 'Advanced',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'Bonsai Basics for Beginners',
    category: 'Bonsai',
    description: 'Start your bonsai journey with this beginner-friendly introduction.',
    readTime: '12 min read',
    icon: '🌳',
    difficulty: 'Intermediate',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Propagation Techniques That Always Work',
    category: 'Propagation',
    description: 'Learn foolproof methods for propagating your favorite plants.',
    readTime: '9 min read',
    icon: '🌱',
    difficulty: 'Beginner',
  },
];

// Get unique categories
const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

// Difficulty colors
const difficultyColors: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Advanced: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

export default function LearnPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchProgress = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        // Fetch read articles
        const { data: reads } = await supabase
          .from('article_reads')
          .select('article_id')
          .eq('user_id', user.id);

        if (reads) {
          setReadArticles(reads.map(r => r.article_id));
        }
      }
      setLoading(false);
    };

    checkAuthAndFetchProgress();
  }, []);

  const filteredArticles =
    selectedCategory === 'All' ? articles : articles.filter(a => a.category === selectedCategory);

  const readCount = articles.filter(a => readArticles.includes(a.id)).length;
  const progressPercent = Math.round((readCount / articles.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">📚 Learn</h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-6">
            Expand your plant knowledge and earn XP
          </p>

          {/* Progress Bar (only show if authenticated) */}
          {isAuthenticated && !loading && (
            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-100">Your Progress</span>
                <span className="font-semibold">
                  {readCount}/{articles.length} articles read
                </span>
              </div>
              <div className="h-3 bg-blue-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⭐</div>
            <div>
              <p className="text-blue-900 dark:text-blue-100 font-semibold">
                Earn +1 XP for each article you read
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Up to 5 articles per day • Knowledge is power!
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const isRead = readArticles.includes(article.id);

              return (
                <div
                  key={article.id}
                  onClick={() => router.push(`/hobbies/learn/${article.id}`)}
                  className={`group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl dark:shadow-gray-900/50 transition-all cursor-pointer overflow-hidden ${
                    isRead ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-6">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {article.icon}
                    </div>

                    {/* Read Badge */}
                    {isRead && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Read
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5">
                    {/* Category & Difficulty */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {article.category}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[article.difficulty]}`}
                      >
                        {article.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {article.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-500">{article.readTime}</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {isRead ? '✓ Complete' : '+1 XP'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredArticles.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No articles in this category yet.
            </p>
          </div>
        )}

        {/* More Coming Soon */}
        <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-8 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            More Articles Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            We&apos;re constantly adding new content to help you become a better plant parent!
          </p>
        </div>
      </div>
    </div>
  );
}
