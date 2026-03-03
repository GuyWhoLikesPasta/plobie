/**
 * Top Posts API
 *
 * GET /api/posts/top - Hot-scored posts for TopPostsBanner and feed sections
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const TopPostsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
  community: z.string().optional(),
  exclude_community: z.string().optional(),
  days: z.coerce.number().int().min(1).max(90).default(7),
});

function hotScore(
  likeCount: number,
  commentCount: number,
  createdAt: string,
  superlikeCount: number = 0
): number {
  const hoursSincePosted = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const recencyBonus = Math.max(0, 10 - hoursSincePosted);
  return likeCount * 2 + superlikeCount * 5 + commentCount * 3 + recencyBonus;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ posts: any[] }>>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const rawParams = {
      limit: searchParams.get('limit') || undefined,
      community: searchParams.get('community') || undefined,
      exclude_community: searchParams.get('exclude_community') || undefined,
      days: searchParams.get('days') || undefined,
    };

    const validation = TopPostsSchema.safeParse(rawParams);

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

    const { limit, community, exclude_community, days } = validation.data;

    const supabase = await createServerSupabaseClient();

    // Fetch posts from last N days (manual joins - no posts_with_stats view)
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();

    let query = supabase
      .from('posts')
      .select('id, author_id, hobby_group, title, content, image_url, created_at')
      .or('hidden.is.null,hidden.eq.false')
      .gte('created_at', sinceIso);

    if (community) {
      query = query.eq('hobby_group', community);
    }

    if (exclude_community) {
      query = query.neq('hobby_group', exclude_community);
    }

    // Fetch more than limit so we have enough to sort by hot_score
    const { data: posts, error } = await query.limit(200);

    if (error) {
      console.error('Top posts fetch error:', error.code, error.message);
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

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: { posts: [] },
        },
        { status: 200 }
      );
    }

    const postIds = posts.map((p: any) => p.id);
    const authorIds = [...new Set(posts.map((p: any) => p.author_id))];

    // Fetch like counts (only 'like' type)
    const { data: reactionCounts } = await supabase
      .from('post_reactions')
      .select('post_id')
      .in('post_id', postIds)
      .eq('reaction_type', 'like');

    // Fetch superlike counts
    const { data: superlikeReactions } = await supabase
      .from('post_reactions')
      .select('post_id')
      .in('post_id', postIds)
      .eq('reaction_type', 'superlike');

    // Fetch comment counts
    const { data: commentCounts } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch profiles (username, avatar_url)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', authorIds);

    const likeCountMap = (reactionCounts || []).reduce((acc: Record<string, number>, r: any) => {
      acc[r.post_id] = (acc[r.post_id] || 0) + 1;
      return acc;
    }, {});

    const superlikeCountMap = (superlikeReactions || []).reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.post_id] = (acc[r.post_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const commentCountMap = (commentCounts || []).reduce((acc: Record<string, number>, c: any) => {
      acc[c.post_id] = (acc[c.post_id] || 0) + 1;
      return acc;
    }, {});

    const profileMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // Attach counts, profile, hot_score; sort by hot_score DESC; take top limit
    const enriched = posts.map((post: any) => {
      const likeCount = likeCountMap[post.id] || 0;
      const superlikeCount = superlikeCountMap[post.id] || 0;
      const commentCount = commentCountMap[post.id] || 0;
      const score = hotScore(likeCount, commentCount, post.created_at, superlikeCount);
      const profile = profileMap[post.author_id] || null;
      return {
        ...post,
        like_count: likeCount,
        superlike_count: superlikeCount,
        comment_count: commentCount,
        hot_score: Math.round(score * 100) / 100,
        profiles: profile
          ? { id: profile.id, username: profile.username, avatar_url: profile.avatar_url }
          : null,
      };
    });

    enriched.sort((a: any, b: any) => b.hot_score - a.hot_score);

    const topPosts = enriched.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        data: { posts: topPosts },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Top posts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to fetch top posts',
        },
      },
      { status: 500 }
    );
  }
}
