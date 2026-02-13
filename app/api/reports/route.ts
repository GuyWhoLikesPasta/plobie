/**
 * Reports API
 *
 * POST /api/reports - Create a report (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiResponse, ErrorCodes, CreateReportSchema } from '@/lib/types';
import { trackEvent } from '@/lib/analytics';

const CreateReportBodySchema = CreateReportSchema.extend({
  description: z.string().max(1500).optional(),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ report_id: string }>>> {
  try {
    // Check authentication
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
            message: 'You must be logged in to submit a report',
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    // Support content_type/content_id as aliases for entity_type/entity_id
    const normalized = {
      ...body,
      entity_type: body.entity_type ?? body.content_type,
      entity_id: body.entity_id ?? body.content_id,
    };
    const validation = CreateReportBodySchema.safeParse(normalized);

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

    const { entity_type, entity_id, reason, description } = validation.data;

    // Combine reason with optional description (DB has single reason column)
    const reasonText = description ? `${reason}\n\n${description}` : reason;

    // Insert report (RLS policy reports_insert_own ensures reporter_id = auth.uid())
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        entity_type,
        entity_id,
        reason: reasonText,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Report creation error:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCodes.DATABASE_ERROR,
            message: `Failed to create report: ${insertError.message || insertError.code || 'Unknown error'}`,
            details: insertError,
          },
        },
        { status: 500 }
      );
    }

    // Track analytics (client-side gtag; no-op on server, but available if called from client)
    trackEvent('report_submitted', entity_type);

    return NextResponse.json(
      {
        success: true,
        data: {
          report_id: report.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Report creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to submit report',
        },
      },
      { status: 500 }
    );
  }
}
