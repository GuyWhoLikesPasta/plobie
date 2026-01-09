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

const categoryLabels: Record<string, { label: string; icon: string }> = {
  xp: { label: 'XP Milestones', icon: '✨' },
  social: { label: 'Social', icon: '💬' },
  learning: { label: 'Learning', icon: '📚' },
  level: { label: 'Level Up', icon: '⭐' },
  general: { label: 'General', icon: '🏆' },
};

export default function AchievementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
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
      router.push('/login?redirect=/achievements');
      return;
    }

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
            `🎉 Unlocked ${newly_earned.length} achievement(s)! +${total_xp_bonus} bonus XP!`
          );
          // Show each achievement
          newly_earned.forEach((a: { icon: string; name: string }) => {
            toast.success(`${a.icon} ${a.name}`, { duration: 4000 });
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 dark:border-amber-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-700 dark:to-orange-700 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">🏆 Achievements</h1>
              <p className="text-amber-100 dark:text-amber-200">
                Track your progress and unlock rewards
              </p>
            </div>
            <button
              onClick={handleCheckAchievements}
              disabled={checking}
              className="bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {checking ? (
                <>
                  <span className="animate-spin">⏳</span> Checking...
                </>
              ) : (
                <>🔍 Check Progress</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                {stats.earned}/{stats.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Unlocked</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.total_xp.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total XP</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                Lv.{stats.level}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Level</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((stats.earned / stats.total) * 100)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Complete</div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const catInfo = categoryLabels[cat] || { label: cat, icon: '🏷️' };
            const count = cat === 'all' ? achievements.length : grouped[cat]?.length || 0;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-amber-600 dark:bg-amber-700 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? '🏆 All' : `${catInfo.icon} ${catInfo.label}`} ({count})
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
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No achievements in this category yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Keep exploring to unlock more!</p>
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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-5 transition-all ${
        earned ? 'ring-2 ring-amber-400 dark:ring-amber-500' : 'opacity-80 grayscale-[30%]'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`text-4xl ${earned ? '' : 'filter grayscale'}`}>{achievement.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {achievement.name}
            </h3>
            {earned && (
              <span className="flex-shrink-0 text-amber-500 dark:text-amber-400 text-lg">✓</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>

          {/* Progress Bar */}
          {!earned && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>
                  {achievement.current_value} / {achievement.requirement_value}
                </span>
                <span>{achievement.progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all"
                  style={{ width: `${achievement.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Reward */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              +{achievement.xp_reward} XP reward
            </span>
            {earned && achievement.earned_at && (
              <span className="text-gray-400 dark:text-gray-500 text-xs">
                {new Date(achievement.earned_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
