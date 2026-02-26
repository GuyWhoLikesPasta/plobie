'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  postId: string;
  postTitle: string;
}

export default function ShareButton({ postId, postTitle }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const postUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/hobbies/posts/${postId}`
      : `/hobbies/posts/${postId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: `Check out "${postTitle}" on Plobie`,
          url: postUrl,
        });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      )}
      <span className="text-sm">Share</span>
    </button>
  );
}
