'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import LikeButton from '@/components/posts/LikeButton';
import toast from 'react-hot-toast';
import { PostCardSkeleton } from '@/components/skeletons';

export default function HobbiesPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    hobby_group: 'Indoor Plants',
    title: '',
    content: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
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
  }, [selectedGroup, searchQuery, sortBy]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (selectedGroup) params.append('hobby_group', selectedGroup);
      if (searchQuery) params.append('search', searchQuery);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/posts?${params.toString()}`);
      const data = await response.json();

      console.log('Posts API response:', data);

      if (data.success) {
        console.log('Setting posts:', data.data.posts.length);
        setPosts(data.data.posts);
      } else {
        console.error('API returned error:', data.error);
        toast.error(`Failed to load posts: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Network error loading posts');
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = '';

      // Upload image if one is selected
      if (selectedImage) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('image', selectedImage);

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          toast.error(uploadData.error?.message || 'Failed to upload image');
          setUploading(false);
          setSubmitting(false);
          return;
        }

        imageUrl = uploadData.data.url;
        setUploading(false);
      }

      // Create post with optional image URL
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setFormData({ hobby_group: 'Indoor Plants', title: '', content: '' });
        setSelectedImage(null);
        setImagePreview('');
        fetchPosts();
        toast.success(`Post created! You earned +${data.data.xp_awarded} XP!`);
      } else {
        toast.error(data.error?.message || 'Failed to create post');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">🌿 Hobbies</h1>
              <p className="text-base sm:text-xl text-green-100">
                Connect with fellow plant enthusiasts
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push('/hobbies/learn')}
                className="flex-1 sm:flex-none bg-blue-500 text-white px-4 sm:px-6 py-3 min-h-[48px] rounded-lg font-medium text-sm sm:text-base hover:bg-blue-600 transition-all"
              >
                📚 Learn (+1 XP)
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 sm:flex-none bg-white text-green-600 px-4 sm:px-6 py-3 min-h-[48px] rounded-lg font-medium text-sm sm:text-base hover:bg-green-50 transition-all"
              >
                ✏️ New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-base"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-xl">🔍</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'trending')}
            className="px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 bg-white text-base"
          >
            <option value="recent">Recent</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Hobby Group Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGroup('')}
            className={`px-4 py-2 min-h-[44px] rounded-lg font-medium text-sm sm:text-base transition-all ${
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
              className={`px-4 py-2 min-h-[44px] rounded-lg font-medium text-sm sm:text-base transition-all ${
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
                <div className="mb-4">
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
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">
                    Image (Optional)
                  </label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-all">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <span className="text-4xl mb-2">📸</span>
                        <span className="text-gray-600 font-medium">
                          Click to upload an image
                        </span>
                        <span className="text-gray-400 text-sm mt-1">
                          JPG, PNG, WebP, or GIF (max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Uploading Image...' : submitting ? 'Posting...' : 'Post (+3 XP)'}
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
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${post.profiles?.username}`);
                        }}
                        className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {post.profiles?.username || 'Anonymous'}
                      </button>
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
                    {post.image_url && (
                      <div className="relative w-full h-64 mt-4">
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          className="rounded-lg object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="mt-4 flex items-center space-x-3">
                      <LikeButton postId={post.id} initialCount={0} initialLiked={false} />
                      <span className="text-sm text-gray-500">
                        💬 {post.comments?.[0]?.count || 0}
                      </span>
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
