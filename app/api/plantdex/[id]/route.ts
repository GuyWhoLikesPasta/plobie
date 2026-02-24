import { createSupabaseFromRequest } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// =====================================
// PLANTDEX DETAIL API
// =====================================
// Get a single plant's details by ID or key

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseFromRequest(request);

    // Try to find by UUID first, then by key
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('plants').select('*');

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('key', id);
    }

    const { data: plant, error } = await query.single();

    if (error || !plant) {
      return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plant,
    });
  } catch (error) {
    console.error('Error in GET /api/plantdex/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
