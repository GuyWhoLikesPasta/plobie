'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface SuperlikeButtonProps {
  postId: string;
  postAuthorId: string;
  initialCount?: number;
  initialSuperliked?: boolean;
  onPurchaseNeeded?: () => void;
}

export default function SuperlikeButton({
  postId,
  postAuthorId,
  initialCount = 0,
  initialSuperliked = false,
  onPurchaseNeeded,
}: SuperlikeButtonProps) {
  const router = useRouter();
  const [superliked, setSuperliked] = useState(initialSuperliked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOwnPost, setIsOwnPost] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsOwnPost(user?.id === postAuthorId);
    };
    checkAuth();
  }, [postAuthorId]);

  const handleSuperlike = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/hobbies');
      return;
    }

    if (isOwnPost || superliked) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/superlike`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuperliked(true);
        setCount(data.data.superlike_count);
      } else if (data.error?.code === 'INSUFFICIENT_BALANCE') {
        onPurchaseNeeded?.();
      }
    } catch (error) {
      console.error('Superlike failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSuperlike}
      disabled={loading || superliked || isOwnPost}
      title={
        isOwnPost
          ? 'Cannot superlike your own post'
          : superliked
            ? 'Already superliked'
            : 'Superlike this post'
      }
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
        superliked
          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400'
      } disabled:opacity-50`}
    >
      {superliked ? (
        <svg className="w-5 h-5 text-amber-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="text-sm">{count}</span>
    </button>
  );
}
