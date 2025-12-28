/**
 * Posts API
 *
 * GET  /api/posts - List posts with pagination and filtering
 * POST /api/posts - Create a new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { RateLimits } from '@/lib/rate-limit';
import { ApiResponse, ErrorCodes } from '@/lib/types';
import { trackEvent, GA4_EVENTS } from '@/lib/analytics';

const CreatePostSchema = z.object({
  hobby_group: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  image_url: z.string().url().optional(),
});

const ListPostsSchema = z.object({
  hobby_group: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['recent', 'trending']).optional().default('recent'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ posts: any[]; total: number }>>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const rawParams = {
      hobby_group: searchParams.get('hobby_group') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validation = ListPostsSchema.safeParse(rawParams);

    if (!validation.success) {
      console.error('Validation failed for params:', rawParams);
      console.error('Validation errors:', validation.error.flatten());
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid query parameters',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { hobby_group, search, sort, limit, offset } = validation.data;

    const supabase = await createServerSupabaseClient();

    // Build query - simple query without joins
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .or('hidden.is.null,hidden.eq.false'); // Only show non-hidden posts (handle NULL)

    // Filter by hobby group if provided
    if (hobby_group) {
      query = query.eq('hobby_group', hobby_group);
    }

    // Search in title and content (only if columns exist)
    if (search) {
      // Search in content always, title if it exists
      query = query.ilike('content', `%${search}%`);
    }

    // Sort by recent
    query = query.order('created_at', { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    console.log('Posts query result:', {
      postsCount: posts?.length,
      totalCount: count,
      hasError: !!error,
      error: error ? JSON.stringify(error) : null,
    });

    if (error) {
      console.error('Posts fetch error:', error);
      console.error('Posts fetch error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to fetch posts: ${error.message || error.code || 'Unknown error'}`,
            details: error,
          },
        },
        { status: 500 }
      );
    }

    console.log('Returning posts:', posts?.length || 0);

    // Fetch profiles and counts separately
    if (posts && posts.length > 0) {
      const authorIds = [...new Set(posts.map((p: any) => p.author_id))];

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      // Get comment counts
      const { data: commentCounts } = await supabase
        .from('comments')
        .select('post_id')
        .in(
          'post_id',
          posts.map((p: any) => p.id)
        );

      // Get reaction counts
      const { data: reactionCounts } = await supabase
        .from('post_reactions')
        .select('post_id')
        .in(
          'post_id',
          posts.map((p: any) => p.id)
        );

      // Map counts
      const commentCountMap = (commentCounts || []).reduce((acc: any, c: any) => {
        acc[c.post_id] = (acc[c.post_id] || 0) + 1;
        return acc;
      }, {});

      const reactionCountMap = (reactionCounts || []).reduce((acc: any, r: any) => {
        acc[r.post_id] = (acc[r.post_id] || 0) + 1;
        return acc;
      }, {});

      // Attach profiles and counts to posts
      posts.forEach((post: any) => {
        post.profiles = profiles?.find((p: any) => p.id === post.author_id) || null;
        post.comments = [{ count: commentCountMap[post.id] || 0 }];
        post.reactions = [{ count: reactionCountMap[post.id] || 0 }];
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          posts: posts || [],
          total: count || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Posts list error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch posts',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ post_id: string; xp_awarded: number }>>> {
  try {
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
            message: 'You must be logged in to create a post',
          },
        },
        { status: 401 }
      );
    }

    // Rate limit check: 10 posts per hour per user
    if (!RateLimits.postCreate(user.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many posts. Please try again in an hour.',
          },
        },
        { status: 429 }
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

    // Parse request body
    const body = await request.json();
    const validation = CreatePostSchema.safeParse(body);

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

    const { hobby_group, title, content, image_url } = validation.data;

    // Create post using admin client
    const adminSupabase = createAdminClient();
    const { data: post, error: postError } = await adminSupabase
      .from('posts')
      .insert({
        author_id: user.id,
        hobby_group,
        title,
        content,
        image_url,
      })
      .select('id')
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      console.error('Post creation error details:', JSON.stringify(postError, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to create post: ${postError.message || postError.code || 'Unknown error'}`,
            details: postError,
          },
        },
        { status: 500 }
      );
    }

    // Award XP for post creation (+3 XP, cap 100/day)
    const { data: xpData, error: xpError } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile.id,
      p_action_type: 'post_create',
      p_xp_amount: 3,
      p_description: 'Created a post',
      p_reference_id: post.id,
    });

    if (xpError) {
      console.error('XP award error:', xpError);
    }

    const xpResult = (xpData as unknown as any[])?.[0];
    const xpAwarded = xpResult?.new_total_xp || 0;

    // Track analytics event
    trackEvent('post_created', hobby_group, !!image_url);

    return NextResponse.json(
      {
        success: true,
        data: {
          post_id: post.id,
          xp_awarded: xpAwarded,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to create post',
        },
      },
      { status: 500 }
    );
  }
}
