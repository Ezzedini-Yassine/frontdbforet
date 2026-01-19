import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { clearAuthCookies, getCookie } from '@/lib/cookies'

/**
 * POST /api/auth/logout
 * 
 * Server-side logout handler
 * This runs on the Next.js server, NOT in the browser
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout requested')

    /**
     * Get access token from cookies
     * We need to send this to backend for logout
     */
    const accessToken = await getCookie('accessToken')
    const refreshToken = await getCookie('refreshToken')

    /**
     * Call backend logout if we have an access token
     * 
     * Strategy: Try with current token first
     * If it fails with 401 (expired), try refreshing then logout again
     */
    if (accessToken || refreshToken) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
        
        // Try logout with current access token
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
        
      } catch (backendError: any) {
        /**
         * Backend logout failed
         * Most common reason: Access token expired (401)
         */
        if (axios.isAxiosError(backendError) && backendError.response?.status === 401) {
          console.log('⚠️ Access token expired, attempting refresh then logout')
          
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            // Try to refresh token
            const refreshResponse = await axios.post(
              `${backendUrl}/auth/refresh`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${refreshToken}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            
            console.log('✅ Token refreshed, retrying logout')
            
            // Extract new access token
            const newAccessToken = refreshResponse.data.access_token || refreshResponse.data.accessToken
            
            // Update cookies with new tokens
            const newRefreshToken = refreshResponse.data.refresh_token || refreshResponse.data.refreshToken
            if (newAccessToken && newRefreshToken) {
              // We'll clear these anyway, but update them for the retry
              await setCookie('accessToken', newAccessToken, { maxAge: 15 * 60 })
              await setCookie('refreshToken', newRefreshToken, { maxAge: 7 * 24 * 60 * 60 })
            }
            
            // Retry logout with fresh token
            await axios.post(
              `${backendUrl}/auth/logout`,
              {},
              {
                headers: {
                  'Authorization': `Bearer ${newAccessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            
            console.log('✅ Backend logout successful after refresh')
            
          } catch (refreshError) {
            // Refresh or retry failed - just proceed with local logout
            console.warn('⚠️ Could not refresh and logout, proceeding with local logout only')
          }
        } else {
          // Other backend error (not 401)
          console.warn('⚠️ Backend logout failed:', backendError.message)
        }
      }
    } else {
      console.log('ℹ️ No tokens found, clearing cookies only')
    }

    /**
     * Always clear auth cookies at the end
     * This ensures user is logged out locally
     */
    await clearAuthCookies()
    
    console.log('✅ Logout complete, cookies cleared')

    return NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Logout error:', error)
    
    // Still try to clear cookies
    try {
      await clearAuthCookies()
      console.log('✅ Cookies cleared despite error')
    } catch (cookieError) {
      console.error('❌ Failed to clear cookies:', cookieError)
    }

    return NextResponse.json(
      { message: 'Logout completed locally' },
      { status: 200 }
    )
  }
}

// Helper function (add this at the top with other imports)
async function setCookie(name: string, value: string, options: any) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...options
  })
}