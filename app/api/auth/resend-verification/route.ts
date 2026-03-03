import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ErrorCodes } from '@/lib/types';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: ErrorCodes.UNAUTHORIZED, message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.VALIDATION_ERROR, message: 'Email already verified' },
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (error) {
      console.error('Resend verification error:', error);
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Failed to send verification email' },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { sent: true } });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: { code: ErrorCodes.INTERNAL_ERROR, message: 'Internal error' } },
      { status: 500 }
    );
  }
}
