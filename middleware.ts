import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Centralized middleware for auth validation and route protection.
 *
 * - Refreshes auth session on every request (keeps cookies in sync)
 * - Protects /admin routes (redirects non-admin to /)
 * - Protects authenticated API routes (returns 401)
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - this keeps the auth cookie in sync
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Admin page protection ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // --- Protected API routes (return 401 instead of redirect) ---
  const protectedApiPrefixes = [
    '/api/admin',
    '/api/user',
    '/api/my-plants',
    '/api/notifications',
    '/api/pots/claim',
    '/api/games',
    '/api/communities',
    '/api/gift-cards',
    '/api/checkout',
    '/api/upload',
    '/api/xp',
    '/api/achievements',
  ];

  const isProtectedApi = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtectedApi && !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // --- Admin API routes ---
  if (pathname.startsWith('/api/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (unity, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|unity/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|wasm|data|br|js\\.br|wasm\\.br|data\\.br)$).*)',
  ],
};
