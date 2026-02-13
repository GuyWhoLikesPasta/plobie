'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import LikeButton from '@/components/posts/LikeButton';
import toast from 'react-hot-toast';
import { PostCardSkeleton } from '@/components/skeletons';
import { checkAndShowAchievements } from '@/lib/achievement-toast';

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
    { slug: 'indoor-plants', name: 'Indoor Plants' },
    { slug: 'succulents', name: 'Succulents & Cacti' },
    { slug: 'herbs', name: 'Herbs & Edibles' },
    { slug: 'orchids', name: 'Orchids' },
    { slug: 'bonsai', name: 'Bonsai' },
    { slug: 'propagation', name: 'Propagation Tips' },
  ];

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, [selectedGroup, searchQuery, sortBy]);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

      if (data.success) {
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

        // Check for newly unlocked achievements
        checkAndShowAchievements();
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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Hero Section */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
                Hobbies
              </h1>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400">
                Connect with fellow plant enthusiasts
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push('/hobbies/learn')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-4 sm:px-6 py-3 min-h-[48px] rounded-xl font-medium text-sm sm:text-base hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Learn (+10 XP)
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 sm:px-6 py-3 min-h-[48px] rounded-xl font-medium text-sm sm:text-base hover:bg-stone-800 dark:hover:bg-stone-100 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                New Post
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-3 pl-11 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-stone-900 dark:text-white bg-white dark:bg-stone-900 text-base"
            />
            <span className="absolute left-4 top-3.5 text-stone-500 dark:text-stone-500 pointer-events-none">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'recent' | 'trending')}
            className="px-4 py-3 min-h-[48px] border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-green-500 text-stone-900 dark:text-white bg-white dark:bg-stone-900 text-base"
          >
            <option value="recent">Recent</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Hobby Group Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGroup('')}
            className={`px-4 py-2.5 min-h-[44px] rounded-full font-medium text-sm sm:text-base transition-all border ${
              selectedGroup === ''
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            All Groups
          </button>
          {hobbyGroups.map(group => (
            <button
              key={group.slug}
              onClick={() => setSelectedGroup(group.name)}
              className={`px-4 py-2.5 min-h-[44px] rounded-full font-medium text-sm sm:text-base transition-all border ${
                selectedGroup === group.name
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Create Post Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/40 dark:bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-6">
                Create a Post
              </h2>
              <form onSubmit={handleSubmitPost}>
                <div className="mb-4">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-2">
                    Hobby Group
                  </label>
                  <select
                    value={formData.hobby_group}
                    onChange={e => setFormData({ ...formData, hobby_group: e.target.value })}
                    className="w-full px-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                  >
                    {hobbyGroups.map(group => (
                      <option key={group.slug} value={group.name}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    maxLength={200}
                    className="w-full px-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-stone-900 dark:text-white bg-white dark:bg-stone-900"
                    placeholder="Give your post a title..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    required
                    maxLength={10000}
                    rows={6}
                    className="w-full px-4 py-2.5 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-stone-900 dark:text-white bg-white dark:bg-stone-900"
                    placeholder="Share your thoughts..."
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-stone-600 dark:text-stone-400 font-medium mb-2">
                    Image (Optional)
                  </label>
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 p-2 rounded-full hover:opacity-90 transition-all"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl p-6 text-center hover:border-stone-400 dark:hover:border-stone-600 transition-all">
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
                        <span className="mb-2 text-stone-500 dark:text-stone-500">
                          <svg
                            className="w-10 h-10 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </span>
                        <span className="text-stone-600 dark:text-stone-400 font-medium">
                          Click to upload an image
                        </span>
                        <span className="text-stone-500 dark:text-stone-500 text-sm mt-1">
                          JPG, PNG, WebP, or GIF (max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Uploading Image...' : submitting ? 'Posting...' : 'Post (+20 XP)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 rounded-xl font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
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
          <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <div className="mb-4 text-stone-400 dark:text-stone-500">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              Be the first to share something with the community!
            </p>
            <button
              onClick={handleCreatePost}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-all"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <div
                key={post.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-all"
                onClick={() => router.push(`/hobbies/posts/${post.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-stone-200 dark:bg-stone-800 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-400 font-semibold text-sm">
                    {post.profiles?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/profile/${post.profiles?.username}`);
                        }}
                        className="font-semibold text-stone-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        {post.profiles?.username || 'Anonymous'}
                      </button>
                      <span className="text-stone-500 dark:text-stone-500">·</span>
                      <span className="text-sm text-stone-500 dark:text-stone-500">
                        {post.hobby_group}
                      </span>
                      <span className="text-stone-500 dark:text-stone-500">·</span>
                      <span className="text-sm text-stone-500 dark:text-stone-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white mb-2">
                      {post.title}
                    </h3>
                    <p className="text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                    {post.image_url && (
                      <div className="relative w-full h-64 mt-4">
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          className="rounded-xl object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div
                      className="mt-4 flex items-center gap-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <LikeButton
                        postId={post.id}
                        initialCount={post.reactions?.[0]?.count || 0}
                        initialLiked={post.liked_by_user || false}
                      />
                      <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        {post.comments?.[0]?.count || 0}
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
