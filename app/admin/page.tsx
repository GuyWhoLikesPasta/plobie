'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

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

interface XPEvent {
  id: string;
  profile_id: string;
  action_type: string;
  xp_amount: number;
  description: string;
  created_at: string;
  username?: string;
}

interface SystemHealth {
  api: 'ok' | 'error' | 'checking';
  database: 'ok' | 'error' | 'checking';
  unity_bridge: 'ready' | 'missing' | 'checking';
  last_checked: string;
}

type TabType =
  | 'analytics'
  | 'users'
  | 'posts'
  | 'flags'
  | 'xp-activity'
  | 'system'
  | 'quick-actions';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [flags, setFlags] = useState<{ key: string; enabled: boolean }[]>([]);
  const [xpActivity, setXPActivity] = useState<XPEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    total_users: 0,
    total_posts: 0,
    total_comments: 0,
    xp_awarded_today: 0,
    posts_today: 0,
    posts_this_week: 0,
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: 'checking',
    database: 'checking',
    unity_bridge: 'checking',
    last_checked: new Date().toISOString(),
  });

  // Quick action states
  const [awardUsername, setAwardUsername] = useState('');
  const [awardAmount, setAwardAmount] = useState(50);
  const [awardReason, setAwardReason] = useState('');
  const [awarding, setAwarding] = useState(false);

  // Search/filter states
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      fetchXPActivity();
      checkSystemHealth();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: postsToday } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: postsThisWeek } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      const { data: xpData } = await supabase
        .from('xp_events')
        .select('xp_amount')
        .gte('created_at', today);

      const xpToday = xpData?.reduce((sum, event) => sum + event.xp_amount, 0) || 0;

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
      // Use admin API route to bypass RLS for xp_balances
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, content, created_at, hidden, author_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithProfiles = await Promise.all(
        (data || []).map(async post => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', post.author_id)
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

  const fetchXPActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('xp_events')
        .select('id, profile_id, action_type, xp_amount, description, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch usernames for each event
      const eventsWithUsernames = await Promise.all(
        (data || []).map(async event => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', event.profile_id)
            .single();

          return {
            ...event,
            username: profile?.username || 'Unknown',
          };
        })
      );

      setXPActivity(eventsWithUsernames);
    } catch (error) {
      console.error('XP Activity fetch error:', error);
    }
  };

  const checkSystemHealth = async () => {
    setSystemHealth(prev => ({
      ...prev,
      api: 'checking',
      database: 'checking',
      unity_bridge: 'checking',
    }));

    // Check API
    try {
      const response = await fetch('/api/user/me');
      setSystemHealth(prev => ({ ...prev, api: response.status === 401 ? 'ok' : 'ok' }));
    } catch {
      setSystemHealth(prev => ({ ...prev, api: 'error' }));
    }

    // Check Database
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      setSystemHealth(prev => ({ ...prev, database: error ? 'error' : 'ok' }));
    } catch {
      setSystemHealth(prev => ({ ...prev, database: 'error' }));
    }

    // Check Unity Bridge
    if (typeof window !== 'undefined') {
      const bridgeReady = !!(window as { plobie?: unknown }).plobie;
      setSystemHealth(prev => ({
        ...prev,
        unity_bridge: bridgeReady ? 'ready' : 'missing',
        last_checked: new Date().toISOString(),
      }));
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_admin', currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin status');
      }

      toast.success(data.message);
      await fetchUsers();
    } catch (error) {
      console.error('Toggle admin error:', error);
      toast.error((error as Error).message || 'Failed to update admin status');
    }
  };

  const resetUserXP = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to reset XP for ${username} to 0? This cannot be undone.`))
      return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_xp' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset XP');
      }

      toast.success(`XP reset for ${username}`);
      await fetchUsers();
      await fetchAnalytics();
    } catch (error) {
      console.error('Reset XP error:', error);
      toast.error((error as Error).message || 'Failed to reset XP');
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    if (
      !confirm(
        `DANGER: Are you sure you want to delete ${username}? This will delete ALL their data (posts, comments, XP, etc.) and CANNOT be undone.`
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success(`User ${username} deleted`);
      await fetchUsers();
      await fetchAnalytics();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
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

  const handleAwardXP = async () => {
    if (!awardUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    if (awardAmount < 1) {
      toast.error('XP amount must be at least 1');
      return;
    }

    setAwarding(true);
    try {
      // Find user by username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', awardUsername.trim())
        .single();

      if (profileError || !profile) {
        toast.error('User not found');
        return;
      }

      // Award XP via API
      const response = await fetch('/api/xp/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          action_type: 'admin_adjust',
          amount: awardAmount,
          description: awardReason || 'Admin award',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Awarded ${result.data.xp_awarded} XP to ${awardUsername}`);
        setAwardUsername('');
        setAwardAmount(50);
        setAwardReason('');
        fetchXPActivity();
        fetchAnalytics();
      } else {
        const errorMessage = result.error?.message || result.error || 'Failed to award XP';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Award XP error:', error);
      toast.error('Failed to award XP');
    } finally {
      setAwarding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400 mx-auto"></div>
          <p className="mt-4 text-stone-600 dark:text-stone-400">Verifying admin access...</p>
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

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'quick-actions', label: 'Quick Actions' },
    { key: 'xp-activity', label: 'XP Activity' },
    { key: 'users', label: 'Users', badge: analytics.total_users },
    { key: 'posts', label: 'Posts', badge: analytics.total_posts },
    { key: 'flags', label: 'Flags' },
    { key: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400">
            Manage users, content, XP, and system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-stone-200 dark:border-stone-700 mb-6 overflow-x-auto">
          <nav className="-mb-px flex gap-2 sm:gap-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  py-3 px-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1
                  ${
                    activeTab === tab.key
                      ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                      : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                  }
                `}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded-xl text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <StatCard title="Total Users" value={analytics.total_users} />
              <StatCard title="Total Posts" value={analytics.total_posts} />
              <StatCard title="Total Comments" value={analytics.total_comments} />
              <StatCard title="XP Today" value={analytics.xp_awarded_today} highlight />
              <StatCard title="Posts Today" value={analytics.posts_today} />
              <StatCard title="Posts This Week" value={analytics.posts_this_week} />
            </div>
          </div>
        )}

        {/* Quick Actions Tab */}
        {activeTab === 'quick-actions' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Award XP */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight mb-4">
                Award XP
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={awardUsername}
                    onChange={e => setAwardUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    XP Amount
                  </label>
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={e => setAwardAmount(parseInt(e.target.value) || 0)}
                    min={1}
                    max={1000}
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={awardReason}
                    onChange={e => setAwardReason(e.target.value)}
                    placeholder="e.g., Bug report reward"
                    className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAwardXP}
                  disabled={awarding}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {awarding ? 'Awarding...' : 'Award XP'}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight mb-4">
                Today&apos;s Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-600 dark:text-stone-400">New Posts</span>
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {analytics.posts_today}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-600 dark:text-stone-400">XP Awarded</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {analytics.xp_awarded_today}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-stone-200 dark:border-stone-700">
                  <span className="text-stone-600 dark:text-stone-400">Total Users</span>
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {analytics.total_users}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-stone-600 dark:text-stone-400">Posts This Week</span>
                  <span className="font-semibold text-stone-900 dark:text-white">
                    {analytics.posts_this_week}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* XP Activity Tab */}
        {activeTab === 'xp-activity' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-medium text-stone-900 dark:text-white tracking-tight">
                Recent XP Activity
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">Last 50 XP events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                <thead className="bg-stone-50 dark:bg-stone-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                      XP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-700">
                  {xpActivity.map(event => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900 dark:text-white">
                        {event.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                        <span className="capitalize">{event.action_type.replace(/_/g, ' ')}</span>
                        {event.description && (
                          <span className="block text-xs text-stone-400">{event.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-green-600 font-semibold">+{event.xp_amount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <input
                type="text"
                placeholder="Search users by email or username..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
              />
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                  <thead className="bg-stone-50 dark:bg-stone-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-200 dark:divide-stone-700">
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-stone-900 dark:text-white">
                            {user.profiles.username}
                          </div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">
                            {user.email}
                          </div>
                          {user.profiles.is_admin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">
                          <div>XP: {user.profiles.xp_total}</div>
                          <div>Posts: {user.post_count}</div>
                          <div>Comments: {user.comment_count}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500 dark:text-stone-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-1">
                            <a
                              href={`/profile/${user.profiles.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs"
                            >
                              View Profile
                            </a>
                            <button
                              onClick={() => toggleAdmin(user.id, user.profiles.is_admin)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs text-left"
                            >
                              {user.profiles.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => resetUserXP(user.id, user.profiles.username)}
                              className="text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 text-xs text-left"
                            >
                              Reset XP
                            </button>
                            <button
                              onClick={() => deleteUser(user.id, user.profiles.username)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs text-left"
                            >
                              Delete User
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <input
                type="text"
                placeholder="Search posts by title, content, or author..."
                value={postSearch}
                onChange={e => setPostSearch(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
              />
            </div>

            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow border border-stone-200 dark:border-stone-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white tracking-tight">
                        {post.title || 'Untitled'}
                      </h3>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        By {post.profiles?.username} •{' '}
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-stone-700 dark:text-stone-300 line-clamp-2">
                        {post.content}
                      </p>
                      {post.hidden && (
                        <span className="inline-flex items-center px-2 py-1 mt-2 rounded-xl text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => togglePostVisibility(post.id, post.hidden || false)}
                        className="px-3 py-1 text-sm text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-600 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        {post.hidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
              <h3 className="text-lg font-medium text-stone-900 dark:text-white tracking-tight">
                Feature Flags
              </h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Toggle features on and off
              </p>
            </div>
            <div className="divide-y divide-stone-200 dark:divide-stone-700">
              {flags.length === 0 ? (
                <div className="px-6 py-8 text-center text-stone-500 dark:text-stone-400">
                  No feature flags configured
                </div>
              ) : (
                flags.map(flag => (
                  <div key={flag.key} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-900 dark:text-white">
                        {flag.key}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFlag(flag.key, flag.enabled)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${flag.enabled ? 'bg-green-600' : 'bg-stone-200 dark:bg-stone-700'}
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
                ))
              )}
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* System Health */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-stone-900 dark:text-white tracking-tight">
                    System Health
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Last checked: {new Date(systemHealth.last_checked).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={checkSystemHealth}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700"
                >
                  Refresh
                </button>
              </div>
              <div className="divide-y divide-stone-200 dark:divide-stone-700">
                <HealthRow label="API Endpoints" status={systemHealth.api} />
                <HealthRow label="Database Connection" status={systemHealth.database} />
                <HealthRow
                  label="Unity Bridge (window.plobie)"
                  status={systemHealth.unity_bridge}
                />
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
                <h3 className="text-lg font-medium text-stone-900 dark:text-white tracking-tight">
                  Unity Integration Status
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-stone-700 dark:text-stone-300">
                    GET /api/user/me - User profile endpoint
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-stone-700 dark:text-stone-300">
                    POST /api/games/session - Session tracking
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-stone-700 dark:text-stone-300">
                    POST /api/games/xp - XP awards
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  <span className="text-stone-700 dark:text-stone-300">
                    GET/POST /api/games/progress - Save/Load state
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-stone-700 dark:text-stone-300">
                    Waiting for James&apos;s Unity WebGL build
                  </span>
                </div>
              </div>
            </div>

            {/* Environment Info */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
              <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-700">
                <h3 className="text-lg font-medium text-stone-900 dark:text-white tracking-tight">
                  Environment
                </h3>
              </div>
              <div className="px-6 py-4 space-y-2 font-mono text-sm">
                <div className="flex gap-2">
                  <span className="text-stone-500 dark:text-stone-400">API URL:</span>
                  <span className="text-stone-900 dark:text-white">
                    {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-stone-500 dark:text-stone-400">Environment:</span>
                  <span className="text-stone-900 dark:text-white">{process.env.NODE_ENV}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-stone-900 p-4 sm:p-6 rounded-2xl shadow border border-stone-200 dark:border-stone-700">
      <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 tracking-tight">
        {title}
      </h3>
      <p
        className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${highlight ? 'text-green-600 dark:text-green-400' : 'text-stone-900 dark:text-white'}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  const statusConfig: Record<string, { color: string; text: string }> = {
    ok: {
      color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      text: 'Healthy',
    },
    ready: {
      color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      text: 'Ready',
    },
    error: {
      color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
      text: 'Error',
    },
    missing: {
      color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
      text: 'Not Loaded',
    },
    checking: {
      color: 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-300',
      text: 'Checking',
    },
  };

  const config = statusConfig[status] || statusConfig.checking;

  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <span className="text-sm font-medium text-stone-900 dark:text-white">{label}</span>
      <span className={`px-3 py-1 rounded-xl text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
}
