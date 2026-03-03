import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';
import { z } from 'zod';

const EditCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

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

    // Verify comment exists and user owns it
    const { data: comment } = await supabase
      .from('comments')
      .select('id, author_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Comment not found' } },
        { status: 404 }
      );
    }

    if (comment.author_id !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.FORBIDDEN, message: 'Not your comment' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = EditCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid content',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase
      .from('comments')
      .update({ content: validation.data.content })
      .eq('id', commentId);

    if (updateError) {
      console.error('Comment update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to update comment' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { updated: true } });
  } catch (error) {
    console.error('Comment edit error:', error);
    return NextResponse.json(
      { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;

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

    // Verify comment exists and user owns it (or is admin)
    const { data: comment } = await supabase
      .from('comments')
      .select('id, author_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Comment not found' } },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (comment.author_id !== user.id && !profile?.is_admin) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.FORBIDDEN, message: 'Not authorized' } },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    const { error: deleteError } = await adminSupabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Comment delete error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to delete comment' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Comment delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal error' } },
      { status: 500 }
    );
  }
}
