import { createServerSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// =====================================
// GAME PROGRESS API
// =====================================
// Save and load Unity game state

// Request schema
const SaveProgressSchema = z.object({
  game_state: z.record(z.string(), z.any()), // Any valid JSON structure
  version: z.number().int().positive().optional().default(1),
});

// Max game state size (1 MB)
const MAX_STATE_SIZE = 1024 * 1024; // 1 MB in bytes

// =====================================
// GET - Load Game State
// =====================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's game progress
    const { data: progress, error } = await supabase
      .from('game_progress')
      .select('game_state, version, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // No saved game found (PGRST116 = no rows)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          game_state: null,
          version: null,
          updated_at: null,
          message: 'No saved game found',
        });
      }

      console.error('Error fetching game progress:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to load game progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      game_state: progress.game_state,
      version: progress.version,
      updated_at: progress.updated_at,
    });
  } catch (error) {
    console.error('Error in GET /api/games/progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================
// POST - Save Game State
// =====================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = SaveProgressSchema.safeParse(body);

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

    const { game_state, version } = validation.data;

    // Check game state size
    const stateSize = JSON.stringify(game_state).length;
    if (stateSize > MAX_STATE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Game state too large',
          details: {
            size: stateSize,
            max_size: MAX_STATE_SIZE,
            message: `Game state must be less than ${MAX_STATE_SIZE / 1024 / 1024}MB`,
          },
        },
        { status: 400 }
      );
    }

    // Check if user has existing progress
    const { data: existing } = await supabase
      .from('game_progress')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existing) {
      // Update existing progress
      const { data, error } = await supabase
        .from('game_progress')
        .update({
          game_state,
          version,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select('updated_at')
        .single();

      if (error) {
        console.error('Error updating game progress:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save game progress' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new progress
      const { data, error } = await supabase
        .from('game_progress')
        .insert({
          user_id: user.id,
          game_state,
          version,
        })
        .select('updated_at')
        .single();

      if (error) {
        console.error('Error creating game progress:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save game progress' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      saved_at: result.updated_at,
      size: stateSize,
      message: 'Game progress saved successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/games/progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================
// DELETE - Clear Game State (optional)
// =====================================
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete user's game progress
    const { error } = await supabase
      .from('game_progress')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting game progress:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete game progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Game progress deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/games/progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

