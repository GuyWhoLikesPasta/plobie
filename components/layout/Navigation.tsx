'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

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
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.is_admin || false);
          });
      } else {
        setIsAdmin(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    { name: 'Games', href: '/games', icon: '🎮' },
    { name: 'Shop', href: '/shop', icon: '🛍️' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Plobie
            </span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  pathname === '/admin'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-1.5">⚙️</span>
                Admin
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-white/10 rounded-lg animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${user.email?.split('@')[0]}`}
                  className="text-sm text-gray-300 hover:text-emerald-400 font-medium hidden sm:inline transition-colors"
                >
                  {user.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-glow rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
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
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                pathname === '/admin'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
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

