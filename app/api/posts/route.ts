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

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ posts: any[]; total: number }>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const validation = ListPostsSchema.safeParse({
      hobby_group: searchParams.get('hobby_group'),
      search: searchParams.get('search'),
      sort: searchParams.get('sort'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!validation.success) {
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

    // Build query
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url
        ),
        comments:comments(count),
        reactions:post_reactions(count)
      `, { count: 'exact' });

    // Filter by hobby group if provided
    if (hobby_group) {
      query = query.eq('hobby_group', hobby_group);
    }

    // Search in title and content
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Sort by recent or trending
    if (sort === 'trending') {
      // Trending: sort by engagement (reactions + comments) in last 7 days
      query = query
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Posts fetch error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: 'Failed to fetch posts',
          },
        },
        { status: 500 }
      );
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

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ post_id: string; xp_awarded: number }>>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

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
        profile_id: profile.id,
        group_slug: hobby_group.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
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

    // Award XP for post creation (+3 XP, cap 5/day)
    const { data: xpData } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: profile.id,
      p_action_type: 'post_create',
      p_amount: 3,
      p_reference_type: 'post',
      p_reference_id: post.id,
    });

    const xpResult = (xpData as unknown as any[])?.[0];
    const xpAwarded = xpResult?.xp_awarded || 0;

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

