'use client';

import { useState } from 'react';

interface CommunityFollowButtonProps {
  communitySlug: string;
  isFollowed: boolean;
  onToggle?: (following: boolean) => void;
  size?: 'sm' | 'md';
}

export default function CommunityFollowButton({
  communitySlug,
  isFollowed: initialFollowed,
  onToggle,
  size = 'sm',
}: CommunityFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const next = !following;
    setFollowing(next);
    onToggle?.(next);
    setLoading(true);

    try {
      const res = await fetch('/api/communities/follow', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: communitySlug }),
      });

      const data = await res.json();

      if (!data.success) {
        setFollowing(!next);
        onToggle?.(!next);
      }
    } catch {
      setFollowing(!next);
      onToggle?.(!next);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = size === 'md' ? 'px-5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 font-medium rounded-xl transition-all disabled:opacity-60 ${sizeClasses} ${
        following
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-white dark:bg-stone-900 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30'
      }`}
    >
      {following ? (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Following
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Follow
        </>
      )}
    </button>
  );
}
