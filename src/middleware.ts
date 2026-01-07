/**
 * Next.js Middleware for Route Protection
 * 
 * 🎓 DEEP DIVE: What is Middleware?
 * ==================================
 * 
 * Middleware runs BEFORE a request is completed.
 * Think of it as a gatekeeper that inspects every request.
 * 
 * Execution Flow:
 * User navigates to /dashboard
 *   ↓
 * Middleware checks authentication
 *   ↓ (if not auth'd)
 * Redirect to /signin
 *   ↓ (if auth'd)
 * Continue to page
 *   ↓
 * Page renders
 * 
 * Why Middleware for Auth?
 * 1. **Runs at the Edge**: Before any React code loads
 * 2. **Fast**: No page load, instant redirect
 * 3. **Secure**: No flash of protected content
 * 4. **Server-side**: Can read httpOnly cookies
 * 5. **Single place**: All route protection logic in one file
 * 
 * Alternative Approaches:
 * 
 * 1. Client-side (useEffect in components):
 *    ❌ Flash of protected content
 *    ❌ Runs after page load (slower)
 *    ❌ Can be bypassed by disabling JS
 *    ✅ Easy to implement
 * 
 * 2. getServerSideProps (Pages Router):
 *    ✅ Server-side
 *    ✅ No flash of content
 *    ❌ Runs on every request (slower)
 *    ❌ Can't protect API routes
 *    ❌ Only for Pages Router
 * 
 * 3. Middleware (App Router) ← WE USE THIS:
 *    ✅ Runs at the edge (fastest)
 *    ✅ Protects all routes (pages + API)
 *    ✅ Can read/write cookies
 *    ✅ Consistent across app
 * 
 * Middleware Limitations:
 * - Runs in Edge Runtime (not Node.js)
 * - Can't use Node.js APIs (fs, crypto, etc.)
 * - Can't use all npm packages
 * - Keep it lightweight
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route path constants
 * Centralize paths for easy maintenance
 */
const PUBLIC_ROUTES = ['/signin', '/signup', '/']
const AUTH_ROUTES = ['/signin', '/signup'] // Redirect to dashboard if already auth'd
const PROTECTED_ROUTES = ['/dashboard'] // Redirect to signin if not auth'd

/**
 * Main middleware function
 * 
 * This runs on EVERY request that matches the matcher config below.
 * Be careful with performance here - this code runs often!
 * 
 * @param request - The incoming request object
 * @returns NextResponse - Either continue, redirect, or rewrite
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  /**
   * Check authentication status by looking for access token cookie
   * 
   * 🎓 Reading Cookies in Middleware:
   * Cookies are available via request.cookies
   * This works for ALL cookies, including httpOnly ones
   * (Unlike document.cookie in browser which only shows non-httpOnly)
   */
  const accessToken = request.cookies.get('accessToken')?.value
  const isAuthenticated = !!accessToken

  /**
   * Protection Logic:
   * 
   * 1. If user is authenticated and tries to access auth pages (signin/signup)
   *    → Redirect to dashboard (they're already logged in)
   * 
   * 2. If user is NOT authenticated and tries to access protected pages
   *    → Redirect to signin
   * 
   * 3. Otherwise, allow the request
   */

  // Case 1: Authenticated user trying to access signin/signup
  if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Case 2: Unauthenticated user trying to access protected routes
  if (!isAuthenticated && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const signinUrl = new URL('/signin', request.url)
    
    /**
     * Save the original URL they were trying to access
     * After login, we can redirect them back here
     * 
     * This is a better UX:
     * User clicks link to /dashboard/profile → redirected to /signin
     * After signin → redirected to /dashboard/profile (not just /dashboard)
     */
    signinUrl.searchParams.set('callbackUrl', pathname)
    
    return NextResponse.redirect(signinUrl)
  }

  // Case 3: All other requests - continue normally
  return NextResponse.next()
}

/**
 * Middleware Configuration
 * 
 * The matcher tells Next.js which routes to run middleware on.
 * By default, middleware runs on ALL routes (even /_next/static).
 * We use matcher to only run on actual pages.
 * 
 * 🎓 Matcher Patterns:
 * 
 * - '/dashboard/:path*' → /dashboard and all sub-paths
 * - '/api/:path*' → All API routes
 * - '/((?!_next/static|_next/image|favicon.ico).*)' → Negative lookahead
 *   → Match everything EXCEPT _next/static, _next/image, favicon.ico
 * 
 * Why exclude _next/static?
 * - Static assets (CSS, JS, images)
 * - No need to check auth for these
 * - Performance: middleware won't run on every asset request
 * 
 * Alternative: Explicitly list routes
 * matcher: ['/dashboard/:path*', '/signin', '/signup', '/']
 */
export const config = {
  matcher: [
    /**
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/**
 * 🎓 KEY LEARNINGS: Next.js Middleware
 * ====================================
 * 
 * 1. **Middleware runs at the Edge**
 *    - Deployed to edge locations worldwide
 *    - Ultra-fast response times
 *    - Closer to users geographically
 * 
 * 2. **Edge Runtime vs Node.js Runtime**
 *    - Edge: Subset of Node.js APIs, faster, globally distributed
 *    - Node: Full Node.js APIs, runs on server
 *    - Middleware MUST use Edge Runtime
 * 
 * 3. **What can you do in Middleware?**
 *    ✅ Read/write cookies
 *    ✅ Read/write headers
 *    ✅ Redirect requests
 *    ✅ Rewrite URLs (serve different content)
 *    ✅ Return custom responses
 *    ❌ Use Node.js APIs (fs, crypto, etc.)
 *    ❌ Access database directly
 *    ❌ Use some npm packages
 * 
 * 4. **NextResponse vs redirect()**
 *    - NextResponse.redirect(): For middleware/server components
 *    - redirect() from 'next/navigation': For server actions/components only
 *    - useRouter().push(): For client components
 * 
 * 5. **Matcher patterns**
 *    - Negative lookahead: (?!pattern) = match anything that doesn't start with pattern
 *    - Use to exclude static assets
 *    - Always exclude _next/* to avoid unnecessary middleware runs
 * 
 * 6. **Security considerations**
 *    - Don't trust client-side data
 *    - Token validation should happen on backend
 *    - Middleware only checks if token EXISTS
 *    - Backend verifies if token is VALID
 * 
 * 7. **Performance tips**
 *    - Keep middleware fast (runs on every request)
 *    - Avoid heavy computation
 *    - Use early returns
 *    - Exclude static assets with matcher
 * 
 * 8. **Debugging middleware**
 *    - console.log works but appears in server logs
 *    - Use request headers to pass debug info
 *    - Check Network tab in DevTools for redirects
 * 
 * 9. **Common gotchas**
 *    - Forgetting matcher = middleware runs on ALL routes (slow!)
 *    - Redirect loops (signin redirects to dashboard redirects to signin)
 *    - Cookie naming must match exactly
 *    - Make sure CORS allows credentials if calling external API
 * 
 * 10. **When NOT to use Middleware**
 *     - Complex business logic (use API routes)
 *     - Database queries (use API routes or server components)
 *     - Heavy computation (use API routes)
 *     - Middleware is for routing decisions, not business logic
 */