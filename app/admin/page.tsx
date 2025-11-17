import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const profile = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // Get stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: potCount } = await supabase
    .from('pots')
    .select('*', { count: 'exact', head: true });

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🔒 Admin Dashboard</h1>
          <p className="text-red-100">
            Welcome, {profile.username || 'Admin'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-3xl font-bold text-gray-900">{userCount || 0}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🏺</div>
            <p className="text-3xl font-bold text-gray-900">{potCount || 0}</p>
            <p className="text-sm text-gray-600">Claimed Pots</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🛍️</div>
            <p className="text-3xl font-bold text-gray-900">{orderCount || 0}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-3xl font-bold text-gray-900">{postCount || 0}</p>
            <p className="text-sm text-gray-600">Community Posts</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/admin/feature-flags"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-800 mb-1">Feature Flags</h3>
              <p className="text-sm text-gray-600">Toggle features on/off</p>
            </Link>

            <Link
              href="/admin/reports"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🚨</div>
              <h3 className="font-semibold text-gray-800 mb-1">Reports</h3>
              <p className="text-sm text-gray-600">Review user reports</p>
            </Link>

            <Link
              href="/admin/products"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold text-gray-800 mb-1">Products</h3>
              <p className="text-sm text-gray-600">Manage shop inventory</p>
            </Link>
          </div>
        </section>

        {/* Recent Orders */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Orders</h2>
          
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No orders yet
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${(order.total_cents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Dev Note */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
          <p className="text-yellow-800">
            <strong>🛠️ Protected Route Example:</strong> This page uses <code className="bg-yellow-100 px-1 rounded">requireAdmin()</code> middleware. 
            Only users with <code className="bg-yellow-100 px-1 rounded">is_admin: true</code> can access this page. 
            Non-admin users are redirected to home.
          </p>
        </div>
      </div>
    </div>
  );
}

