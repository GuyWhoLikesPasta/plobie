'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { StatsCardSkeleton, PostCardSkeleton } from '@/components/skeletons';

interface User {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    username: string;
    is_admin: boolean;
    xp_total: number;
  };
  post_count: number;
  comment_count: number;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  hidden: boolean;
  profiles: {
    username: string;
  };
}

interface Analytics {
  total_users: number;
  total_posts: number;
  total_comments: number;
  xp_awarded_today: number;
  posts_today: number;
  posts_this_week: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'flags' | 'analytics'>(
    'analytics'
  );

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_users: 0,
    total_posts: 0,
    total_comments: 0,
    xp_awarded_today: 0,
    posts_today: 0,
    posts_this_week: 0,
  });

  // Search/filter states
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);

      // Load initial data
      fetchAnalytics();
      fetchUsers();
      fetchPosts();
      fetchFlags();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total posts
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Total comments
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      // Posts today
      const today = new Date().toISOString().split('T')[0];
      const { count: postsToday } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Posts this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: postsThisWeek } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // XP awarded today
      const { data: xpData } = await supabase
        .from('xp_events')
        .select('amount')
        .gte('created_at', today);

      const xpToday = xpData?.reduce((sum, event) => sum + event.amount, 0) || 0;

      setAnalytics({
        total_users: userCount || 0,
        total_posts: postCount || 0,
        total_comments: commentCount || 0,
        xp_awarded_today: xpToday,
        posts_today: postsToday || 0,
        posts_this_week: postsThisWeek || 0,
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          username,
          is_admin,
          xp_total,
          created_at,
          user_id
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get post and comment counts for each user
      const usersWithCounts = await Promise.all(
        (data || []).map(async profile => {
          const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);

          const { count: commentCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);

          return {
            id: profile.user_id,
            email: profile.username + '@plobie', // Show username instead of email for privacy
            created_at: profile.created_at,
            profiles: {
              username: profile.username,
              is_admin: profile.is_admin || false,
              xp_total: profile.xp_total || 0,
            },
            post_count: postCount || 0,
            comment_count: commentCount || 0,
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          id,
          title,
          content,
          created_at,
          hidden,
          profile_id
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profile data separately for each post
      const postsWithProfiles = await Promise.all(
        (data || []).map(async post => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', post.profile_id)
            .single();

          return {
            ...post,
            profiles: {
              username: profile?.username || 'Unknown',
            },
          };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Posts fetch error:', error);
    }
  };

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/flags');
      const data = await response.json();

      if (data.success) {
        setFlags(data.data.flags);
      }
    } catch (error) {
      console.error('Flags fetch error:', error);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success(`User ${!currentStatus ? 'promoted to' : 'removed from'} admin`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle admin error:', error);
      toast.error('Failed to update admin status');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);

      if (error) throw error;

      toast.success('Post deleted successfully');
      fetchPosts();
      fetchAnalytics();
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
    }
  };

  const togglePostVisibility = async (postId: string, currentHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ hidden: !currentHidden })
        .eq('id', postId);

      if (error) throw error;

      toast.success(`Post ${!currentHidden ? 'hidden' : 'unhidden'} successfully`);
      fetchPosts();
    } catch (error) {
      console.error('Toggle post visibility error:', error);
      toast.error('Failed to toggle post visibility');
    }
  };

  const toggleFlag = async (flagKey: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, enabled: !currentValue }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Flag ${flagKey} ${!currentValue ? 'enabled' : 'disabled'}`);
        fetchFlags();
      } else {
        toast.error('Failed to toggle flag');
      }
    } catch (error) {
      console.error('Toggle flag error:', error);
      toast.error('Failed to toggle flag');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.profiles.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(
    p =>
      p.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.content.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.profiles?.username.toLowerCase().includes(postSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Manage users, content, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex gap-4 sm:gap-8">
            {['analytics', 'users', 'posts', 'flags'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${
                    activeTab === tab
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.total_users}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.total_posts}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.total_comments}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">XP Awarded Today</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {analytics.xp_awarded_today}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Posts Today</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.posts_today}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Posts This Week</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{analytics.posts_this_week}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <input
                type="text"
                placeholder="Search users by email or username..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.profiles.username}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.profiles.is_admin && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>XP: {user.profiles.xp_total}</div>
                        <div>Posts: {user.post_count}</div>
                        <div>Comments: {user.comment_count}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleAdmin(user.id, user.profiles.is_admin)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          {user.profiles.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <input
                type="text"
                placeholder="Search posts by title, content, or author..."
                value={postSearch}
                onChange={e => setPostSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {post.title || 'Untitled'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        By {post.profiles?.username} •{' '}
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-gray-700 line-clamp-2">{post.content}</p>
                      {post.hidden && (
                        <span className="inline-flex items-center px-2 py-1 mt-2 rounded text-xs font-medium bg-red-100 text-red-800">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => togglePostVisibility(post.id, post.hidden || false)}
                        className="px-3 py-1 text-sm text-yellow-600 hover:text-yellow-900 border border-yellow-600 rounded"
                      >
                        {post.hidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-600 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flags Tab */}
        {activeTab === 'flags' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
              <p className="mt-1 text-sm text-gray-500">Toggle features on and off</p>
            </div>
            <div className="divide-y divide-gray-200">
              {flags.map(flag => (
                <div key={flag.key} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{flag.key}</p>
                    <p className="text-sm text-gray-500">{flag.enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${flag.enabled ? 'bg-green-600' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
