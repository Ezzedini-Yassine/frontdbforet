/**
 * Logout API Route Handler
 * 
 * Handles user logout by:
 * 1. Calling backend logout (invalidates refresh token server-side)
 * 2. Clearing auth cookies
 * 3. Returning success response
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { clearAuthCookies, getCookie } from '@/lib/cookies'

/**
 * POST /api/auth/logout
 * 
 * Handles user logout by:
 * 1. Calling backend logout (invalidates refresh token server-side)
 * 2. Clearing auth cookies
 * 3. Returning success response
 * 
 * Note: If access token is expired, we still clear cookies locally
 * and consider logout successful from frontend perspective
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout requested')

    /**
     * Get access token from cookies to send to backend
     * Backend's /auth/logout endpoint requires valid access token (AtGuard)
     */
    const accessToken = await getCookie('accessToken')

    /**
     * Call backend logout endpoint if we have a token
     * 
     * This invalidates the refresh token in the backend database.
     * Even if this fails, we still want to clear cookies locally.
     * 
     * Important: If access token is expired (30 seconds in your case),
     * backend will return 401. This is EXPECTED and OK.
     * We still logout the user from frontend.
     */
    if (accessToken) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        await axios.post(
          `${backendUrl}/auth/logout`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        console.log('✅ Backend logout successful')
      } catch (backendError) {
        /**
         * Backend logout failed (most common: token already expired)
         * This is NOT a critical error - we still logout locally
         * 
         * Common reasons:
         * - Access token expired (401)
         * - User already logged out
         * - Backend is down
         * 
         * In all cases, we proceed with local logout
         */
        if (axios.isAxiosError(backendError)) {
          const status = backendError.response?.status
          
          if (status === 401) {
            // Token expired - this is expected and fine
            console.log('ℹ️ Access token already expired, proceeding with local logout')
          } else {
            // Other backend error
            console.warn('⚠️ Backend logout failed:', {
              status,
              message: backendError.response?.data?.message
            })
          }
        } else {
          console.error('⚠️ Unexpected logout error:', backendError)
        }
        // Continue to clear cookies anyway
      }
    } else {
      console.log('ℹ️ No access token found, clearing cookies only')
    }

    /**
     * Clear auth cookies regardless of backend response
     * This ensures user is logged out on frontend even if backend fails
     * 
     * This is the CRITICAL part - always clear cookies
     */
    await clearAuthCookies()
    
    console.log('✅ Logout successful, cookies cleared')

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    )

  } catch (error) {
    /**
     * Even on error, try to clear cookies
     * Better to err on the side of logging user out
     */
    try {
      await clearAuthCookies()
      console.log('✅ Cookies cleared despite error')
    } catch (cookieError) {
      console.error('❌ Failed to clear cookies:', cookieError)
    }

    console.error('❌ Logout error:', error)
    return NextResponse.json(
      { message: 'Logout completed locally' }, // Still success from user perspective
      { status: 200 } // Return 200, not 500, because local logout succeeded
    )
  }
}

/**
 * 🎓 KEY LEARNING: Graceful Logout Handling
 * =========================================
 * 
 * Logout should ALWAYS succeed from user perspective.
 * Even if backend is down, clear cookies and let user "logout" locally.
 * 
 * Why?
 * - User expects logout button to work
 * - Even partial logout is better than being stuck
 * - Backend can clean up stale tokens later
 * 
 * Security consideration:
 * - If backend logout fails, refresh token may still be valid
 * - Implement token expiration on backend
 * - Consider refresh token rotation (new token on each use)
 * - Monitor for suspicious activity
 */