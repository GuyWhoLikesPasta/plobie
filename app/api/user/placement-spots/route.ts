import { createSupabaseFromRequest, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const DEFAULT_SLOTS = 6;

const UpdateSpotSchema = z.object({
  slot_index: z.number().int().min(0).max(19),
  pot_id: z.string().uuid().nullable().optional(),
  user_plant_id: z.string().uuid().nullable().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  position_z: z.number().optional(),
  rotation_y: z.number().optional(),
  label: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseFromRequest(request);
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('max_placement_spots')
      .eq('id', user.id)
      .single();

    const maxSpots = profile?.max_placement_spots ?? DEFAULT_SLOTS;

    const { data: existingSpots, error } = await supabase
      .from('placement_spots')
      .select('*, user_plant:user_plants(id, nickname, plant:plants(name, key, image_url))')
      .eq('user_id', user.id)
      .order('slot_index');

    if (error) {
      console.error('Error fetching placement spots:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch spots' }, { status: 500 });
    }

    if (existingSpots && existingSpots.length > 0) {
      return NextResponse.json({ success: true, spots: existingSpots, max_spots: maxSpots });
    }

    const seeds = Array.from({ length: maxSpots }, (_, i) => ({
      user_id: user.id,
      slot_index: i,
      label: `Spot ${i + 1}`,
    }));

    const { data: created, error: seedError } = await adminSupabase
      .from('placement_spots')
      .insert(seeds)
      .select('*');

    if (seedError) {
      console.error('Error seeding placement spots:', seedError);
      return NextResponse.json(
        { success: false, error: 'Failed to initialize garden spots' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, spots: created ?? [], max_spots: maxSpots });
  } catch (error) {
    console.error('Error in GET /api/user/placement-spots:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseFromRequest(request);
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = UpdateSpotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { slot_index, ...updates } = validation.data;

    const isOccupied = !!(updates.pot_id || updates.user_plant_id);

    const { data: spot, error } = await adminSupabase
      .from('placement_spots')
      .update({ ...updates, is_occupied: isOccupied, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('slot_index', slot_index)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating placement spot:', error);
      return NextResponse.json({ success: false, error: 'Failed to update spot' }, { status: 500 });
    }

    return NextResponse.json({ success: true, spot });
  } catch (error) {
    console.error('Error in PUT /api/user/placement-spots:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
