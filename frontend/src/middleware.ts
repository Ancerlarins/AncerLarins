import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Public listing pages — allow CDN/proxy caching
  if (pathname === '/' || pathname === '/properties' || pathname.startsWith('/properties/rent') || pathname.startsWith('/properties/sale')) {
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  }

  // Relatively static pages — longer cache
  if (pathname.startsWith('/about') || pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/pricing')) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  // Authenticated pages — never cache
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/agent')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|sw.js|manifest.json).*)',
  ],
};
