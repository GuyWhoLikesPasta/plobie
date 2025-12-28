/**
 * PATCH /api/posts/[id]/edit - Edit a post
 * DELETE /api/posts/[id]/edit - Delete a post
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const EditPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  image_url: z.string().url().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ post_id: string }>>> {
  try {
    const { id: postId } = await params;

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to edit posts',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'User profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify post exists and belongs to user
    const { data: post } = await supabase
      .from('posts')
      .select('id, profile_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Post not found',
          },
        },
        { status: 404 }
      );
    }

    if (post.profile_id !== profile.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only edit your own posts',
          },
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = EditPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Update post
    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase
      .from('posts')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Post update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to update post',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          post_id: postId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Edit post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to edit post',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { id: postId } = await params;

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to delete posts',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_admin')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'User profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify post exists and belongs to user (or user is admin)
    const { data: post } = await supabase
      .from('posts')
      .select('id, profile_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Post not found',
          },
        },
        { status: 404 }
      );
    }

    if (post.profile_id !== profile.id && !profile.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: 'You can only delete your own posts',
          },
        },
        { status: 403 }
      );
    }

    // Delete post (cascades to comments and reactions)
    const adminSupabase = createAdminClient();
    const { error: deleteError } = await adminSupabase.from('posts').delete().eq('id', postId);

    if (deleteError) {
      console.error('Post deletion error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to delete post',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          deleted: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to delete post',
        },
      },
      { status: 500 }
    );
  }
}
