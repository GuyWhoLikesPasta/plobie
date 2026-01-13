import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Admin client for bypassing RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

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

    // Check if user is authenticated
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

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get username for logging
    const { data: targetUser } = await adminSupabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete related data in order (respecting foreign key constraints)
    // 1. Delete XP events
    await adminSupabase.from('xp_events').delete().eq('profile_id', userId);

    // 2. Delete XP balance
    await adminSupabase.from('xp_balances').delete().eq('profile_id', userId);

    // 3. Delete user achievements
    await adminSupabase.from('user_achievements').delete().eq('user_id', userId);

    // 4. Delete comments
    await adminSupabase.from('comments').delete().eq('author_id', userId);

    // 5. Delete posts
    await adminSupabase.from('posts').delete().eq('author_id', userId);

    // 6. Delete pot claims
    await adminSupabase.from('pot_claims').delete().eq('user_id', userId);

    // 7. Delete notifications (both sent and received)
    await adminSupabase.from('notifications').delete().eq('user_id', userId);

    // 8. Delete profile
    const { error: profileError } = await adminSupabase.from('profiles').delete().eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }

    // 9. Delete from auth.users (requires admin client)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Don't throw - profile is already deleted, auth cleanup is secondary
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
