'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  difficulty: string;
  read_time: string;
  xp_reward: number;
}

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  Intermediate: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
  Advanced: 'bg-stone-300 text-stone-800 dark:bg-stone-600 dark:text-stone-200',
};

export default function LearnPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) return;
      const data = await res.json();
      if (data.articles && Array.isArray(data.articles)) {
        setArticles(data.articles);
        const cats = ['All', ...Array.from(new Set(data.articles.map((a: Article) => a.category)))];
        setCategories(cats as string[]);
      }
    } catch {
      // Silently fail -- articles just won't load
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchArticles();

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
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

    init();
  }, [fetchArticles]);

  const filteredArticles =
    selectedCategory === 'All' ? articles : articles.filter(a => a.category === selectedCategory);

  const readCount = articles.filter(a => readArticles.includes(a.id)).length;
  const progressPercent = articles.length > 0 ? Math.round((readCount / articles.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Hero Section */}
      <div className="bg-stone-100 dark:bg-stone-900/80 border-b border-stone-200 dark:border-stone-800 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white tracking-tight mb-3">
            Learn
          </h1>
          <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 mb-6">
            Expand your plant knowledge and earn XP
          </p>

          {isAuthenticated && !loading && (
            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-stone-600 dark:text-stone-400">Your Progress</span>
                <span className="font-semibold text-stone-900 dark:text-white">
                  {readCount}/{articles.length} articles read
                </span>
              </div>
              <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 dark:bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* XP Notice */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-stone-900 dark:text-white font-semibold tracking-tight">
                Earn +10 XP for each article you read
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-sm">
                Up to 10 articles per day
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-green-600 dark:bg-green-500 text-white'
                    : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800'
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
              <div
                key={i}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse"
              >
                <div className="w-16 h-16 bg-stone-200 dark:bg-stone-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded mb-2 w-1/3"></div>
                <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded mb-4 w-full"></div>
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const isRead = readArticles.includes(article.id);

              return (
                <Link
                  key={article.id}
                  href={`/hobbies/learn/${article.slug}`}
                  className={`group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl hover:border-stone-300 dark:hover:border-stone-700 transition-all overflow-hidden ${
                    isRead ? 'ring-2 ring-green-500 dark:ring-green-400' : ''
                  }`}
                >
                  <div className="relative bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800 p-6">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                      {article.icon}
                    </div>
                    {isRead && (
                      <div className="absolute top-3 right-3 bg-green-600 dark:bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
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

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {article.category}
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">•</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[article.difficulty]}`}
                      >
                        {article.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-sm text-stone-600 dark:text-stone-400 mb-4 line-clamp-2">
                      {article.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-500 dark:text-stone-500">
                        {article.read_time}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {isRead ? '✓ Complete' : `+${article.xp_reward} XP`}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && filteredArticles.length === 0 && (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-stone-400 dark:text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-lg">
              No articles in this category yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
