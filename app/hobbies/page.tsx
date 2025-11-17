import { requireAuth } from '@/lib/auth';
import Link from 'next/link';

export default async function HobbiesPage() {
  await requireAuth();

  const hobbyGroups = [
    { slug: 'indoor-plants', name: 'Indoor Plants', icon: '🪴', members: 0 },
    { slug: 'succulents', name: 'Succulents & Cacti', icon: '🌵', members: 0 },
    { slug: 'herbs', name: 'Herbs & Edibles', icon: '🌿', members: 0 },
    { slug: 'orchids', name: 'Orchids', icon: '🌸', members: 0 },
    { slug: 'bonsai', name: 'Bonsai', icon: '🌳', members: 0 },
    { slug: 'propagation', name: 'Propagation Tips', icon: '🌱', members: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">💬 Hobbies</h1>
          <p className="text-purple-100">
            Join interest groups, share your journey, and connect with plant lovers
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🚧</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Posts & Comments Coming Soon!
              </h3>
              <p className="text-blue-800 text-sm">
                This feature is under active development. Soon you'll be able to post photos, 
                share tips, and earn XP for engaging with the community.
              </p>
            </div>
          </div>
        </div>

        {/* Hobby Groups Preview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Interest Groups
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hobbyGroups.map((group) => (
              <div
                key={group.slug}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-4xl">{group.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {group.members} members
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  Share your {group.name.toLowerCase()} journey and learn from others!
                </p>
                
                <button
                  disabled
                  className="w-full py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Preview */}
        <section className="mt-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            What's Coming
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">📸</div>
              <h3 className="font-semibold text-gray-800 mb-2">Posts</h3>
              <p className="text-sm text-gray-600">
                Share photos and stories about your plants. Earn 3 XP per post!
              </p>
            </div>
            
            <div>
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-semibold text-gray-800 mb-2">Comments</h3>
              <p className="text-sm text-gray-600">
                Engage with the community and help others. Earn 1 XP per comment!
              </p>
            </div>
            
            <div>
              <div className="text-3xl mb-2">📚</div>
              <h3 className="font-semibold text-gray-800 mb-2">Learn Articles</h3>
              <p className="text-sm text-gray-600">
                Read expert guides and tutorials. Earn 1 XP per article!
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

