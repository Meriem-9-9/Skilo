import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessible without a token
const PUBLIC_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('token')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // 1. Not logged in
  if (!token) {
    // Allow login/register pages
    if (isPublicRoute) return NextResponse.next();
    // Redirect everything else to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Logged in, trying to go to login or register → send to onboarding
  //    (onboarding will redirect to dashboard if already completed)
  if (isPublicRoute) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // 3. Everything else — let it through.
  //    The page-level components (ProtectedRoute, OnboardingGuard) handle
  //    the isOnboarded check since middleware can't read localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};