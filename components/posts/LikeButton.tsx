'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface LikeButtonProps {
  postId: string;
  initialCount?: number;
  initialLiked?: boolean;
}

export default function LikeButton({ postId, initialCount = 0, initialLiked = false }: LikeButtonProps) {
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
    const { data: { user } } = await supabase.auth.getUser();
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
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all min-h-[44px] ${
        liked
          ? 'glass text-red-400 border border-red-500/30 hover:bg-red-500/10'
          : 'glass text-gray-300 border border-white/10 hover:bg-white/10'
      } disabled:opacity-50`}
    >
      <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
      <span className="text-sm font-bold">{count}</span>
    </button>
  );
}

