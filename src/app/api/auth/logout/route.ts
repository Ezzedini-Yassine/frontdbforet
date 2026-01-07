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
 * Note: This endpoint should be called even if the user is not authenticated
 * to ensure cookies are cleared. However, calling backend logout requires auth.
 */
export async function POST(request: NextRequest) {
  try {
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
      } catch (backendError) {
        /**
         * Backend logout failed (maybe token already expired)
         * Log it but continue to clear local cookies anyway
         * User should still be logged out from frontend perspective
         */
        console.error('Backend logout failed:', backendError)
      }
    }

    /**
     * Clear auth cookies regardless of backend response
     * This ensures user is logged out on frontend even if backend fails
     */
    await clearAuthCookies()

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
    } catch (cookieError) {
      console.error('Failed to clear cookies:', cookieError)
    }

    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed, but local session cleared' },
      { status: 500 }
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