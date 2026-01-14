import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/lobby', '/play', '/result'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token');

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/qr-login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/lobby/:path*', '/play/:path*', '/result/:path*'],
};
