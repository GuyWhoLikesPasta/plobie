import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// =====================================
// GAME SESSION API
// =====================================
// Track Unity game sessions and award XP

// Request schemas
const StartSessionSchema = z.object({
  action: z.literal('start'),
  metadata: z.record(z.string(), z.any()).optional(),
});

const EndSessionSchema = z.object({
  action: z.literal('end'),
  session_id: z.string().uuid(),
  duration_minutes: z.number().int().min(0).max(1440), // Max 24 hours
  metadata: z.record(z.string(), z.any()).optional(),
});

const SessionRequestSchema = z.union([StartSessionSchema, EndSessionSchema]);

// =====================================
// GET - Get Active Session
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

    // Get active session
    const { data: session, error } = await supabase
      .from('game_sessions')
      .select('id, user_id, started_at, status, metadata')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching active session:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: session || null,
    });
  } catch (error) {
    console.error('Error in GET /api/games/session:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================
// POST - Start or End Session
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
    const validation = SessionRequestSchema.safeParse(body);

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

    const data = validation.data;

    // ========================================
    // START SESSION
    // ========================================
    if (data.action === 'start') {
      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('game_sessions')
        .select('id, started_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (existingSession) {
        // Already have active session, return it
        return NextResponse.json({
          success: true,
          session: {
            id: existingSession.id,
            user_id: user.id,
            started_at: existingSession.started_at,
            status: 'active',
          },
          message: 'Existing active session returned',
        });
      }

      // Create new session
      const { data: newSession, error: insertError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: user.id,
          started_at: new Date().toISOString(),
          status: 'active',
          metadata: data.metadata || {},
        })
        .select('id, user_id, started_at, status')
        .single();

      if (insertError) {
        console.error('Error creating game session:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: newSession,
      });
    }

    // ========================================
    // END SESSION
    // ========================================
    if (data.action === 'end') {
      // Verify session exists and belongs to user
      const { data: session, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', data.session_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (fetchError || !session) {
        return NextResponse.json(
          { success: false, error: 'Session not found or already ended' },
          { status: 404 }
        );
      }

      // Calculate XP
      const durationMinutes = data.duration_minutes;
      const xpBlocks = Math.floor(durationMinutes / 30); // +2 XP per 30 min
      const baseXP = xpBlocks * 2;

      let xpAwarded = 0;
      let xpResult: any = null;

      // Award XP if session is long enough (minimum 30 minutes for 2 XP)
      if (baseXP > 0) {
        // Get user's profile
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Use apply_xp stored procedure
          const { data: xpData, error: xpError } = await adminSupabase.rpc('apply_xp', {
            p_profile_id: profile.id,
            p_action_type: 'game_session',
            p_xp_amount: baseXP, // Fixed: was p_base_amount
            p_description: `Game session (${durationMinutes} min, ${xpBlocks} blocks)`, // Fixed: was p_metadata_json
            p_reference_id: data.session_id,
          });

          if (xpError) {
            console.error('Error applying XP:', xpError);
            // Continue anyway, session should still close
          } else {
            const xpRaw = (xpData as unknown as any[])?.[0];
            if (xpRaw) {
              xpAwarded = xpRaw.xp_awarded || 0; // Fixed: was awarded_xp
              xpResult = {
                awarded: xpRaw.xp_awarded || 0, // Fixed: was awarded_xp
                capped: xpRaw.capped || false,
                new_total_xp: xpRaw.new_total_xp || 0,
                new_level: Math.floor((xpRaw.new_total_xp || 0) / 100) + 1, // Calculate level
                level_up: (xpRaw.level_after || 0) > (xpRaw.level_before || 0),
                remaining_today: 100 - (xpRaw.new_daily_xp || 0), // Calculate remaining
              };
            }
          }
        }
      }

      // Update session
      const { data: updatedSession, error: updateError } = await supabase
        .from('game_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
          xp_earned: xpAwarded,
          status: 'completed',
          metadata: {
            ...(session.metadata || {}),
            ...(data.metadata || {}),
            xp_blocks: xpBlocks,
          },
        })
        .eq('id', data.session_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating game session:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: updatedSession,
        xp_result: xpResult || {
          awarded: 0,
          capped: false,
          remaining_today: 0,
        },
      });
    }

    // Should never reach here due to schema validation
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/games/session:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
