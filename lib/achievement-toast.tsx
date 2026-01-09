import toast from 'react-hot-toast';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

/**
 * Show a celebratory toast when an achievement is unlocked
 */
export function showAchievementToast(achievement: Achievement) {
  toast.custom(
    t => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
      >
        {/* Icon section */}
        <div className="flex items-center justify-center w-16 bg-amber-600/30">
          <span className="text-3xl">{achievement.icon}</span>
        </div>

        {/* Content section */}
        <div className="flex-1 p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">🏆 Achievement Unlocked!</p>
              <p className="mt-1 text-lg font-bold text-white">{achievement.name}</p>
              <p className="text-sm text-amber-100">{achievement.description}</p>
              {achievement.xp_reward > 0 && (
                <p className="mt-1 text-xs font-semibold text-amber-900">
                  +{achievement.xp_reward} XP Bonus!
                </p>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="ml-3 text-amber-900 hover:text-amber-800"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 6000,
      position: 'top-center',
    }
  );
}

/**
 * Show multiple achievement toasts with staggered timing
 */
export function showAchievementToasts(achievements: Achievement[]) {
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementToast(achievement);
    }, index * 1500); // Stagger by 1.5 seconds
  });
}

/**
 * Check and show achievements after an XP-earning action
 */
export async function checkAndShowAchievements(): Promise<{
  newlyEarned: Achievement[];
  totalXpBonus: number;
}> {
  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
    });

    if (!response.ok) {
      console.error('Failed to check achievements');
      return { newlyEarned: [], totalXpBonus: 0 };
    }

    const data = await response.json();

    if (data.success && data.data.newly_earned?.length > 0) {
      showAchievementToasts(data.data.newly_earned);
      return {
        newlyEarned: data.data.newly_earned,
        totalXpBonus: data.data.total_xp_bonus || 0,
      };
    }

    return { newlyEarned: [], totalXpBonus: 0 };
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { newlyEarned: [], totalXpBonus: 0 };
  }
}
