// src/Proxy.ts
//
// Proxy Next.js — protection des routes côté Edge.
//
// Stratégie :
//   • Le Proxy ne peut PAS vérifier l'access token (mémoire JS uniquement).
//   • Il vérifie uniquement la présence du cookie refresh_token.
//   • Si absent → redirect /login (route publique).
//   • Si présent → laisse passer ; l'AuthProvider revalide au montage.
//
// Routes publiques : /login, /register, /auth/* (refresh, logout…)
// Routes protégées : tout le reste

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Chemins toujours publics (regex pour matcher les prefixes)
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/auth', // /auth/refresh, /auth/logout, etc.
  '/_next', // assets Next.js
  '/favicon.ico',
  '/api', // routes API Next.js internes si besoin
  '/'
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export default function Proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisse passer les routes publiques sans vérification
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Vérifie la présence du cookie refresh_token
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (!hasRefreshToken) {
    // Redirige vers /login en conservant la destination pour un redirect post-login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie présent → accès autorisé (l'AuthProvider validera le token côté client)
  return NextResponse.next();
}

// Applique le Proxy à toutes les routes sauf les fichiers statiques
export const config = {
  matcher: [
    /*
     * Exclut :
     *   - _next/static (fichiers statiques)
     *   - _next/image (optimisation images)
     *   - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};