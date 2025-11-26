'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data.post);
      } else {
        alert('Post not found');
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
        alert(`Comment posted! You earned +${data.data.xp_awarded} XP!`);
      } else {
        alert(data.error?.message || 'Failed to post comment');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/hobbies')}
          className="mb-6 text-green-600 hover:text-green-700 font-medium flex items-center"
        >
          ← Back to Hobbies
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {post.profiles?.username || 'Anonymous'}
              </div>
              <div className="text-sm text-gray-500">
                {post.hobby_group} · {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          <p className="text-gray-700 whitespace-pre-wrap mb-6">
            {post.content}
          </p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="rounded-lg w-full max-h-96 object-cover mb-6"
            />
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500 pt-6 border-t">
            <span>💬 {post.comments?.length || 0} comments</span>
          </div>
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Add a Comment
          </h2>
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment}>
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 text-gray-900"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Comment (+1 XP)'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Please log in to comment
              </p>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/posts/${postId}`)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
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
              <div key={comment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {comment.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

