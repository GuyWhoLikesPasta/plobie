'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  earned: boolean;
  earned_at: string | null;
  current_value: number;
  progress: number;
}

interface Stats {
  total: number;
  earned: number;
  total_xp: number;
  level: number;
  posts: number;
  comments: number;
  articles: number;
}

function CategoryIcon({ cat }: { cat: string }) {
  const cls = 'w-4 h-4';
  switch (cat) {
    case 'xp':
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      );
    case 'social':
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      );
    case 'learning':
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      );
    case 'level':
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
      );
    case 'general':
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={cls}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      );
  }
}

const categoryLabels: Record<string, { label: string }> = {
  xp: { label: 'XP Milestones' },
  social: { label: 'Social' },
  learning: { label: 'Learning' },
  level: { label: 'Level Up' },
  general: { label: 'General' },
};

export default function AchievementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Achievement[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndFetch = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    fetchAchievements();
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/achievements');
      const data = await response.json();

      if (data.success) {
        setAchievements(data.data.achievements);
        setGrouped(data.data.grouped);
        setStats(data.data.stats);
      } else {
        toast.error('Failed to load achievements');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAchievements = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/achievements', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        const { newly_earned, total_xp_bonus } = data.data;

        if (newly_earned.length > 0) {
          toast.success(
            `Unlocked ${newly_earned.length} achievement(s)! +${total_xp_bonus} bonus XP!`
          );
          // Show each achievement
          newly_earned.forEach((a: { icon: string; name: string }) => {
            toast.success(`Achievement unlocked: ${a.name}`, { duration: 4000 });
          });
          // Refresh the list
          fetchAchievements();
        } else {
          toast.success('No new achievements yet. Keep going!');
        }
      }
    } catch {
      toast.error('Failed to check achievements');
    } finally {
      setChecking(false);
    }
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

  const categories = ['all', ...Object.keys(grouped)];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-400 dark:border-stone-500 mx-auto"></div>
          <p className="mt-4 text-stone-600 dark:text-stone-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center transition-colors">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-stone-400 dark:text-stone-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
            Sign in to view achievements
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            Track your progress, unlock rewards, and earn bonus XP as you grow.
          </p>
          <button
            onClick={() => router.push('/login?redirect=/achievements')}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
                Achievements
              </h1>
              <p className="text-stone-500 dark:text-stone-400">
                Track your progress and unlock rewards
              </p>
            </div>
            <button
              onClick={handleCheckAchievements}
              disabled={checking}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3 rounded-xl font-semibold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {checking ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-stone-900 border-t-transparent" />
                  Checking...
                </>
              ) : (
                'Check Progress'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                {stats.earned}/{stats.total}
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">Unlocked</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500">
                {stats.total_xp.toLocaleString()}
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">Total XP</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500">
                Lv.{stats.level}
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">Level</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500">
                {stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400">Complete</div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const catInfo = categoryLabels[cat] || { label: cat };
            const count = cat === 'all' ? achievements.length : grouped[cat]?.length || 0;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {cat === 'all' ? 'All' : catInfo.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
            <h3 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-white mb-2">
              No achievements in this category yet
            </h3>
            <p className="text-stone-600 dark:text-stone-400">Keep exploring to unlock more!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const earned = achievement.earned;

  return (
    <div
      className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 transition-all ${
        earned ? 'opacity-100' : 'opacity-75'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${earned ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 opacity-70'}`}
        >
          <CategoryIcon cat={achievement.category} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold tracking-tight text-stone-900 dark:text-white truncate">
              {achievement.name}
            </h3>
            {earned && (
              <svg
                className="shrink-0 w-4 h-4 text-green-600 dark:text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
            {achievement.description}
          </p>

          {/* Progress Bar */}
          {!earned && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                <span>
                  {achievement.current_value} / {achievement.requirement_value}
                </span>
                <span>{achievement.progress}%</span>
              </div>
              <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-500 font-medium">
              +{achievement.xp_reward} XP reward
            </span>
            {earned && achievement.earned_at && (
              <span className="text-stone-400 dark:text-stone-500 text-xs">
                {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
