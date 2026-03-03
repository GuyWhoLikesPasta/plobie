import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // Cascade delete user data in order (respecting FK constraints)
    // 1. XP data
    await adminSupabase.from('xp_events').delete().eq('profile_id', user.id);
    await adminSupabase.from('xp_balances').delete().eq('profile_id', user.id);

    // 2. Achievements
    await adminSupabase.from('user_achievements').delete().eq('user_id', user.id);

    // 3. Superlike data
    await adminSupabase.from('superlike_transactions').delete().eq('user_id', user.id);
    await adminSupabase.from('superlike_balances').delete().eq('user_id', user.id);
    await adminSupabase.from('creator_earning_events').delete().eq('creator_id', user.id);
    await adminSupabase.from('creator_earnings').delete().eq('user_id', user.id);

    // 4. Social data
    await adminSupabase.from('post_reactions').delete().eq('user_id', user.id);
    await adminSupabase.from('comments').delete().eq('author_id', user.id);
    await adminSupabase.from('notifications').delete().eq('user_id', user.id);

    // 5. Posts (cascade deletes reactions/comments on those posts)
    await adminSupabase.from('posts').delete().eq('author_id', user.id);

    // 6. Plant data
    await adminSupabase.from('user_plants').delete().eq('user_id', user.id);
    await adminSupabase.from('pot_claims').delete().eq('user_id', user.id);

    // 7. Game data
    await adminSupabase.from('game_sessions').delete().eq('profile_id', user.id);

    // 8. Reports
    await adminSupabase.from('reports').delete().eq('reporter_id', user.id);

    // 9. Profile
    await adminSupabase.from('profiles').delete().eq('id', user.id);

    // 10. Delete auth user
    const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to delete account' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to delete account' },
      },
      { status: 500 }
    );
  }
}
