import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const BUCKET = 'unity-assets';

/**
 * List and upload Unity streaming asset bundles.
 * Admin only -- middleware enforces admin check for /api/admin/*.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage.from(BUCKET).list('', {
      limit: 100,
      sortBy: { column: 'updated_at', order: 'desc' },
    });

    if (error) {
      console.error('Error listing unity assets:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

    const files = (data ?? []).map(f => ({
      name: f.name,
      size: f.metadata?.size,
      updated_at: f.updated_at,
      url: `${baseUrl}/${f.name}`,
    }));

    return NextResponse.json({ success: true, files, bucket_base_url: baseUrl });
  } catch (error) {
    console.error('Error in GET /api/admin/unity-assets:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = (formData.get('path') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const filePath = path ? `${path}/${file.name}` : file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      console.error('Error uploading unity asset:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${data.path}`;

    return NextResponse.json({ success: true, path: data.path, url: publicUrl });
  } catch (error) {
    console.error('Error in POST /api/admin/unity-assets:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
