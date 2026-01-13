import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Admin client for bypassing RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to verify admin status
async function verifyAdmin(userId: string) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user, supabase };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetUserId } = await params;
    const body = await request.json();
    const { action } = body;

    // Verify admin
    const authResult = await verifyAdmin(targetUserId);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;

    switch (action) {
      case 'toggle_admin': {
        const { currentStatus } = body;

        // Prevent self-demotion
        if (targetUserId === user.id && currentStatus === true) {
          return NextResponse.json(
            { error: 'Cannot remove your own admin status' },
            { status: 400 }
          );
        }

        const { error } = await adminSupabase
          .from('profiles')
          .update({ is_admin: !currentStatus })
          .eq('id', targetUserId);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `User ${!currentStatus ? 'promoted to' : 'removed from'} admin`,
          newStatus: !currentStatus,
        });
      }

      case 'reset_xp': {
        // Reset XP balance
        const { error: xpError } = await adminSupabase
          .from('xp_balances')
          .update({ total_xp: 0, daily_xp: 0 })
          .eq('profile_id', targetUserId);

        if (xpError) throw xpError;

        // Optionally delete XP events (for a clean slate)
        // await adminSupabase.from('xp_events').delete().eq('profile_id', targetUserId);

        return NextResponse.json({
          success: true,
          message: 'XP reset successfully',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
