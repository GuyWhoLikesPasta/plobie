'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import LikeButton from '@/components/posts/LikeButton';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-gray-400 animate-pulse">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <button
          onClick={() => router.push('/hobbies')}
          className="mb-6 text-emerald-400 hover:text-emerald-300 font-bold flex items-center transition-colors"
        >
          ← Back to Community
        </button>

        {/* Post Card */}
        <div className="glass-strong rounded-3xl shadow-2xl p-8 md:p-10 mb-6 border border-white/10">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <button
                onClick={() => router.push(`/profile/${post.profiles?.username}`)}
                className="font-bold text-white hover:text-emerald-400 transition-colors text-lg"
              >
                {post.profiles?.username || 'Anonymous'}
              </button>
              <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                <span className="glass px-3 py-1 rounded-full">{post.hobby_group}</span>
                <span>·</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-6">
            {post.title}
          </h1>

          <p className="text-gray-300 whitespace-pre-wrap mb-6 text-lg leading-relaxed">
            {post.content}
          </p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="rounded-2xl w-full max-h-[600px] object-cover mb-6 border border-white/10"
            />
          )}

          <div className="flex items-center space-x-4 pt-6 border-t border-white/10">
            <LikeButton postId={post.id} initialCount={0} initialLiked={false} />
            <span className="text-sm text-gray-400 flex items-center gap-2 px-4 py-2 glass rounded-full">
              💬 {post.comments?.length || 0} comments
            </span>
          </div>
        </div>

        {/* Comment Form */}
        <div className="glass-strong rounded-3xl shadow-lg p-8 mb-6 border border-white/10">
          <h2 className="text-2xl font-black text-white mb-6">
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
                className="w-full px-4 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-emerald-500 border-none mb-4 font-medium"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-glow transition-all disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Comment (+1 XP) →'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-6 text-lg">
                Please log in to comment
              </p>
              <button
                onClick={() => router.push(`/login?redirect=/hobbies/posts/${postId}`)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-glow transition-all"
              >
                Log In →
              </button>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment: any) => (
              <div key={comment.id} className="glass-strong rounded-2xl shadow-lg p-6 border border-white/10">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="font-bold text-white">
                        {comment.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="text-sm text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-strong rounded-2xl shadow-lg p-12 text-center border border-white/10">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-400 text-lg">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
