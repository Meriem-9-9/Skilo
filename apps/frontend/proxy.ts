import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SKILO — CORE REDIRECTION ENGINE (Next.js 16 Proxy Convention)
 * 
 * Logic flow:
 * 1. Is the route public? (/login, /register, /) -> Allow or Redirect to Dashboard if logged in.
 * 2. Is the route protected? (/dashboard, /matches, /sessions, /profile, /onboarding, etc.)
 *    a. No token? -> Redirect to /login.
 *    b. Has token but not onboarded? -> Force /onboarding (unless already there).
 *    c. Has token and onboarded? -> If on /onboarding, redirect to /dashboard.
 */

const PUBLIC_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const onboarded = request.cookies.get('onboarded')?.value === 'true';
  const { pathname } = request.nextUrl;

  // 0. STATIC ASSETS & API
  // Handled by matcher, but safe to ignore here too
  if (pathname.includes('.') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 1. PUBLIC ROUTES (Login, Register)
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (token) {
      // Already logged in -> send to internal entry point
      return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 2. ROOT / HANDLER
  if (pathname === '/') {
    if (token) {
       return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', request.url));
    }
    return NextResponse.next();
  }

  // 3. PROTECTED ROUTES
  // We explicitly protect dashboard and its peers
  const protectedPrefixes = ['/dashboard', '/onboarding', '/matches', '/sessions', '/profile', '/credits', '/users'];
  const isProtectedRoute = protectedPrefixes.some(pref => pathname.startsWith(pref));

  if (isProtectedRoute) {
    if (!token) {
      // Not logged in -> force login
      const loginUrl = new URL('/login', request.url);
      // Keep track of where they wanted to go
      if (pathname !== '/dashboard') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // AUTHENTICATED BUT WHERE TO GO?
    if (pathname.startsWith('/onboarding')) {
      if (onboarded) {
        // Already finished onboarding -> dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }

    // Not on onboarding yet, but required
    if (!onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
