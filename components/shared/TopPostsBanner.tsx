'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TopPost {
  id: string;
  title: string;
  hobby_group: string;
  like_count: number;
  comment_count: number;
}

interface TopPostsBannerProps {
  count?: number;
  title?: string;
  showContinueLink?: boolean;
  continueHref?: string;
}

export default function TopPostsBanner({
  count = 3,
  title = 'Top Posts',
  showContinueLink = false,
  continueHref = '/hobbies',
}: TopPostsBannerProps) {
  const [posts, setPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTopPosts = async () => {
      try {
        const res = await fetch(`/api/posts/top?limit=${count}&days=7`);
        const data = await res.json();
        if (data.success) {
          setPosts(data.data.posts);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPosts();
  }, [count]);

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">{title}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="min-w-[240px] sm:min-w-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 animate-pulse"
            >
              <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-lg w-16 mb-3" />
              <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-4" />
              <div className="flex gap-4">
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-12" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-14" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-stone-900 dark:text-white mb-4">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/hobbies/posts/${post.id}`}
            className="group min-w-[240px] sm:min-w-0 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-green-200 dark:hover:border-green-900/50 transition-all"
          >
            <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1.5">
              p/{post.hobby_group}
            </p>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3 line-clamp-2 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
              {post.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {post.like_count}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                  />
                </svg>
                {post.comment_count}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {showContinueLink && (
        <div className="mt-4 text-right">
          <Link
            href={continueHref}
            className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          >
            View all posts
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}
