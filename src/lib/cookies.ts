/**
 * Server-Side Cookie Utilities
 * 
 * These functions handle setting and reading cookies in API routes and middleware.
 * 
 * 🎓 DEEP DIVE: httpOnly Cookies for Security
 * ===========================================
 * 
 * Why use httpOnly cookies for tokens instead of localStorage?
 * 
 * localStorage:
 * ❌ Accessible by any JavaScript (vulnerable to XSS attacks)
 * ❌ If attacker injects script, they can steal tokens
 * ✅ Easy to implement
 * ✅ Works for client-side only apps
 * 
 * httpOnly Cookies:
 * ✅ NOT accessible by JavaScript (immune to XSS)
 * ✅ Browser automatically includes in requests
 * ✅ Can set Secure (HTTPS only) and SameSite (CSRF protection)
 * ❌ Slightly more complex to implement
 * ❌ Requires server-side cookie setting
 * 
 * Security Flags Explained:
 * 
 * - httpOnly: Cookie not accessible via document.cookie or JavaScript
 *   → Prevents XSS attacks from stealing tokens
 * 
 * - Secure: Cookie only sent over HTTPS
 *   → Prevents man-in-the-middle attacks
 *   → Set to false in development (http://localhost)
 * 
 * - SameSite=Strict: Cookie only sent to same-site requests
 *   → Prevents CSRF (Cross-Site Request Forgery) attacks
 *   → "Strict" = never sent in cross-site requests
 *   → "Lax" = sent on top-level navigation (e.g., clicking a link)
 *   → "None" = sent everywhere (requires Secure flag)
 * 
 * - Path=/: Cookie available to all routes
 * 
 * - Max-Age: Cookie lifetime in seconds
 *   → Access token: short (15 min = 900s)
 *   → Refresh token: long (7 days = 604800s)
 */

import { cookies } from 'next/headers'

/**
 * Cookie configuration interface
 */
interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number // in seconds
  path?: string
}

/**
 * Default cookie options for maximum security
 */
const defaultCookieOptions: CookieOptions = {
  httpOnly: true, // Not accessible via JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // Strictest CSRF protection
  path: '/', // Available to all routes
}

/**
 * Cookie name constants
 * Using environment variables allows easy configuration without code changes
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: process.env.COOKIE_ACCESS_TOKEN_NAME || 'accessToken',
  REFRESH_TOKEN: process.env.COOKIE_REFRESH_TOKEN_NAME || 'refreshToken',
}

/**
 * Set a cookie with secure defaults
 * 
 * This is used in API routes to set cookies after successful authentication
 * 
 * @param name - Cookie name
 * @param value - Cookie value (the token)
 * @param options - Optional overrides for cookie settings
 * 
 * Example usage:
 * setCookie('accessToken', 'eyJhbGc...', { maxAge: 900 }) // 15 min
 */
export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const cookieStore = await cookies()
  
  const cookieOptions = {
    ...defaultCookieOptions,
    ...options,
  }

  cookieStore.set(name, value, cookieOptions)
}

/**
 * Get a cookie value
 * 
 * Used in middleware to read tokens and verify authentication
 * 
 * @param name - Cookie name
 * @returns Cookie value or undefined if not found
 * 
 * Example usage:
 * const token = await getCookie('accessToken')
 * if (!token) {
 *   // User not authenticated
 * }
 */
export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(name)?.value
}

/**
 * Delete a cookie
 * 
 * Used during logout to clear authentication cookies
 * Setting maxAge to 0 tells browser to immediately delete the cookie
 * 
 * @param name - Cookie name
 * 
 * Example usage:
 * await deleteCookie('accessToken')
 * await deleteCookie('refreshToken')
 */
export async function deleteCookie(name: string) {
  const cookieStore = await cookies()
  cookieStore.set(name, '', {
    ...defaultCookieOptions,
    maxAge: 0, // Expire immediately
  })
}

/**
 * Set authentication cookies (access + refresh tokens)
 * 
 * Convenience function to set both tokens at once with appropriate lifetimes
 * 
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 * 
 * Token Lifetime Strategy:
 * - Access Token: Short-lived (15 minutes)
 *   → If compromised, attacker has limited time to use it
 *   → Forces frequent refresh checks
 * 
 * - Refresh Token: Long-lived (7 days)
 *   → User stays logged in without re-entering password
 *   → Can be invalidated server-side if needed
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  // Access token: 15 minutes (900 seconds)
  await setCookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    maxAge: 15 * 60, // 15 minutes
  })

  // Refresh token: 7 days (604800 seconds)
  await setCookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

/**
 * Clear all authentication cookies
 * 
 * Used during logout to ensure user is fully signed out
 */
export async function clearAuthCookies() {
  await deleteCookie(COOKIE_NAMES.ACCESS_TOKEN)
  await deleteCookie(COOKIE_NAMES.REFRESH_TOKEN)
}

/**
 * Check if user is authenticated by verifying access token exists
 * 
 * Note: This only checks if token EXISTS, not if it's VALID
 * Token validation happens on the backend
 * 
 * @returns true if access token cookie exists
 */
export async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getCookie(COOKIE_NAMES.ACCESS_TOKEN)
  return !!accessToken
}

/**
 * 🎓 KEY LEARNINGS: Cookie Security
 * =================================
 * 
 * 1. **httpOnly is your first line of defense against XSS**
 *    - Even if attacker injects malicious script, they can't access tokens
 *    - Always use httpOnly for sensitive data like auth tokens
 * 
 * 2. **Secure flag prevents token theft over HTTP**
 *    - In production, ALWAYS use Secure flag
 *    - In development (localhost), Secure must be false
 * 
 * 3. **SameSite protects against CSRF**
 *    - Strict: Maximum protection, might break some legitimate flows
 *    - Lax: Good balance, allows top-level navigation
 *    - None: No protection, only use if absolutely necessary (with Secure)
 * 
 * 4. **Token lifetime is a security/UX tradeoff**
 *    - Shorter access token = more secure but more refresh calls
 *    - Longer refresh token = better UX but longer revocation window
 *    - Industry standard: 15min access, 7-30 days refresh
 * 
 * 5. **Cookie size limits**
 *    - Cookies have a 4KB limit per cookie
 *    - JWTs can get large with lots of claims
 *    - If token > 4KB, consider storing in database with session ID in cookie
 * 
 * 6. **Alternative: Session-based auth**
 *    - Instead of JWTs in cookies, store session ID in httpOnly cookie
 *    - Pros: Can invalidate sessions instantly, smaller cookies
 *    - Cons: Requires database lookup on every request, server state
 *    - JWT approach (what we use): Stateless, scales better, but harder to revoke
 * 
 * 7. **Next.js cookies() API**
 *    - Only works in Server Components, API routes, and middleware
 *    - Async in Next.js 15+ (await cookies())
 *    - Returns a special cookie store object with get/set/delete methods
 */