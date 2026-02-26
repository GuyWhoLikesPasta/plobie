import { createSupabaseFromRequest } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const VALID_MODELS = ['knight_male', 'elf_female', 'rogue_female', 'mage_male'];

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('character_model_id')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      character_model_id: profile?.character_model_id || null,
      available_models: VALID_MODELS,
    });
  } catch (error) {
    console.error('Error in GET /api/user/character:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseFromRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { character_model_id } = body;

    if (!character_model_id || !VALID_MODELS.includes(character_model_id)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid model. Choose from: ${VALID_MODELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('profiles')
      .update({ character_model_id })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating character:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update character' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, character_model_id });
  } catch (error) {
    console.error('Error in PUT /api/user/character:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
