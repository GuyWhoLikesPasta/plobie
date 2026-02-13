import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/articles - List all published articles
 * Query params: category, difficulty
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    let query = supabase
      .from('articles')
      .select(
        'id, slug, title, category, description, icon, difficulty, read_time, xp_reward, created_at'
      )
      .eq('published', true)
      .order('created_at', { ascending: true });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) {
      // Table may not exist yet if migration hasn't been applied
      if (
        error.code === '42P01' ||
        error.message.includes('does not exist') ||
        error.message.includes('schema cache') ||
        error.message.includes('Could not find')
      ) {
        return NextResponse.json({ articles: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
