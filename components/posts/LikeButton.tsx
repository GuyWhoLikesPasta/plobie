'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface LikeButtonProps {
  postId: string;
  initialCount?: number;
  initialLiked?: boolean;
}

export default function LikeButton({
  postId,
  initialCount = 0,
  initialLiked = false,
}: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/hobbies`);
      return;
    }

    setLoading(true);

    try {
      const method = liked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
      });

      const data = await response.json();

      if (data.success) {
        setLiked(data.data.liked);
        setCount(data.data.count);
      } else {
        if (data.error?.code === 'ALREADY_EXISTS') {
          // Already liked, just update UI
          setLiked(true);
        } else if (data.error?.code === 'UNAUTHORIZED') {
          router.push(`/login?redirect=/hobbies`);
        } else {
          console.error('Like error:', data.error?.message);
        }
      }
    } catch (error) {
      console.error('Like request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
        liked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
      } disabled:opacity-50`}
    >
      {liked ? (
        <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-stone-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="text-sm">{count}</span>
    </button>
  );
}
