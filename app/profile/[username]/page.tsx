'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.username}
              </h1>
              
              {/* Level and XP */}
              <div className="flex items-center space-x-4 mb-4">
                <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Level {profile.level}
                </span>
                <span className="text-gray-600">
                  {profile.xp} XP
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.posts}
                  </div>
                  <div className="text-sm text-gray-500">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.comments}
                  </div>
                  <div className="text-sm text-gray-500">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.pots}
                  </div>
                  <div className="text-sm text-gray-500">Pots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {profile.xp}
                  </div>
                  <div className="text-sm text-gray-500">Total XP</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Posts
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No posts yet
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/hobbies/posts/${post.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mb-2 text-sm text-gray-500">
                    <span>{post.hobby_group}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-700 line-clamp-2">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="mt-3 w-full max-h-48 object-cover rounded"
                    />
                  )}
                  <div className="mt-3 text-sm text-gray-500">
                    💬 {post.comments?.[0]?.count || 0} comments
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

