import { createSupabaseFromRequest, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { levelFromTotalXp, DAILY_TOTAL_CAP } from '@/lib/xp-engine';

// =====================================
// USER PLANT DETAIL API
// =====================================
// Get, update, and delete a specific user plant

// Schema for updating a plant
const UpdatePlantSchema = z.object({
  action: z
    .enum(['water', 'care', 'grow', 'rename', 'link_pot', 'fertilize', 'place', 'hide'])
    .optional(),
  nickname: z.string().max(50).optional(),
  pot_id: z.string().uuid().nullable().optional(),
  growth_stage: z.number().int().min(1).optional(),
  // Unity positioning
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  rotation: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    })
    .optional(),
  scale: z.number().min(0.1).max(10).optional(),
  is_placed: z.boolean().optional(),
  is_visible: z.boolean().optional(),
});

// =====================================
// GET - Get Single Plant
// =====================================
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseFromRequest(request);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the plant
    const { data: userPlant, error } = await supabase
      .from('user_plants')
      .select('*, plant:plants(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !userPlant) {
      return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      plant: userPlant,
    });
  } catch (error) {
    console.error('Error in GET /api/user/plants/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================
// PUT - Update Plant (Water, Care, Grow, etc.)
// =====================================
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseFromRequest(request);
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
    const validation = UpdatePlantSchema.safeParse(body);

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

    const {
      action,
      nickname,
      pot_id,
      growth_stage,
      position,
      rotation,
      scale,
      is_placed,
      is_visible,
    } = validation.data;

    // Get current plant state
    const { data: currentPlant, error: fetchError } = await supabase
      .from('user_plants')
      .select('*, plant:plants(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentPlant) {
      return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
    }

    if (currentPlant.is_dead) {
      return NextResponse.json({ success: false, error: 'This plant has died' }, { status: 400 });
    }

    // Build update object based on action
    const updates: Record<string, unknown> = {};
    let xpAction: string | null = null;
    let xpAmount = 0;
    let message = '';

    switch (action) {
      case 'water':
        updates.water_level = 100;
        updates.last_watered_at = new Date().toISOString();
        xpAction = 'plant_water';
        xpAmount = 5;
        message = `Watered ${currentPlant.plant?.name || 'plant'}`;
        break;

      case 'care':
        updates.health = Math.min(100, (currentPlant.health || 0) + 10);
        updates.last_cared_at = new Date().toISOString();
        xpAction = 'garden_care';
        xpAmount = 25;
        message = `Cared for ${currentPlant.plant?.name || 'plant'}`;
        break;

      case 'grow':
        const maxStages = currentPlant.plant?.growth_stages || 5;
        const newStage = growth_stage || (currentPlant.growth_stage || 1) + 1;

        if (newStage > maxStages) {
          return NextResponse.json(
            { success: false, error: 'Plant is already fully grown' },
            { status: 400 }
          );
        }

        updates.growth_stage = newStage;

        // If reaching max stage, mark as mature
        if (newStage === maxStages && !currentPlant.matured_at) {
          updates.matured_at = new Date().toISOString();
          xpAction = 'plant_mature';
          xpAmount = currentPlant.plant?.xp_reward || 100;
          message = `${currentPlant.plant?.name || 'Plant'} reached full maturity!`;
        } else {
          message = `${currentPlant.plant?.name || 'Plant'} grew to stage ${newStage}`;
        }
        break;

      case 'rename':
        if (nickname !== undefined) {
          updates.nickname = nickname;
          message = `Renamed plant to "${nickname}"`;
        }
        break;

      case 'link_pot':
        if (pot_id !== undefined) {
          // Verify user owns the pot
          if (pot_id) {
            const { data: potClaim } = await supabase
              .from('pot_claims')
              .select('id')
              .eq('pot_id', pot_id)
              .eq('user_id', user.id)
              .single();

            if (!potClaim) {
              return NextResponse.json(
                { success: false, error: 'You do not own this pot' },
                { status: 403 }
              );
            }
          }
          updates.pot_id = pot_id;
          message = pot_id ? 'Linked plant to pot' : 'Unlinked plant from pot';
        }
        break;

      case 'fertilize':
        updates.last_fertilized_at = new Date().toISOString();
        updates.health = Math.min(100, (currentPlant.health || 0) + 15);
        xpAction = 'garden_care';
        xpAmount = 10;
        message = `Fertilized ${currentPlant.plant?.name || 'plant'}`;
        break;

      case 'place':
        updates.is_placed = true;
        updates.is_visible = true;
        message = `Placed ${currentPlant.plant?.name || 'plant'} in garden`;
        break;

      case 'hide':
        updates.is_visible = false;
        message = `Hid ${currentPlant.plant?.name || 'plant'}`;
        break;

      default:
        // Allow direct updates without action (for Unity positioning, etc.)
        if (nickname !== undefined) updates.nickname = nickname;
        if (pot_id !== undefined) updates.pot_id = pot_id;
        // Unity positioning
        if (position) {
          updates.position_x = position.x;
          updates.position_y = position.y;
          updates.position_z = position.z;
        }
        if (rotation) {
          updates.rotation_x = rotation.x;
          updates.rotation_y = rotation.y;
          updates.rotation_z = rotation.z;
        }
        if (scale !== undefined) updates.scale = scale;
        if (is_placed !== undefined) updates.is_placed = is_placed;
        if (is_visible !== undefined) updates.is_visible = is_visible;
        message = 'Plant updated';
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      const { data: updatedPlant, error: updateError } = await adminSupabase
        .from('user_plants')
        .update(updates)
        .eq('id', id)
        .select('*, plant:plants(*)')
        .single();

      if (updateError) {
        console.error('Error updating plant:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update plant' },
          { status: 500 }
        );
      }

      // Award XP if applicable
      let xpResult: Record<string, unknown> | null = null;
      if (xpAction && xpAmount > 0) {
        const { data: xpData } = await adminSupabase.rpc('apply_xp', {
          p_profile_id: user.id,
          p_action_type: xpAction,
          p_xp_amount: xpAmount,
          p_description: message,
          p_reference_id: id,
        });

        const xpRaw = (xpData as unknown as Record<string, unknown>[])?.[0];
        if (xpRaw) {
          const newTotalXp = (xpRaw.new_total_xp as number) || 0;
          const newDailyXp = (xpRaw.new_daily_xp as number) || 0;
          xpResult = {
            awarded: (xpRaw.xp_awarded as number) || 0,
            capped: xpRaw.capped || false,
            new_total_xp: newTotalXp,
            new_level: levelFromTotalXp(newTotalXp),
            level_up: ((xpRaw.level_after as number) || 0) > ((xpRaw.level_before as number) || 0),
            remaining_today: Math.max(0, DAILY_TOTAL_CAP - newDailyXp),
          };
        }

        await adminSupabase
          .from('user_plants')
          .update({ xp_earned: (currentPlant.xp_earned || 0) + xpAmount })
          .eq('id', id);
      }

      return NextResponse.json({
        success: true,
        plant: updatedPlant,
        xp_awarded: xpAmount,
        xp_result: xpResult,
        message,
      });
    }

    return NextResponse.json({
      success: true,
      plant: currentPlant,
      message: 'No changes made',
    });
  } catch (error) {
    console.error('Error in PUT /api/user/plants/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================
// DELETE - Remove Plant
// =====================================
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseFromRequest(request);
    const adminSupabase = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: plant } = await supabase
      .from('user_plants')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!plant) {
      return NextResponse.json({ success: false, error: 'Plant not found' }, { status: 404 });
    }

    // Delete the plant
    const { error: deleteError } = await adminSupabase.from('user_plants').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting plant:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove plant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plant removed',
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/plants/[id]:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
