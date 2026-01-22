import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { levelFromTotalXp } from '@/lib/xp-engine';

// Admin client for bypassing RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Create server client to check auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all profiles using admin client
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Fetch all XP balances using admin client
    // Note: level is calculated, not stored in the table
    const { data: xpBalances, error: xpError } = await adminSupabase
      .from('xp_balances')
      .select('profile_id, total_xp, daily_xp');

    if (xpError) {
      console.error('XP balances fetch error:', xpError);
      // Continue without XP data
    }

    // Create a map of profile_id to XP data with calculated level
    const xpMap = new Map(
      (xpBalances || []).map(xp => [
        xp.profile_id,
        {
          ...xp,
          level: levelFromTotalXp(xp.total_xp || 0),
        },
      ])
    );

    // Fetch post counts using admin client
    const { data: postCounts } = await adminSupabase.from('posts').select('author_id');

    const postCountMap = new Map<string, number>();
    (postCounts || []).forEach(post => {
      const count = postCountMap.get(post.author_id) || 0;
      postCountMap.set(post.author_id, count + 1);
    });

    // Fetch comment counts using admin client
    const { data: commentCounts } = await adminSupabase.from('comments').select('author_id');

    const commentCountMap = new Map<string, number>();
    (commentCounts || []).forEach(comment => {
      const count = commentCountMap.get(comment.author_id) || 0;
      commentCountMap.set(comment.author_id, count + 1);
    });

    // Combine all data
    const usersWithData = (profiles || []).map(profile => {
      const xpData = xpMap.get(profile.id);
      return {
        id: profile.id,
        email: profile.username + '@plobie',
        created_at: profile.created_at,
        profiles: {
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          is_admin: profile.is_admin || false,
          xp_total: xpData?.total_xp || 0,
          level: xpData?.level || 1,
        },
        post_count: postCountMap.get(profile.id) || 0,
        comment_count: commentCountMap.get(profile.id) || 0,
      };
    });

    return NextResponse.json({ users: usersWithData });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
