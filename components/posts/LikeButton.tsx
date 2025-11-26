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
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
        liked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
    >
      <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
      <span className="text-sm">{count}</span>
    </button>
  );
}

