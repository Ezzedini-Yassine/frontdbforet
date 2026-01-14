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

    console.log('🔄 Token refresh requested')
    console.log('🔍 Refresh token present:', !!refreshToken)

    if (!refreshToken) {
      console.error('❌ No refresh token found in cookies')
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'No refresh token found. Please login again.' },
        { status: 401 }
      )
    }

    console.log('📤 Calling backend refresh endpoint')

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await axios.post(
      `${backendUrl}/auth/refresh`,
      {}, // Empty body - token is in Authorization header
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('📥 Backend refresh response status:', response.status)
    
    // ✅ LOG THE ENTIRE RESPONSE (same pattern as signin/signup)
    console.log('📥 FULL Backend response.data:', JSON.stringify(response.data, null, 2))
    console.log('📥 Type of response.data:', typeof response.data)
    console.log('📥 Keys in response.data:', Object.keys(response.data || {}))

    // ✅ Try different possible property names (backend uses snake_case)
    const data = response.data
    const accessToken = data.access_token || data.accessToken || data.Access_token
    const newRefreshToken = data.refresh_token || data.refreshToken || data.Refresh_token

    console.log('📥 Extracted tokens:', {
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING',
      newRefreshToken: newRefreshToken ? `${newRefreshToken.substring(0, 20)}...` : 'MISSING',
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: newRefreshToken?.length || 0
    })

    // ✅ Validate tokens exist
    if (!accessToken || !newRefreshToken) {
      console.error('❌ Backend did not return new tokens!')
      console.error('❌ Available properties:', Object.keys(data || {}))
      await clearAuthCookies()
      return NextResponse.json(
        { error: 'Token refresh failed - no tokens received from backend' },
        { status: 500 }
      )
    }

    // Update cookies with new tokens
    await setAuthCookies(accessToken, newRefreshToken)

    console.log('✅ Token refresh successful, new cookies set')

    return NextResponse.json(
      { message: 'Token refreshed successfully' },
      { status: 200 }
    )

  } catch (error) {
    // Clear cookies on any error
    await clearAuthCookies()

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message = error.response?.data?.message || 'Token refresh failed'
      
      console.error('❌ Backend refresh error:', {
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

    console.error('❌ Token refresh error:', error)
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