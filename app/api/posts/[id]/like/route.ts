/**
 * POST /api/posts/[id]/like - Like a post
 * DELETE /api/posts/[id]/like - Unlike a post
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ liked: boolean; count: number }>>> {
  try {
    const { id: postId } = await params;

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to like posts',
          },
        },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
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

    // Verify post exists
    const { data: post } = await supabase
      .from('posts')
      .select('id')
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

    // Add reaction
    const adminSupabase = createAdminClient();
    const { error: reactionError } = await adminSupabase
      .from('reactions')
      .insert({
        user_id: user.id,
        profile_id: profile.id,
        post_id: postId,
        reaction_type: 'like',
      });

    if (reactionError) {
      // Check if already liked
      if (reactionError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCodes.ALREADY_EXISTS,
              message: 'You have already liked this post',
            },
          },
          { status: 409 }
        );
      }

      console.error('Reaction creation error:', reactionError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to like post',
          },
        },
        { status: 500 }
      );
    }

    // Get updated reaction count
    const { count } = await adminSupabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json(
      {
        success: true,
        data: {
          liked: true,
          count: count || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to like post',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ liked: boolean; count: number }>>> {
  try {
    const { id: postId } = await params;

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to unlike posts',
          },
        },
        { status: 401 }
      );
    }

    // Remove reaction
    const adminSupabase = createAdminClient();
    const { error: deleteError } = await adminSupabase
      .from('reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (deleteError) {
      console.error('Reaction deletion error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to unlike post',
          },
        },
        { status: 500 }
      );
    }

    // Get updated reaction count
    const { count } = await adminSupabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json(
      {
        success: true,
        data: {
          liked: false,
          count: count || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unlike post error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to unlike post',
        },
      },
      { status: 500 }
    );
  }
}

