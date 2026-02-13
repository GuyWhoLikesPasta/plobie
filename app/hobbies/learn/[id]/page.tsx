'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

interface Article {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  read_time: string;
  difficulty: string;
  xp_reward: number;
  content_html: string;
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [articleId, setArticleId] = useState<string>('');
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [marking, setMarking] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      setArticleId(id);

      // Fetch article from API
      try {
        const res = await fetch(`/api/articles/${id}`);
        const data = await res.json();
        if (data.article) {
          setArticle(data.article);
        } else {
          router.push('/hobbies/learn');
          return;
        }
      } catch {
        router.push('/hobbies/learn');
        return;
      }

      // Check auth and read status
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data: existingRead } = await supabase
          .from('article_reads')
          .select('id')
          .eq('user_id', user.id)
          .eq('article_id', id)
          .single();

        if (existingRead) {
          setHasRead(true);
        }
      }
      setLoading(false);
    };

    init();
  }, [params, router]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarkAsRead = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/hobbies/learn/${articleId}`);
      return;
    }

    setMarking(true);

    try {
      const response = await fetch('/api/learn/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: article?.id || articleId }),
      });

      const data = await response.json();

      if (data.success) {
        setHasRead(true);
        toast.success(`Great! You earned +${data.data.xp_awarded} XP for reading this article!`);
        checkAndShowAchievements();
      } else {
        if (data.error?.code === 'ALREADY_EXISTS') {
          setHasRead(true);
          toast.success("You've already read this article!");
        } else {
          toast.error(data.error?.message || 'Failed to mark as read');
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  if (loading || !article) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200 dark:bg-stone-800 z-50">
        <div
          className="h-full bg-green-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/hobbies/learn"
          className="inline-flex items-center gap-2 mb-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Learn
        </Link>

        {/* Article Card */}
        <article className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden mb-6 border border-stone-200 dark:border-stone-700">
          {/* Article Header */}
          <div className="bg-stone-50 dark:bg-stone-800/50 p-8 sm:p-10 border-b border-stone-200 dark:border-stone-700">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                {article.category}
              </span>
              <span className="text-stone-400 dark:text-stone-600">•</span>
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {article.read_time}
              </span>
              <span className="text-stone-400 dark:text-stone-600">•</span>
              <span className="text-sm text-stone-600 dark:text-stone-400">
                {article.difficulty}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
              {article.title}
            </h1>
          </div>

          {/* XP Badge */}
          <div className="px-8 py-4 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2">
              <span className="text-green-800 dark:text-green-200 font-medium">
                {hasRead
                  ? 'Article completed!'
                  : `Earn +${article.xp_reward} XP by completing this article`}
              </span>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6 sm:p-8 lg:p-10 bg-white dark:bg-stone-900">
            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-stone-900 dark:prose-headings:text-white prose-headings:tracking-tight prose-p:text-stone-700 dark:prose-p:text-stone-300 prose-li:text-stone-700 dark:prose-li:text-stone-300"
              dangerouslySetInnerHTML={{ __html: article.content_html }}
            />
          </div>
        </article>

        {/* Mark as Read Button */}
        <div
          className={`rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-stone-200 dark:border-stone-700 ${
            hasRead ? 'bg-stone-100 dark:bg-stone-800' : 'bg-white dark:bg-stone-900'
          }`}
        >
          {hasRead ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight">
                Article Completed!
              </h3>
              <p className="text-stone-600 dark:text-stone-400 mb-4">
                You have earned XP for reading this article
              </p>
              <Link
                href="/hobbies/learn"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
              >
                Read More Articles →
              </Link>
            </div>
          ) : isAuthenticated ? (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
                Finished reading?
              </h3>
              <button
                onClick={handleMarkAsRead}
                disabled={marking}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 shadow-lg"
              >
                {marking ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Marking...
                  </span>
                ) : (
                  `Mark as Read (+${article.xp_reward} XP)`
                )}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
                Log in to earn XP for reading
              </h3>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/learn/${articleId}`)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg"
              >
                Log In to Earn XP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
