'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function HobbiesPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    hobby_group: 'Indoor Plants',
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const hobbyGroups = [
    { slug: 'indoor-plants', name: 'Indoor Plants', icon: '🪴' },
    { slug: 'succulents', name: 'Succulents & Cacti', icon: '🌵' },
    { slug: 'herbs', name: 'Herbs & Edibles', icon: '🌿' },
    { slug: 'orchids', name: 'Orchids', icon: '🌸' },
    { slug: 'bonsai', name: 'Bonsai', icon: '🌳' },
    { slug: 'propagation', name: 'Propagation Tips', icon: '🌱' },
  ];

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, [selectedGroup]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = selectedGroup
        ? `/api/posts?hobby_group=${encodeURIComponent(selectedGroup)}&limit=20`
        : '/api/posts?limit=20';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/hobbies');
      return;
    }
    setShowCreateForm(true);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setFormData({ hobby_group: 'Indoor Plants', title: '', content: '' });
        fetchPosts();
        alert(`Post created! You earned +${data.data.xp_awarded} XP!`);
      } else {
        alert(data.error?.message || 'Failed to create post');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">🌿 Hobbies</h1>
              <p className="text-xl text-green-100">
                Connect with fellow plant enthusiasts
              </p>
            </div>
            <button
              onClick={handleCreatePost}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-all"
            >
              ✏️ New Post
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hobby Group Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGroup('')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedGroup === ''
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Groups
          </button>
          {hobbyGroups.map((group) => (
            <button
              key={group.slug}
              onClick={() => setSelectedGroup(group.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedGroup === group.name
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {group.icon} {group.name}
            </button>
          ))}
        </div>

        {/* Create Post Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Create a Post
              </h2>
              <form onSubmit={handleSubmitPost}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Hobby Group
                  </label>
                  <select
                    value={formData.hobby_group}
                    onChange={(e) =>
                      setFormData({ ...formData, hobby_group: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {hobbyGroups.map((group) => (
                      <option key={group.slug} value={group.name}>
                        {group.icon} {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    maxLength={200}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Give your post a title..."
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    maxLength={10000}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Share your thoughts..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post (+3 XP)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to share something with the community!
            </p>
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/hobbies/posts/${post.id}`)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {post.profiles?.username || 'Anonymous'}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">
                        {post.hobby_group}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-700 line-clamp-3">{post.content}</p>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                      <span>💬 {post.comments?.[0]?.count || 0} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
