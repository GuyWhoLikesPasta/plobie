import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const allowed = [
    process.env.NEXT_PUBLIC_BASE_URL,
    'https://plobie.vercel.app',
    'https://plobie-test-desktop.web.app',
  ].filter(Boolean);

  if (origin && allowed.includes(origin)) return origin;
  if (origin?.endsWith('.vercel.app') || origin?.endsWith('.web.app')) return origin;
  return '';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- CORS preflight: let OPTIONS through immediately for API routes ---
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const corsOrigin = getCorsOrigin(request);
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(corsOrigin ? { 'Access-Control-Allow-Origin': corsOrigin } : {}),
        ...CORS_HEADERS,
      },
    });
  }

  let response = NextResponse.next({ request });

  // --- Build Supabase client from cookies ---
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

  // --- Resolve user: try Bearer token first, then cookies ---
  let user = null;
  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  // --- Admin page protection ---
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

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

  // --- Attach CORS headers to API responses ---
  if (pathname.startsWith('/api/')) {
    const corsOrigin = getCorsOrigin(request);
    if (corsOrigin) {
      response.headers.set('Access-Control-Allow-Origin', corsOrigin);
      Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
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
