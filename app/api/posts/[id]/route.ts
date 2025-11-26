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

    // Fetch post with profile and comments
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url
        ),
        comments (
          *,
          profiles:author_id (
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

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

    return NextResponse.json(
      {
        success: true,
        data: { post },
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

