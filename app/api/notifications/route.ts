import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';

/**
 * GET /api/notifications
 * Fetch user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to fetch notifications' } },
        { status: 500 }
      );
    }

    // Count unread
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount || 0,
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 */
const MarkReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  mark_all: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = MarkReadSchema.parse(body);

    if (validatedData.mark_all) {
      // Mark all notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Failed to mark all as read:', error);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to mark notifications as read' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { marked_count: 'all' },
      });
    } else if (validatedData.notification_ids && validatedData.notification_ids.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', validatedData.notification_ids);

      if (error) {
        console.error('Failed to mark notifications as read:', error);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to mark notifications as read' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { marked_count: validatedData.notification_ids.length },
      });
    } else {
      return NextResponse.json(
        { success: false, error: { message: 'Must provide notification_ids or mark_all' } },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.format() } },
        { status: 400 }
      );
    }

    console.error('Mark read error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/test
 * Create a test notification (for development)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Create a test notification
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: user.id,
      p_type: 'system',
      p_title: 'Test Notification',
      p_message: 'This is a test notification from the system.',
      p_link: '/my-plants',
      p_metadata: { test: true },
    });

    if (error) {
      console.error('Failed to create test notification:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to create notification' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { notification_id: data },
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 */
const DeleteSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  delete_all_read: z.boolean().optional(),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = DeleteSchema.parse(body);

    if (validatedData.delete_all_read) {
      // Delete all read notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true);

      if (error) {
        console.error('Failed to delete notifications:', error);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to delete notifications' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { deleted: 'all_read' },
      });
    } else if (validatedData.notification_ids && validatedData.notification_ids.length > 0) {
      // Delete specific notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .in('id', validatedData.notification_ids);

      if (error) {
        console.error('Failed to delete notifications:', error);
        return NextResponse.json(
          { success: false, error: { message: 'Failed to delete notifications' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { deleted_count: validatedData.notification_ids.length },
      });
    } else {
      return NextResponse.json(
        { success: false, error: { message: 'Must provide notification_ids or delete_all_read' } },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.format() } },
        { status: 400 }
      );
    }

    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

