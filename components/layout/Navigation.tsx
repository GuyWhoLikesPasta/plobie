'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);

      // Check if user is admin
      if (user) {
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.is_admin || false);
          });
      } else {
        setIsAdmin(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Hobbies', href: '/hobbies', icon: '💬' },
    { name: 'My Plants', href: '/my-plants', icon: '🌿' },
    { name: 'Achievements', href: '/achievements', icon: '🏆' },
    { name: 'Games', href: '/games', icon: '🎮' },
    { name: 'Shop', href: '/shop', icon: '🛍️' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-h-[44px]">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-bold text-green-800">Plobie</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-4 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium transition ${
                  pathname === '/admin'
                    ? 'bg-red-100 text-red-800'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">⚙️</span>
                Admin
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <NotificationBell />
                <Link
                  href={`/profile/${user.email?.split('@')[0]}`}
                  className="text-sm text-gray-700 hover:text-green-600 font-medium hidden sm:inline transition"
                >
                  {user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-2 overflow-x-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 min-h-[44px] flex items-center rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive ? 'bg-green-100 text-green-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-3 py-2 min-h-[44px] flex items-center rounded-lg text-xs font-medium whitespace-nowrap transition ${
                pathname === '/admin'
                  ? 'bg-red-100 text-red-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">⚙️</span>
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
