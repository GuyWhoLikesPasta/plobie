import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

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
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (achievementsError) {
      console.error('Achievements fetch error:', achievementsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Get user's earned achievements
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', user.id);

    if (userAchievementsError) {
      console.error('User achievements fetch error:', userAchievementsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user achievements' },
        { status: 500 }
      );
    }

    // Create a map of earned achievements
    const earnedMap = new Map<string, string>(
      ((userAchievements || []) as UserAchievement[]).map((ua: UserAchievement) => [
        ua.achievement_id,
        ua.earned_at,
      ])
    );

    // Get user stats for progress calculation
    const { data: xpBalance } = await supabase
      .from('xp_balances')
      .select('total_xp')
      .eq('profile_id', user.id)
      .single();

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    const { count: articlesRead } = await supabase
      .from('article_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalXp = (xpBalance?.total_xp as number) || 0;
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;

    // Map achievements with earned status and progress
    const achievementsWithProgress = ((achievements || []) as Achievement[]).map(
      (achievement: Achievement) => {
        const earned = earnedMap.has(achievement.id);
        let currentValue = 0;

        switch (achievement.requirement_type) {
          case 'xp_total':
            currentValue = totalXp;
            break;
          case 'posts_count':
            currentValue = postsCount || 0;
            break;
          case 'comments_count':
            currentValue = commentsCount || 0;
            break;
          case 'articles_read':
            currentValue = articlesRead || 0;
            break;
          case 'level':
            currentValue = level;
            break;
        }

        const progress = Math.min(
          100,
          Math.round((currentValue / achievement.requirement_value) * 100)
        );

        return {
          ...achievement,
          earned,
          earned_at: earnedMap.get(achievement.id) || null,
          current_value: currentValue,
          progress,
        };
      }
    );

    // Group by category
    const grouped = achievementsWithProgress.reduce(
      (
        acc: Record<string, typeof achievementsWithProgress>,
        achievement: (typeof achievementsWithProgress)[number]
      ) => {
        const category = achievement.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(achievement);
        return acc;
      },
      {} as Record<string, typeof achievementsWithProgress>
    );

    return NextResponse.json({
      success: true,
      data: {
        achievements: achievementsWithProgress,
        grouped,
        stats: {
          total: achievements?.length || 0,
          earned: userAchievements?.length || 0,
          total_xp: totalXp,
          level,
          posts: postsCount || 0,
          comments: commentsCount || 0,
          articles: articlesRead || 0,
        },
      },
    });
  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// POST - Check and award new achievements
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Call the check_achievements function
    const { data: result, error: rpcError } = await supabase.rpc('check_achievements', {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error('Check achievements RPC error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Failed to check achievements' },
        { status: 500 }
      );
    }

    // Get details of newly earned achievements
    const newlyEarnedIds = (result as { newly_earned: string[] }[])?.[0]?.newly_earned || [];
    let newAchievements: {
      id: string;
      name: string;
      description: string;
      icon: string;
      xp_reward: number;
    }[] = [];

    if (newlyEarnedIds.length > 0) {
      const { data: achievements } = await supabase
        .from('achievements')
        .select('id, name, description, icon, xp_reward')
        .in('id', newlyEarnedIds);

      newAchievements = (achievements as typeof newAchievements) || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        newly_earned: newAchievements,
        total_xp_bonus: (result as { total_xp_bonus: number }[])?.[0]?.total_xp_bonus || 0,
      },
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
