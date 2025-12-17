import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// =====================================
// DEV: RESET XP
// =====================================
// Reset user's XP caps for testing
// ⚠️ ONLY WORKS IN DEVELOPMENT MODE

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete today's XP events
    const { error: deleteError } = await adminSupabase
      .from('xp_events')
      .delete()
      .eq('profile_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0]);

    if (deleteError) {
      console.error('Error deleting XP events:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to reset XP caps' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'XP caps reset for today',
      user_id: user.id,
    });
  } catch (error) {
    console.error('Error in POST /api/dev/reset-xp:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

