import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next =
    requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the requested destination (or home)
      const redirectTo = next.startsWith('/') ? next : '/';
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
    }
  }

  // On error or missing code, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
}
