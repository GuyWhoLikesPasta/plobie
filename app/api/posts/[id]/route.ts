/**
 * GET /api/posts/[id]
 *
 * Get a single post with comments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ post: any }>>> {
  try {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();

    // Fetch post (no joins to avoid FK issues)
    const { data: post, error } = await supabase.from('posts').select('*').eq('id', id).single();

    if (error || !post) {
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

    // Get post author profile
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', post.author_id)
      .single();

    // Get comments with author profiles
    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    // Get comment author profiles
    let commentProfiles: any[] = [];
    if (comments && comments.length > 0) {
      const commentAuthorIds = [...new Set(comments.map((c: any) => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', commentAuthorIds);

      commentProfiles = profiles || [];
    }

    // Attach profiles to comments
    const commentsWithProfiles = (comments || []).map((comment: any) => ({
      ...comment,
      profiles: commentProfiles.find((p: any) => p.id === comment.author_id) || null,
    }));

    // Attach to post
    const postWithData = {
      ...post,
      profiles: authorProfile,
      comments: commentsWithProfiles,
    };

    return NextResponse.json(
      {
        success: true,
        data: { post: postWithData },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Post fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch post',
        },
      },
      { status: 500 }
    );
  }
}
