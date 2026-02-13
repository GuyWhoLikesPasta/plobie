'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  action_type: string;
  xp_amount: number;
  description: string | null;
  created_at: string;
  icon: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'Just now';
  }
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'activity'>('posts');

  const fetchProfile = useCallback(
    async (u: string) => {
      try {
        const response = await fetch(`/api/profiles/${u}`);
        const data = await response.json();

        if (data.success) {
          setProfile(data.data.profile);
          setPosts(data.data.posts);
          setActivity(data.data.activity || []);
        } else {
          toast.error('Profile not found');
          router.push('/hobbies');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    params.then(({ username: u }) => {
      fetchProfile(u);
    });
  }, [params, fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg border border-stone-200 dark:border-stone-700 p-4 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              {profile.avatar_url ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden">
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    fill
                    className="object-cover"
                    sizes="96px"
                    priority
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight mb-2">
                {profile.username}
              </h1>

              {/* Level and XP */}
              <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mb-4">
                <span className="inline-block bg-green-600 text-white px-4 py-1 rounded-xl text-sm font-medium">
                  Level {profile.level}
                </span>
                <span className="text-stone-600 dark:text-stone-400">{profile.xp} XP</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6">
                <div className="text-center p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">
                    {profile.posts}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Posts</div>
                </div>
                <div className="text-center p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">
                    {profile.comments}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Comments</div>
                </div>
                <div className="text-center p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">
                    {profile.pots}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Pots</div>
                </div>
                <div className="text-center p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                  <div className="text-2xl font-bold text-stone-900 dark:text-white">
                    {profile.achievements || 0}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Achievements</div>
                </div>
                <div className="text-center p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {profile.xp}
                  </div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">Total XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700 mb-6 overflow-hidden">
          <div className="flex border-b border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              Activity ({activity.length})
            </button>
          </div>
        </div>

        {/* Posts Section */}
        {activeTab === 'posts' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight mb-4 sm:mb-6">
              Recent Posts
            </h2>

            {posts.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                No posts yet
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => router.push(`/hobbies/posts/${post.id}`)}
                    className="border border-stone-200 dark:border-stone-700 rounded-xl p-4 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 mb-2 text-sm text-stone-500 dark:text-stone-400">
                      <span>{post.hobby_group}</span>
                      <span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight mb-2">
                      {post.title}
                    </h3>
                    <p className="text-stone-700 dark:text-stone-300 line-clamp-2">
                      {post.content}
                    </p>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="mt-3 w-full max-h-48 object-cover rounded-xl"
                      />
                    )}
                    <div className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                      {post.comments?.[0]?.count || 0} comments
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Feed Section */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white tracking-tight mb-4 sm:mb-6">
              Recent Activity
            </h2>

            {activity.length === 0 ? (
              <div className="text-center py-12 text-stone-500 dark:text-stone-400">
                <p>No activity yet. Start earning XP!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                        {item.description || item.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold ${item.xp_amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400'}`}
                    >
                      {item.xp_amount > 0 ? '+' : ''}
                      {item.xp_amount} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
