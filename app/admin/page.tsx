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
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'flags' | 'analytics'>('analytics');
  
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
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
        .select(`
          id,
          username,
          is_admin,
          xp_total,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get post and comment counts for each user
      const usersWithCounts = await Promise.all(
        (data || []).map(async (profile) => {
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
        .select(`
          id,
          title,
          content,
          created_at,
          hidden,
          profile_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profile data separately for each post
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
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
        .eq('user_id', userId)
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
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-400 text-lg animate-pulse">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.profiles.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    p.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
    p.content.toLowerCase().includes(postSearch.toLowerCase()) ||
    p.profiles?.username.toLowerCase().includes(postSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              ⚙️
            </div>
            <div>
              <h1 className="text-5xl font-black text-white">Admin Dashboard</h1>
              <p className="mt-1 text-gray-400">Manage users, content, and system settings</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-strong rounded-2xl p-2 mb-8 border border-white/10">
          <nav className="flex space-x-2">
            {['analytics', 'users', 'posts', 'flags'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-bold text-sm capitalize transition-all
                  ${activeTab === tab
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-purple-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-sm font-medium text-gray-400">Total Users</h3>
                <p className="mt-2 text-4xl font-black text-white">{analytics.total_users}</p>
              </div>
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-emerald-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-sm font-medium text-gray-400">Total Posts</h3>
                <p className="mt-2 text-4xl font-black text-white">{analytics.total_posts}</p>
              </div>
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-cyan-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">💭</div>
                <h3 className="text-sm font-medium text-gray-400">Total Comments</h3>
                <p className="mt-2 text-4xl font-black text-white">{analytics.total_comments}</p>
              </div>
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-amber-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-sm font-medium text-gray-400">XP Awarded Today</h3>
                <p className="mt-2 text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{analytics.xp_awarded_today}</p>
              </div>
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-pink-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-sm font-medium text-gray-400">Posts Today</h3>
                <p className="mt-2 text-4xl font-black text-white">{analytics.posts_today}</p>
              </div>
              <div className="glass-strong p-8 rounded-2xl shadow-lg border border-blue-500/30 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-sm font-medium text-gray-400">Posts This Week</h3>
                <p className="mt-2 text-4xl font-black text-white">{analytics.posts_this_week}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="glass-strong p-4 rounded-2xl border border-white/10">
              <input
                type="text"
                placeholder="🔍 Search users by email or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-6 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 border-none font-medium"
              />
            </div>
            
            <div className="glass-strong rounded-2xl shadow-lg overflow-hidden border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="glass">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Stats</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">{user.profiles.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.profiles.is_admin && (
                          <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            ⚡ Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-gray-300"><span className="text-amber-400 font-bold">XP:</span> {user.profiles.xp_total}</div>
                        <div className="text-gray-300"><span className="text-emerald-400 font-bold">Posts:</span> {user.post_count}</div>
                        <div className="text-gray-300"><span className="text-cyan-400 font-bold">Comments:</span> {user.comment_count}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleAdmin(user.id, user.profiles.is_admin)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
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
          <div className="space-y-6">
            <div className="glass-strong p-4 rounded-2xl border border-white/10">
              <input
                type="text"
                placeholder="🔍 Search posts by title, content, or author..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="w-full px-6 py-3 glass text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 border-none font-medium"
              />
            </div>

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="glass-strong p-6 rounded-2xl shadow-lg border border-white/10 hover:border-purple-500/50 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{post.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-400 mb-3">
                        By <span className="text-emerald-400 font-bold">{post.profiles?.username}</span> • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-300 line-clamp-2 mb-3">{post.content}</p>
                      {post.hidden && (
                        <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          👁️ Hidden
                        </span>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => togglePostVisibility(post.id, post.hidden || false)}
                        className="px-4 py-2 text-sm glass text-amber-400 hover:bg-white/20 border border-amber-500/30 rounded-xl font-bold transition-all hover:scale-105"
                      >
                        {post.hidden ? '👁️ Unhide' : '🚫 Hide'}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="px-4 py-2 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-bold transition-all hover:scale-105"
                      >
                        🗑️ Delete
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
          <div className="glass-strong rounded-2xl shadow-lg border border-white/10 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10">
              <h3 className="text-2xl font-black text-white">Feature Flags</h3>
              <p className="mt-1 text-sm text-gray-400">Toggle features on and off instantly</p>
            </div>
            <div className="divide-y divide-white/10">
              {flags.map((flag) => (
                <div key={flag.key} className="px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div>
                    <p className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{flag.key}</p>
                    <p className="text-sm mt-1">
                      {flag.enabled ? (
                        <span className="text-emerald-400 font-bold">✅ Enabled</span>
                      ) : (
                        <span className="text-gray-500 font-bold">⭕ Disabled</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.key, flag.enabled)}
                    className={`
                      relative inline-flex h-8 w-16 items-center rounded-full transition-all shadow-lg hover:scale-110
                      ${flag.enabled ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gray-700'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md
                        ${flag.enabled ? 'translate-x-9' : 'translate-x-1'}
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
