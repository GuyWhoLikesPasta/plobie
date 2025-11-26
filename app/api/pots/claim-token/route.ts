/**
 * POST /api/pots/claim-token
 * 
 * Generate a claim token for a pot code.
 * Rate limited: 5 requests per minute per IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { generateClaimToken } from '@/lib/claim-tokens';
import { RateLimits } from '@/lib/rate-limit';
import { ApiResponse, ErrorCodes } from '@/lib/types';

const RequestSchema = z.object({
  pot_code: z.string().min(1).max(20),
});

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ token: string; expires_in: number }>>> {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Rate limit check: 5 requests per minute per IP
    if (!RateLimits.claimToken(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.RATE_LIMITED,
            message: 'Too many claim token requests. Please try again in a minute.',
          },
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

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

    const { pot_code } = validation.data;

    // Check if pot exists
    const supabase = await createServerSupabaseClient();
    const { data: pot, error: potError } = await supabase
      .from('pots')
      .select('id, code')
      .eq('code', pot_code)
      .single();

    if (potError || !pot) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.NOT_FOUND,
            message: 'Pot not found. Please check the code and try again.',
          },
        },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = generateClaimToken(pot_code);

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          expires_in: 600, // 10 minutes in seconds
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Claim token generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to generate claim token',
        },
      },
      { status: 500 }
    );
  }
}

