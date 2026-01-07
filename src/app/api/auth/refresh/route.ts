/**
 * Token Refresh API Route Handler
 * 
 * This is called by the axios interceptor when access token expires (401).
 * 
 * 🎓 DEEP DIVE: Token Refresh Flow
 * =================================
 * 
 * Problem: Access tokens expire quickly (e.g., 15 min) for security
 * Solution: Use long-lived refresh token to get new access token
 * 
 * Full Flow:
 * 1. User makes API call → 401 (access token expired)
 * 2. Axios interceptor catches 401
 * 3. Interceptor calls THIS route (/api/auth/refresh)
 * 4. We read refresh token from cookies
 * 5. Call backend /auth/refresh with refresh token
 * 6. Backend validates refresh token, returns new tokens
 * 7. We set new tokens in cookies
 * 8. Return success to interceptor
 * 9. Interceptor retries original request with new token
 * 
 * Why separate route instead of calling backend directly?
 * - Need to read httpOnly cookie (can't from client JS)
 * - Need to set new httpOnly cookies
 * - Centralized error handling
 * 
 * Security considerations:
 * - Refresh tokens should be long-lived but not infinite
 * - Consider refresh token rotation (invalidate old on use)
 * - Rate limit this endpoint
 * - Log refresh attempts for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies, getCookie, clearAuthCookies } from '@/lib/cookies'
import type { AuthResponse } from '@/types/auth'

/**
 * POST /api/auth/refresh
 * 
 * Refreshes access token using refresh token from cookies
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * Read refresh token from httpOnly cookie
     * This is why we need this route - client JS can't read httpOnly cookies
     */
    const refreshToken = await getCookie('refreshToken')

    if (!refreshToken) {
      /**
       * No refresh token found - user needs to login again
       * Clear any remaining cookies to ensure clean state
       */
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'No refresh token found. Please login again.' },
        { status: 401 }
      )
    }

    /**
     * Call backend refresh endpoint
     * 
     * Your NestJS backend expects refresh token in request
     * Check your RtGuard implementation for exact format:
     * - Header? Authorization: Bearer {refreshToken}
     * - Body? { refreshToken: string }
     * - Cookie? (if backend reads cookies)
     * 
     * Based on typical implementations, sending in Authorization header:
     */
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await axios.post<AuthResponse>(
      `${backendUrl}/auth/refresh`,
      {}, // Empty body if token is in header
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    /**
     * Backend returned new tokens
     * Extract and set them in cookies
     */
    const { accessToken, refreshToken: newRefreshToken } = response.data

    /**
     * Update cookies with new tokens
     * This replaces old tokens with fresh ones
     */
    await setAuthCookies(accessToken, newRefreshToken)

    /**
     * Return success
     * Axios interceptor will retry original failed request
     */
    return NextResponse.json(
      { message: 'Token refreshed successfully' },
      { status: 200 }
    )

  } catch (error) {
    /**
     * Refresh failed - could be:
     * 1. Refresh token expired
     * 2. Refresh token invalid (tampered, revoked)
     * 3. Network error
     * 4. Backend error
     * 
     * In all cases, clear cookies and force re-login
     */
    
    // Clear cookies to ensure clean state
    await clearAuthCookies()

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message = error.response?.data?.message || 'Token refresh failed'
      
      console.error('Backend refresh error:', {
        status,
        message,
        data: error.response?.data
      })
      
      /**
       * Return 401 to trigger logout flow in axios interceptor
       * Interceptor will redirect to signin page
       */
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      )
    }

    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please login again.' },
      { status: 500 }
    )
  }
}

/**
 * 🎓 KEY LEARNINGS: Token Refresh Strategy
 * ========================================
 * 
 * 1. **Why two tokens?**
 *    - Access token: Short-lived, used for API calls
 *    - Refresh token: Long-lived, used to get new access tokens
 *    
 *    If we only had one long-lived token:
 *    - If stolen, attacker has access until token expires
 *    - Revoking token means forcing user to login
 *    
 *    With two tokens:
 *    - Access token stolen? Limited damage (expires soon)
 *    - Can revoke refresh token without forcing frequent logins
 * 
 * 2. **Token rotation**
 *    - Each refresh returns NEW refresh token
 *    - Old refresh token becomes invalid
 *    - Prevents replay attacks
 *    - If old token used, flag as suspicious
 * 
 * 3. **Refresh token storage**
 *    - httpOnly cookie (what we use): Most secure for web
 *    - Database: Server-side validation possible
 *    - Encrypted localStorage: Less secure but works for pure client apps
 * 
 * 4. **When to refresh?**
 *    
 *    Reactive (what we implement):
 *    - Wait for 401 error
 *    - Then refresh token
 *    - Pros: Simple, only refresh when needed
 *    - Cons: One failed request per expiration
 *    
 *    Proactive:
 *    - Check token expiration before each request
 *    - Refresh if about to expire (e.g., < 5 min left)
 *    - Pros: No failed requests
 *    - Cons: Need to decode JWT client-side (exposes claims)
 *    
 *    Background:
 *    - Set interval to refresh every X minutes
 *    - Pros: Always fresh token
 *    - Cons: Unnecessary refreshes if user inactive
 * 
 * 5. **Handling multiple tabs**
 *    - With cookies, all tabs share same tokens
 *    - If one tab refreshes, all tabs benefit
 *    - With localStorage, need BroadcastChannel API
 * 
 * 6. **Security best practices**
 *    - Always validate refresh token server-side
 *    - Store refresh token hash in DB (not plain text)
 *    - Rate limit refresh endpoint (prevent abuse)
 *    - Log refresh attempts (detect suspicious patterns)
 *    - Implement refresh token families (detect stolen tokens)
 * 
 * 7. **Error scenarios**
 *    - 401 from refresh: Session truly expired, logout
 *    - 500 from refresh: Server error, maybe retry once?
 *    - Network error: User offline, show appropriate message
 *    - Invalid token: Possible tampering, force logout
 * 
 * 8. **Alternative: Sliding sessions**
 *    - Single token, but expiration extends on each use
 *    - Simpler than refresh tokens
 *    - Common in traditional session-based auth
 *    - JWTs don't support this well (immutable)
 */