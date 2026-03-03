'use client';

import { useEffect, useState, useRef, useCallback, useMemo, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import LikeButton from '@/components/posts/LikeButton';
import SuperlikeButton from '@/components/posts/SuperlikeButton';
import ShareButton from '@/components/posts/ShareButton';
import SuperlikePurchaseModal from '@/components/shared/SuperlikePurchaseModal';
import toast from 'react-hot-toast';
import { PostCardSkeleton } from '@/components/skeletons';
import { checkAndShowAchievements } from '@/lib/achievement-toast';
import TopPostsBanner from '@/components/shared/TopPostsBanner';
import LoginPromptBanner from '@/components/shared/LoginPromptBanner';
import CommunityFollowButton from '@/components/shared/CommunityFollowButton';

const PAGE_SIZE = 20;
const COMMUNITY_HIGHLIGHT_INTERVAL = 15;
const SCROLL_STORAGE_KEY = 'hobbies-scroll';

const hobbyGroups = [
  { slug: 'indoor-plants', name: 'Indoor Plants' },
  { slug: 'succulents', name: 'Succulents & Cacti' },
  { slug: 'herbs', name: 'Herbs & Edibles' },
  { slug: 'orchids', name: 'Orchids' },
  { slug: 'bonsai', name: 'Bonsai' },
  { slug: 'propagation', name: 'Propagation Tips' },
  { slug: 'fruit-trees', name: 'Fruit Trees' },
  { slug: 'outdoor-garden', name: 'Outdoor Garden' },
  { slug: 'hydroponics', name: 'Hydroponics' },
  { slug: 'terrariums', name: 'Terrariums' },
];

function slugForGroup(name: string): string {
  return hobbyGroups.find(g => g.name === name)?.slug ?? name.toLowerCase().replace(/\s+/g, '-');
}

interface SuggestedPost {
  id: string;
  title: string;
  content: string;
  hobby_group: string;
  profiles?: { username?: string } | null;
}

export default function HobbiesPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('recent');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [suggestedPost, setSuggestedPost] = useState<SuggestedPost | null>(null);
  const [formData, setFormData] = useState({
    hobby_group: 'Indoor Plants',
    title: '',
    content: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stable random community for highlight blocks (seeded per mount)
  const highlightCommunitySeed = useRef(Math.random());

  const activeTab: 'feed' | 'learn' = 'feed';

  // ---------- Auth ----------
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  // ---------- Search Debounce ----------
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // ---------- Superlike Success Toast ----------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('superlike_success') === 'true') {
      toast.success('Superlikes purchased! You can now superlike posts.');
      const url = new URL(window.location.href);
      url.searchParams.delete('superlike_success');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // ---------- Suggested Post ----------
  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await fetch('/api/posts/top?limit=1&days=30');
        const data = await res.json();
        if (data.success && data.data.posts.length > 0) {
          setSuggestedPost(data.data.posts[0]);
        }
      } catch (err) {
        console.error('Failed to fetch suggested post:', err);
      }
    };
    fetchSuggested();
  }, []);

  // ---------- Fetch Posts ----------
  const fetchPosts = useCallback(
    async (pageOffset: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setFilterLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.append('limit', String(PAGE_SIZE));
        params.append('offset', String(pageOffset));
        if (selectedGroup) params.append('hobby_group', selectedGroup);
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (sortBy) params.append('sort', sortBy);

        const response = await fetch(`/api/posts?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          const newPosts: any[] = data.data.posts;
          if (append) {
            setPosts(prev => [...prev, ...newPosts]);
          } else {
            setPosts(newPosts);
          }
          setHasMore(newPosts.length === PAGE_SIZE);
        } else {
          console.error('API returned error:', data.error);
          toast.error(`Failed to load posts: ${data.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        toast.error('Network error loading posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setFilterLoading(false);
      }
    },
    [selectedGroup, debouncedSearch, sortBy]
  );

  // Initial fetch + filter changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchPosts(0, false);
  }, [fetchPosts]);

  // ---------- Scroll Position Restoration ----------
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;

    const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (saved) {
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
      const y = parseInt(saved, 10);
      if (!isNaN(y)) {
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }
  }, []);

  const saveScrollAndNavigate = (href: string) => {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, window.scrollY.toString());
    router.push(href);
  };

  // ---------- Infinite Scroll ----------
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextOffset = offset + PAGE_SIZE;
          setOffset(nextOffset);
          fetchPosts(nextOffset, true);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, offset, fetchPosts]);

  // ---------- Community Highlight ----------
  const getHighlightCommunity = useCallback((blockIndex: number) => {
    const seed = highlightCommunitySeed.current;
    const idx = Math.floor((seed * 1000 + blockIndex * 7) % hobbyGroups.length);
    return hobbyGroups[idx];
  }, []);

  const communityHighlightPosts = useCallback(
    (communityName: string) => {
      return posts.filter(p => p.hobby_group === communityName).slice(0, 3);
    },
    [posts]
  );

  // ---------- Create Post ----------
  const handleCreatePost = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setShowLoginPrompt(false);
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
        setOffset(0);
        fetchPosts(0, false);
        toast.success(`Post created! You earned +${data.data.xp_awarded} XP!`);
        checkAndShowAchievements();
      } else {
        toast.error(data.error?.message || 'Failed to create post');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  // ---------- Feed with interspersed community highlights ----------
  const feedElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let highlightBlock = 0;

    posts.forEach((post, idx) => {
      // Insert community highlight every COMMUNITY_HIGHLIGHT_INTERVAL posts
      if (idx > 0 && idx % COMMUNITY_HIGHLIGHT_INTERVAL === 0) {
        const community = getHighlightCommunity(highlightBlock);
        const communityPosts = communityHighlightPosts(community.name);
        highlightBlock++;

        elements.push(
          <div
            key={`highlight-${idx}`}
            className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                  Community Spotlight
                </p>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                  p/{community.slug}
                </h3>
              </div>
              <CommunityFollowButton communitySlug={community.slug} isFollowed={false} size="sm" />
            </div>
            {communityPosts.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {communityPosts.map(cp => (
                  <li key={cp.id}>
                    <button
                      onClick={() => saveScrollAndNavigate(`/hobbies/posts/${cp.id}`)}
                      className="text-sm text-stone-700 dark:text-stone-300 hover:text-green-700 dark:hover:text-green-400 transition-colors text-left line-clamp-1"
                    >
                      {cp.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                No recent posts in this community yet.
              </p>
            )}
            <button
              onClick={() => setSelectedGroup(community.name)}
              className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors inline-flex items-center gap-1"
            >
              View all posts
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        );
      }

      // Post card
      elements.push(
        <div
          key={post.id}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-all"
          onClick={() => saveScrollAndNavigate(`/hobbies/posts/${post.id}`)}
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
                <span className="text-stone-500 dark:text-stone-500">&middot;</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  p/{slugForGroup(post.hobby_group)}
                </span>
                <span className="text-stone-500 dark:text-stone-500">&middot;</span>
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
                <div className="relative w-full h-48 sm:h-64 mt-4">
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    className="rounded-xl object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="mt-4 flex items-center gap-4" onClick={e => e.stopPropagation()}>
                <LikeButton
                  postId={post.id}
                  initialCount={post.reactions?.[0]?.count || 0}
                  initialLiked={post.liked_by_user || false}
                />
                <SuperlikeButton
                  postId={post.id}
                  postAuthorId={post.author_id}
                  initialCount={post.superlike_count || 0}
                  initialSuperliked={post.superliked_by_user || false}
                  onPurchaseNeeded={() => setShowPurchaseModal(true)}
                />
                <span className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {post.comments?.[0]?.count || 0}
                </span>
                <ShareButton postId={post.id} postTitle={post.title} />
              </div>
            </div>
          </div>
        </div>
      );
    });

    return elements;
  }, [posts, getHighlightCommunity, communityHighlightPosts, router]);

  // ---------- Render ----------
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

          {/* Feed / Learn pill tabs */}
          <div className="mt-6 flex gap-2">
            <button className="px-5 py-2 rounded-full text-sm font-medium transition-all bg-green-600 text-white">
              Feed
            </button>
            <Link
              href="/hobbies/learn"
              className="px-5 py-2 rounded-full text-sm font-medium transition-all bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            >
              Learn
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login prompt for unauthenticated users trying to post */}
        {showLoginPrompt && !isAuthenticated && (
          <div className="mb-6">
            <LoginPromptBanner context="post" />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              aria-label="Search community posts"
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
        <div
          className={`mb-8 flex flex-wrap gap-2 ${filterLoading ? 'opacity-70 pointer-events-none' : ''}`}
        >
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

        {/* Suggested Post Banner */}
        {suggestedPost && (
          <div
            className="mb-6 bg-white dark:bg-stone-900 border border-green-200 dark:border-green-900/40 border-l-2 border-l-green-500 rounded-2xl p-5 sm:p-6 cursor-pointer hover:border-green-300 dark:hover:border-green-800 transition-all"
            onClick={() => saveScrollAndNavigate(`/hobbies/posts/${suggestedPost.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <span className="inline-block px-2.5 py-1 bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-xs font-semibold rounded-lg">
                  Suggested
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                  p/{slugForGroup(suggestedPost.hobby_group)}
                  {suggestedPost.profiles?.username && (
                    <span className="text-stone-500 dark:text-stone-500">
                      {' '}
                      &middot; {suggestedPost.profiles.username}
                    </span>
                  )}
                </p>
                <h3 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-white mb-1 line-clamp-1">
                  {suggestedPost.title}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {suggestedPost.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top / Trending Posts */}
        <div className="mb-8">
          <TopPostsBanner count={6} title="Trending" />
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

        {/* Superlike Purchase Modal */}
        {showPurchaseModal && (
          <SuperlikePurchaseModal onClose={() => setShowPurchaseModal(false)} />
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
              {selectedGroup || debouncedSearch
                ? `No posts found${selectedGroup ? ` in ${selectedGroup}` : ''}${debouncedSearch ? ` matching "${debouncedSearch}"` : ''}`
                : 'No posts yet'}
            </h3>
            <p className="text-stone-600 dark:text-stone-400 mb-6">
              {selectedGroup || debouncedSearch
                ? 'Try a different filter or be the first to post here!'
                : 'Be the first to share something with the community!'}
            </p>
            <button
              onClick={handleCreatePost}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-all"
            >
              {selectedGroup ? 'Create Post' : 'Create First Post'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {feedElements}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-sm text-stone-500 dark:text-stone-400 py-8">
                No more posts
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
