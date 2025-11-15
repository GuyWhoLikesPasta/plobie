import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown' as 'ok' | 'error' | 'unknown',
    },
  };

  // Test Supabase connection
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('feature_flags').select('id').limit(1);
    checks.services.database = error ? 'error' : 'ok';
  } catch {
    checks.services.database = 'error';
  }

  const allOk = Object.values(checks.services).every(s => s === 'ok');
  checks.status = allOk ? 'ok' : 'degraded';

  return NextResponse.json(checks, { status: allOk ? 200 : 503 });
}

