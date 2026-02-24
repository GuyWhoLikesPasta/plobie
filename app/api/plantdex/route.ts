import { createSupabaseFromRequest } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// =====================================
// PLANTDEX API
// =====================================
// Get the plant encyclopedia (all plant species)

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseFromRequest(request);

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    // Build query
    let query = supabase.from('plants').select('*').order('category').order('care_difficulty');

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (difficulty) {
      query = query.eq('care_difficulty', parseInt(difficulty));
    }

    const { data: plants, error } = await query;

    if (error) {
      console.error('Error fetching plants:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plants' },
        { status: 500 }
      );
    }

    // Group by category for easier display
    const categories = [...new Set(plants?.map(p => p.category) || [])];

    return NextResponse.json({
      success: true,
      plants: plants || [],
      categories,
      total: plants?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/plantdex:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
