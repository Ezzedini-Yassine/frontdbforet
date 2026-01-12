/**
 * Next.js Proxy for Route Protection
 * (Updated for Next.js 16 - requires named export "proxy")
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/signin', '/signup', '/']
const AUTH_ROUTES = ['/signin', '/signup']
const PROTECTED_ROUTES = ['/dashboard']

/**
 * Named export "proxy" is required in Next.js 16
 * (Previously this was called "middleware")
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const accessToken = request.cookies.get('accessToken')?.value
  const isAuthenticated = !!accessToken

  // Authenticated user trying to access signin/signup
  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Unauthenticated user trying to access protected routes
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}