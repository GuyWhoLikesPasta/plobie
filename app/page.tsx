'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { levelFromTotalXp, xpProgressInLevel } from '@/lib/xp-engine';
import TopPostsBanner from '@/components/shared/TopPostsBanner';
import NewsletterSection from '@/components/shared/NewsletterSection';
import PromoRotator from '@/components/shared/PromoRotator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  username: string;
  newsletter_subscribed: boolean;
}

interface XpData {
  total_xp: number;
}

interface ProductVariant {
  price_cents: number;
}

interface Product {
  id: string;
  name: string;
  product_variants: ProductVariant[];
}

interface GardenPlant {
  id: string;
  nickname: string | null;
  growth_stage: number;
  health: number;
  water_level: number;
  last_watered_at: string | null;
  plant: { name: string; key: string; category: string } | null;
}

interface DashboardData {
  profile: Profile;
  totalXp: number;
  plantCount: number;
  products: Product[];
  gardenPlants: GardenPlant[];
  needsWaterCount: number;
}

// ---------------------------------------------------------------------------
// Splash page features
// ---------------------------------------------------------------------------

const features = [
  {
    title: 'Shop',
    description: 'Handcrafted pottery and curated plant accessories from independent makers.',
    href: '/shop',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Plant Hobbies',
    description: 'Connect with fellow plant enthusiasts. Share tips, photos, and grow together.',
    href: '/hobbies',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
  {
    title: 'My Garden',
    description: 'Track your plants, monitor health, and build your personal botanical collection.',
    href: '/my-plants',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Game Play',
    description: 'Immersive 3D plant world. Earn XP, unlock achievements, and level up.',
    href: '/gameplay',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z"
        />
      </svg>
    ),
  },
];

