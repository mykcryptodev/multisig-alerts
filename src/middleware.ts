import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user has auth token
  const authToken = request.cookies.get('auth-token');
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/api/multisigs', '/api/notifications'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !authToken) {
    // Redirect to home page if no auth token
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/multisigs/:path*',
    '/api/notifications/:path*',
  ],
};
