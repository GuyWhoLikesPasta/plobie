'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import LikeButton from '@/components/posts/LikeButton';
import ShareButton from '@/components/posts/ShareButton';
import toast from 'react-hot-toast';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [postId, setPostId] = useState<string>('');
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setPostId(id);
      fetchPost(id);
    });
    checkAuth();
  }, [params]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data.post);
      } else {
        toast.error('Post not found');
        router.push('/hobbies');
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push(`/login?redirect=/hobbies/posts/${postId}`);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      });

      const data = await response.json();

      if (data.success) {
        setCommentContent('');
        fetchPost(postId);
        toast.success(`Comment posted! You earned +${data.data.xp_awarded} XP!`);

        // Check for newly unlocked achievements
        checkAndShowAchievements();
      } else {
        toast.error(data.error?.message || 'Failed to post comment');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-stone-400 dark:text-stone-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white mb-2">Post Not Found</h1>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            This post doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/hobbies')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/hobbies')}
          className="mb-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center"
        >
          ← Back to Hobbies
        </button>

        {/* Post Card */}
        <div className="bg-white dark:bg-stone-800 rounded-lg shadow-lg dark:shadow-stone-900 p-4 sm:p-8 mb-6">
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <button
                onClick={() => router.push(`/profile/${post.profiles?.username}`)}
                className="font-semibold text-stone-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                {post.profiles?.username || 'Anonymous'}
              </button>
              <div className="text-sm text-stone-500 dark:text-stone-400">
                {post.hobby_group} · {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-4 tracking-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 whitespace-pre-wrap mb-6">
            {post.content}
          </p>

          {post.image_url && (
            <div className="relative w-full h-96 mb-6">
              <Image
                src={post.image_url}
                alt={post.title}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 sm:pt-6 border-t dark:border-stone-700">
            <LikeButton
              postId={post.id}
              initialCount={post.reaction_count || 0}
              initialLiked={post.liked_by_user || false}
            />
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {post.comments?.length || 0} comments
            </span>
            <ShareButton postId={post.id} postTitle={post.title} />
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white dark:bg-stone-800 rounded-lg shadow dark:shadow-stone-900 p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-white mb-4">
            Add a Comment
          </h2>
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment}>
              <textarea
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 text-stone-900 dark:text-white bg-white dark:bg-stone-700"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Comment (+2 XP)'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-stone-600 dark:text-stone-400 mb-4">Please log in to comment</p>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/posts/${postId}`)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-600 transition-all"
              >
                Log In
              </button>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment: any) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-stone-800 rounded-lg shadow dark:shadow-stone-900 p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-stone-900 dark:text-white">
                        {comment.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-stone-400">·</span>
                      <span className="text-sm text-stone-500 dark:text-stone-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-stone-800 rounded-lg shadow dark:shadow-stone-900 p-8 text-center">
              <p className="text-stone-500 dark:text-stone-400">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