const xpActions = [
  { label: 'Claim a Pot', xp: '+500', sublabel: 'Link physical pottery' },
  { label: 'Write a Post', xp: '+20', sublabel: 'Share with community' },
  { label: 'Play 30 min', xp: '+20', sublabel: 'Explore the world' },
  { label: 'Read an Article', xp: '+10', sublabel: 'Expand knowledge' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Loading skeleton for the dashboard
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome skeleton */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-48 mb-3" />
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-lg w-32" />
        </div>
        {/* Garden skeleton */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-t-4 border-t-green-500 rounded-2xl p-6 animate-pulse">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-36 mb-3" />
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-52 mb-4" />
          <div className="h-9 bg-stone-200 dark:bg-stone-700 rounded-xl w-32" />
        </div>
        {/* Posts skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-44 animate-pulse" />
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 animate-pulse"
              >
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-lg w-16 mb-3" />
                <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-4" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-20" />
              </div>
            ))}
          </div>
        </div>
        {/* Newsletter skeleton */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-40 mb-3" />
          <div className="h-10 bg-stone-200 dark:bg-stone-700 rounded-xl w-full" />
        </div>
        {/* Shop skeleton */}
        <div className="space-y-3">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-32 animate-pulse" />
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 animate-pulse"
              >
                <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-lg w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Splash page (unauthenticated visitors)
// ---------------------------------------------------------------------------

function SplashPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-stone-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-50 dark:bg-stone-950" />
        <div className="absolute inset-0 bg-linear-to-b from-green-50/60 via-white to-white dark:from-stone-950 dark:via-stone-900/50 dark:to-stone-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/5 dark:bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/4 dark:bg-green-500/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Decorative plant silhouettes */}
        <div className="absolute top-12 right-8 sm:right-24 opacity-[0.06] dark:opacity-[0.08] select-none pointer-events-none">
          <svg
            width="320"
            height="400"
            viewBox="0 0 320 400"
            fill="currentColor"
            className="text-green-700 dark:text-green-400"
          >
            <ellipse cx="160" cy="200" rx="80" ry="160" />
            <ellipse cx="100" cy="140" rx="50" ry="120" transform="rotate(-20 100 140)" />
            <ellipse cx="220" cy="140" rx="50" ry="120" transform="rotate(20 220 140)" />
            <rect x="155" y="300" width="10" height="100" rx="5" />
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-28 sm:pb-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200/60 dark:border-green-800/40 text-green-700 dark:text-green-400 text-xs font-medium tracking-wide uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Now live with 3D garden
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-6">
              <span className="text-stone-900 dark:text-white">Where plant lovers</span>
              <br />
              <span className="text-green-600 dark:text-green-400">grow together</span>
            </h1>

            <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 leading-relaxed mb-10 max-w-lg">
              Connect, learn, shop handcrafted pottery, and cultivate a digital garden that grows
              with you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium rounded-xl transition-all text-sm"
              >
                Get Started Free
                <svg
                  className="w-3.5 h-3.5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3 text-stone-600 dark:text-stone-300 font-medium rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-sm"
              >
                Browse the Shop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map(feature => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 p-5 sm:p-6 hover:border-green-200 dark:hover:border-green-900/50 transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-950/50"
            >
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-green-500 dark:text-green-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* XP System */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-stone-950 dark:bg-stone-900/60 rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs font-medium tracking-widest uppercase text-green-400 mb-3">
              Progression
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Earn XP. Level up.</h2>
            <p className="text-stone-400 text-sm sm:text-base mb-8 max-w-lg">
              Every action earns experience points. Climb 250 levels, unlock achievements, and watch
              your garden flourish.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {xpActions.map(action => (
                <div
                  key={action.label}
                  className="bg-white/4 border border-white/6 rounded-xl p-4 sm:p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <p className="text-lg sm:text-xl font-bold text-green-400 mb-1 tracking-tight">
                    {action.xp}
                  </p>
                  <p className="text-sm font-medium text-white mb-0.5">{action.label}</p>
                  <p className="text-xs text-stone-500">{action.sublabel}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-6">
              Daily cap: 3,000 XP to keep things balanced
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-100 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3 tracking-tight">
              Start growing today
            </h2>
            <p className="text-stone-500 dark:text-stone-400 mb-8 text-sm sm:text-base">
              Join a community of plant lovers building something beautiful together.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-600/15 hover:shadow-green-500/25 text-sm"
            >
              Create free account
            </Link>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard (authenticated users)
// ---------------------------------------------------------------------------

function Dashboard({ data }: { data: DashboardData }) {
  const { profile, totalXp, plantCount, products, gardenPlants, needsWaterCount } = data;
  const level = useMemo(() => levelFromTotalXp(totalXp), [totalXp]);
  const progress = useMemo(() => xpProgressInLevel(totalXp), [totalXp]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 1. Welcome banner */}
        <section className="relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 border-l-4 border-l-green-500 rounded-2xl p-6">
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/4 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white mb-1">
              Welcome back, {profile.username}
            </h1>
            <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                Level {level}
              </span>
              <span className="text-stone-300 dark:text-stone-600">|</span>
              <span>
                {totalXp.toLocaleString()} XP &middot; {progress.percentage}% to next level
              </span>
            </div>
            {/* XP progress bar */}
            <div className="mt-3 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* 2. Garden Viewer */}
        <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Your Garden</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                <span className="font-medium text-green-600 dark:text-green-400">{plantCount}</span>{' '}
                {plantCount === 1 ? 'plant' : 'plants'} growing
                {needsWaterCount > 0 && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    &middot; {needsWaterCount} need{needsWaterCount === 1 ? 's' : ''} water
                  </span>
                )}
              </p>
            </div>
            <Link
              href="/my-plants"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Open Garden
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          {gardenPlants.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-stone-100 dark:bg-stone-800 border-t border-stone-100 dark:border-stone-800">
              {gardenPlants.map(gp => {
                const waterLow = gp.water_level < 30;
                const healthLow = gp.health < 40;
                return (
                  <Link
                    key={gp.id}
                    href="/my-plants"
                    className="group relative bg-white dark:bg-stone-900 p-3 flex flex-col items-center text-center hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center mb-2">
                      <span className="text-lg" role="img" aria-label="plant">
                        {gp.growth_stage >= 4
                          ? '\u{1F333}'
                          : gp.growth_stage >= 2
                            ? '\u{1F331}'
                            : '\u{1FAB4}'}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate w-full">
                      {gp.nickname || gp.plant?.name || 'Plant'}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      {waterLow && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-blue-400"
                          title="Needs water"
                        />
                      )}
                      {healthLow && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" title="Low health" />
                      )}
                      {!waterLow && !healthLow && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Healthy" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-6 pb-6 pt-2">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                No plants yet.{' '}
                <Link
                  href="/my-plants"
                  className="text-green-600 dark:text-green-400 hover:underline"
                >
                  Start your garden
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* 3. Top Posts from Plant Hobbies */}
        <TopPostsBanner
          count={5}
          title="Top from Plant Hobbies"
          showContinueLink
          continueHref="/hobbies"
        />

        {/* 4. Newsletter */}
        <NewsletterSection subscribed={profile.newsletter_subscribed} nextDate={null} />

        {/* 5. Store Preview */}
        {products.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                From the Shop
              </h2>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                Browse all
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {products.map(product => {
                const price = product.product_variants?.[0]?.price_cents;
                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="group bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-green-200 dark:hover:border-green-900/50 transition-all"
                  >
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-1.5 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {price != null && (
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                        {formatPrice(price)}
                      </p>
                    )}
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      View &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. PromoRotator */}
        <PromoRotator />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [state, setState] = useState<'loading' | 'splash' | 'dashboard'>('loading');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setState('splash');
        return;
      }

      const [profileRes, xpRes, plantCountRes, productsRes, gardenRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, newsletter_subscribed')
          .eq('id', user.id)
          .single(),
        supabase.from('xp_balances').select('total_xp').eq('profile_id', user.id).single(),
        supabase
          .from('user_plants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase.from('products').select('id, name, product_variants(price_cents)').limit(20),
        supabase
          .from('user_plants')
          .select(
            'id, nickname, growth_stage, health, water_level, last_watered_at, plant:plants(name, key, category)'
          )
          .eq('user_id', user.id)
          .eq('is_dead', false)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      const profile: Profile = {
        username: profileRes.data?.username ?? user.email?.split('@')[0] ?? 'Grower',
        newsletter_subscribed: profileRes.data?.newsletter_subscribed ?? false,
      };

      const totalXp: number = (xpRes.data as XpData | null)?.total_xp ?? 0;
      const plantCount: number = plantCountRes.count ?? 0;
      const gardenPlants = (gardenRes.data ?? []) as unknown as GardenPlant[];

      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      const needsWaterCount = gardenPlants.filter(p => {
        if (!p.last_watered_at) return true;
        return now - new Date(p.last_watered_at).getTime() > TWELVE_HOURS;
      }).length;

      const allProducts = (productsRes.data ?? []) as Product[];
      const products = shuffle(allProducts).slice(0, 3);

      setDashboardData({ profile, totalXp, plantCount, products, gardenPlants, needsWaterCount });
      setState('dashboard');
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <DashboardSkeleton />;
  if (state === 'dashboard' && dashboardData) return <Dashboard data={dashboardData} />;
  return <SplashPage />;
}
