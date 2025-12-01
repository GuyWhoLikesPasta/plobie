'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProfileCardSkeleton, PostCardSkeleton } from '@/components/skeletons';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ username: u }) => {
      setUsername(u);
      fetchProfile(u);
    });
  }, [params]);

  const fetchProfile = async (u: string) => {
    try {
      const response = await fetch(`/api/profiles/${u}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.data.profile);
        setPosts(data.data.posts);
      } else {
        toast.error('Profile not found');
        router.push('/hobbies');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-gray-400 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="glass-strong rounded-3xl shadow-2xl p-10 mb-8 border border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0 relative group">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-emerald-500/50 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 via-cyan-500 to-purple-500 rounded-3xl flex items-center justify-center text-white text-5xl font-black shadow-lg group-hover:scale-105 transition-transform">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg">
                Lvl {profile.level}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 w-full">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                {profile.username}
              </h1>
              
              {/* Level and XP */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30">
                  <span className="text-emerald-400">⭐</span>
                  <span className="text-white">Level {profile.level}</span>
                </span>
                <span className="inline-flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/30">
                  <span className="text-amber-400">🎯</span>
                  <span className="text-white">{profile.xp} XP</span>
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4 text-center hover:scale-105 transition-transform border border-white/10">
                  <div className="text-3xl font-black text-white">
                    {profile.posts}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Posts</div>
                </div>
                <div className="glass rounded-xl p-4 text-center hover:scale-105 transition-transform border border-white/10">
                  <div className="text-3xl font-black text-white">
                    {profile.comments}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Comments</div>
                </div>
                <div className="glass rounded-xl p-4 text-center hover:scale-105 transition-transform border border-white/10">
                  <div className="text-3xl font-black text-white">
                    {profile.pots}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Pots</div>
                </div>
                <div className="glass rounded-xl p-4 text-center hover:scale-105 transition-transform border border-white/10">
                  <div className="text-3xl font-black text-white">
                    {profile.xp}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">Total XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="glass-strong rounded-3xl shadow-lg p-8 border border-white/10">
          <h2 className="text-3xl font-black text-white mb-8">
            Recent Posts
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-400 text-lg">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/hobbies/posts/${post.id}`)}
                  className="glass rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer border border-white/10 hover:border-emerald-500/50 group"
                >
                  <div className="flex items-center space-x-2 mb-3 text-sm">
                    <span className="glass px-3 py-1 rounded-full text-gray-400 font-medium">
                      {post.hobby_group}
                    </span>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-300 line-clamp-2 mb-4">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="mt-4 w-full max-h-64 object-cover rounded-xl border border-white/10"
                    />
                  )}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                    <span className="glass px-3 py-1 rounded-full">
                      💬 {post.comments?.[0]?.count || 0} comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

