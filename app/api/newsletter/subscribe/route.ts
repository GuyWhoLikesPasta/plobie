/**
 * Newsletter Subscribe API
 *
 * POST /api/newsletter/subscribe - Toggle newsletter subscription (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const SubscribeBodySchema = z.object({
  email: z.string().optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ subscribed: boolean }>>> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'You must be logged in to subscribe to the newsletter',
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate body (email is optional)

    let body: { email?: string } = {};
    try {
      const rawBody = await request.json();
      body = rawBody ?? {};
    } catch {
      // Empty body is fine
    }

    const validation = SubscribeBodySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid request body',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ newsletter_subscribed: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('Newsletter subscribe error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to subscribe: ${updateError.message || updateError.code || 'Unknown error'}`,
            details: updateError,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { subscribed: true },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to subscribe to newsletter',
        },
      },
      { status: 500 }
    );
  }
}
