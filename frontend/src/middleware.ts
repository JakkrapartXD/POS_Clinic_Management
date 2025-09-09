import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if the request is for different types of routes
  const isHomePage = pathname === '/'
  const isProtectedRoute = pathname.startsWith('/dashboard')
  const isLoginPage = pathname === '/login'
  
  // Get cookies
  const cookies = request.cookies
  const hasAuthCookie = cookies.has('next-auth.jwt-token') || cookies.has('next-auth.session-token')
  
  // Handle home page - redirect based on auth status
  if (isHomePage) {
    if (hasAuthCookie) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    } else {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // If accessing login page with auth, redirect to dashboard
  if (isLoginPage && hasAuthCookie) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
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
}
