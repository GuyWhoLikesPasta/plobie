/**
 * POST /api/posts/[id]/comments
 * 
 * Create a comment on a post
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { RateLimits } from '@/lib/rate-limit';
import { ApiResponse, ErrorCodes } from '@/lib/types';
import { trackEvent, GA4_EVENTS } from '@/lib/analytics';

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ comment_id: string; xp_awarded: number }>>> {
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
            message: 'You must be logged in to comment',
          },
        },
        { status: 401 }
      );
    }

    // Rate limit check: 30 comments per hour per user
    if (!RateLimits.commentCreate(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many comments. Please try again in an hour.',
          },
        },
        { status: 429 }
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

    // Verify post exists and get author
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, author_id, profile_id')
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

    // Parse request body
    const body = await request.json();
    const validation = CreateCommentSchema.safeParse(body);

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

    const { content } = validation.data;

    // Create comment using admin client
    const adminSupabase = createAdminClient();
    const { data: comment, error: commentError } = await adminSupabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        profile_id: profile.id,
        content,
      })
      .select('id')
      .single();

    if (commentError) {
      console.error('Comment creation error:', commentError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to create comment',
          },
        },
        { status: 500 }
      );
    }

    // Award XP for comment creation (+1 XP, cap 10/day)
    const { data: xpData } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile.id,
      p_action_type: 'comment_create',
      p_amount: 1,
      p_reference_type: 'comment',
      p_reference_id: comment.id,
    });

    const xpResult = (xpData as unknown as any[])?.[0];
    const xpAwarded = xpResult?.xp_awarded || 0;

    // Send notification to post author (if not commenting on own post)
    if (post.author_id && post.author_id !== user.id) {
      const { data: commenterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', profile.id)
        .single();

      await adminSupabase.rpc('create_notification', {
        p_user_id: post.author_id,
        p_type: 'comment',
        p_title: 'New comment on your post',
        p_message: `${commenterProfile?.username || 'Someone'} commented on "${post.title?.substring(0, 50) || 'your post'}"`,
        p_link: `/hobbies/posts/${postId}`,
        p_metadata: {
          post_id: postId,
          comment_id: comment.id,
          commenter_id: user.id,
        },
      });
    }

    // Track analytics event
    trackEvent('comment_created', postId);

    return NextResponse.json(
      {
        success: true,
        data: {
          comment_id: comment.id,
          xp_awarded: xpAwarded,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Comment creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to create comment',
        },
      },
      { status: 500 }
    );
  }
}

