'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (user) {
        supabase
          .from('profiles')
          .select('is_admin, username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setIsAdmin(data?.is_admin || false);
            setProfileUsername(data?.username || null);
          });
      } else {
        setIsAdmin(false);
        setProfileUsername(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Plant Hobbies', href: '/hobbies' },
    { name: 'My Plants', href: '/my-plants' },
    { name: 'Game Play', href: '/gameplay' },
    { name: 'Shop', href: '/shop' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-stone-200/60 dark:border-stone-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zm0-18C7.6 4 4 7 4 11c0 2.4 1.2 5.5 2 7h12c.8-1.5 2-4.6 2-7 0-4-3.6-7-8-7zm-1 3.5c0-.3.2-.5.5-.5s.5.2.5.5v4c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-4zM8 11c0-.3.2-.5.5-.5s.5.2.5.5-0.2.5-.5.5S8 11.3 8 11z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-white">
              Plobie
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-stone-800'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-stone-800'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {loading ? (
              <div className="w-16 h-8 bg-stone-200 dark:bg-stone-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Link
                  href={`/profile/${profileUsername || user.email?.split('@')[0]}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400">
                    {(profileUsername?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {profileUsername || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
            <div className="flex flex-col gap-1">
              {navItems.map(item => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                        : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
