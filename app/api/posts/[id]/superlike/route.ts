import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';
import { RateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params;

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

    if (!(await RateLimits.superlikeSend(user.id))) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many superlikes. Slow down!' },
        },
        { status: 429 }
      );
    }

    // Verify post exists and get author
    const { data: post } = await supabase
      .from('posts')
      .select('id, title, author_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.NOT_FOUND, message: 'Post not found' } },
        { status: 404 }
      );
    }

    // Can't superlike own post
    if (post.author_id === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.SELF_ACTION, message: 'Cannot superlike your own post' },
        },
        { status: 400 }
      );
    }

    // Call the atomic send_superlike RPC
    const adminSupabase = createAdminClient();
    const { data: result, error: rpcError } = await adminSupabase.rpc('send_superlike', {
      p_sender_id: user.id,
      p_post_id: postId,
      p_recipient_id: post.author_id,
    });

    if (rpcError) {
      console.error('Send superlike RPC error:', rpcError);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.DATABASE_ERROR, message: 'Failed to send superlike' },
        },
        { status: 500 }
      );
    }

    const rpcResult = result as { success: boolean; error?: string; new_balance?: number };

    if (!rpcResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code:
              rpcResult.error === 'INSUFFICIENT_BALANCE'
                ? ErrorCodes.INSUFFICIENT_BALANCE
                : ErrorCodes.DATABASE_ERROR,
            message:
              rpcResult.error === 'INSUFFICIENT_BALANCE'
                ? 'No superlikes remaining. Purchase a pack!'
                : 'Failed to send superlike',
          },
        },
        { status: 400 }
      );
    }

    // Award XP to sender
    await adminSupabase.rpc('apply_xp', {
      p_profile_id: user.id,
      p_action_type: 'superlike_sent',
      p_xp_amount: 2,
      p_description: 'Sent a superlike',
      p_reference_id: postId,
    });

    // Award XP to recipient
    await adminSupabase.rpc('apply_xp', {
      p_profile_id: post.author_id,
      p_action_type: 'superlike_received',
      p_xp_amount: 5,
      p_description: 'Received a superlike',
      p_reference_id: postId,
    });

    // Send notification to post author
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    await adminSupabase.rpc('create_notification', {
      p_user_id: post.author_id,
      p_type: 'superlike',
      p_title: 'New Superlike!',
      p_message: `${senderProfile?.username || 'Someone'} superliked "${post.title?.substring(0, 50) || 'your post'}"`,
      p_link: `/hobbies/posts/${postId}`,
      p_metadata: {
        post_id: postId,
        sender_id: user.id,
      },
    });

    // Get updated superlike count
    const { count: superlikeCount } = await adminSupabase
      .from('post_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('reaction_type', 'superlike');

    return NextResponse.json({
      success: true,
      data: {
        superliked: true,
        superlike_count: superlikeCount || 0,
        remaining_balance: rpcResult.new_balance ?? 0,
      },
    });
  } catch (error) {
    console.error('Superlike error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to superlike' },
      },
      { status: 500 }
    );
  }
}
