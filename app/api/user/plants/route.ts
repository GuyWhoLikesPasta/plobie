import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// =====================================
// USER PLANTS API
// =====================================
// Get and create user's plant collection

// Schema for creating a new plant
const CreatePlantSchema = z.object({
  plant_id: z.string().uuid(),
  pot_id: z.string().uuid().optional(),
  nickname: z.string().max(50).optional(),
});

// =====================================
// GET - Get User's Plants
// =====================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's plants with plant details
    const { data: userPlants, error } = await supabase
      .from('user_plants')
      .select(
        `
        *,
        plant:plants(*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user plants:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plants' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total: userPlants?.length || 0,
      alive: userPlants?.filter(p => !p.is_dead).length || 0,
      mature: userPlants?.filter(p => p.matured_at).length || 0,
      dead: userPlants?.filter(p => p.is_dead).length || 0,
      totalXpEarned: userPlants?.reduce((sum, p) => sum + (p.xp_earned || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      plants: userPlants || [],
      stats,
    });
  } catch (error) {
    console.error('Error in GET /api/user/plants:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================
// POST - Plant a New Plant
// =====================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = CreatePlantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { plant_id, pot_id, nickname } = validation.data;

    // Verify plant exists
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .select('id, name, key')
      .eq('id', plant_id)
      .single();

    if (plantError || !plant) {
      return NextResponse.json(
        { success: false, error: 'Plant species not found' },
        { status: 404 }
      );
    }

    // If pot_id provided, verify user owns the pot
    if (pot_id) {
      const { data: potClaim, error: potError } = await supabase
        .from('pot_claims')
        .select('id')
        .eq('pot_id', pot_id)
        .eq('user_id', user.id)
        .single();

      if (potError || !potClaim) {
        return NextResponse.json(
          { success: false, error: 'You do not own this pot' },
          { status: 403 }
        );
      }
    }

    // Create the user plant
    const { data: userPlant, error: createError } = await adminSupabase
      .from('user_plants')
      .insert({
        user_id: user.id,
        plant_id,
        pot_id: pot_id || null,
        nickname: nickname || null,
      })
      .select('*, plant:plants(*)')
      .single();

    if (createError) {
      console.error('Error creating user plant:', createError);
      return NextResponse.json({ success: false, error: 'Failed to plant' }, { status: 500 });
    }

    // Award XP for planting
    const { data: xpResult } = await adminSupabase.rpc('apply_xp', {
      p_profile_id: user.id,
      p_action_type: 'plant_new',
      p_xp_amount: 50,
      p_description: `Planted ${plant.name}`,
      p_reference_id: userPlant.id,
    });

    return NextResponse.json({
      success: true,
      plant: userPlant,
      xp_awarded: 50,
      message: `Successfully planted ${plant.name}!`,
    });
  } catch (error) {
    console.error('Error in POST /api/user/plants:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
