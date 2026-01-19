/**
 * Axios API Client with Automatic Token Refresh
 * 
 * ⚠️ IMPORTANT: This is for CLIENT-SIDE use only!
 * Do NOT use in Next.js API routes (server-side)
 * For server-side API calls, use plain axios
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// ✅ Add safety check
if (typeof window === 'undefined') {
  console.warn('⚠️ apiClient should only be used on the client-side!')
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Include cookies in requests (important for httpOnly cookies)
  withCredentials: true,
})

/**
 * Track if we're currently refreshing the token
 * This prevents multiple simultaneous refresh attempts
 * 
 * Scenario: 3 API calls fail with 401 at the same time
 * Without this flag: All 3 would try to refresh → 3 refresh requests
 * With this flag: First starts refresh, others wait for it to complete
 */
let isRefreshing = false

/**
 * Queue of failed requests waiting for token refresh
 * When a request fails with 401, we store its resolve/reject callbacks here
 * After token refresh completes, we process this queue
 */
let failedRequestsQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

/**
 * Process all queued requests after successful token refresh
 * @param error - If provided, reject all queued requests with this error
 */
const processQueue = (error: Error | null = null) => {
  failedRequestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve()
    }
  })

  failedRequestsQueue = []
}

/**
 * REQUEST INTERCEPTOR
 * 
 * Runs before every request is sent.
 * Here we attach the access token from cookies to the Authorization header.
 * 
 * Note: We're reading from cookies set by our API routes (httpOnly cookies).
 * In the browser, document.cookie only shows non-httpOnly cookies.
 * But when we make requests with withCredentials: true, the browser
 * automatically includes ALL cookies (including httpOnly ones) in the request.
 * 
 * Our backend API routes will handle setting these httpOnly cookies.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // The browser automatically includes cookies with withCredentials: true
    // No need to manually add Authorization header here since our backend
    // might be reading from cookies OR we handle it in the response interceptor
    
    // If you want to explicitly add token from a cookie for non-httpOnly approach:
    // const token = getCookie('accessToken')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * RESPONSE INTERCEPTOR
 * 
 * Runs after every response is received (or if request fails).
 * Here we detect 401 errors and automatically refresh the token.
 * 
 * 🎓 DEEP DIVE: Token Refresh Strategy
 * ====================================
 * 
 * Problem: Access tokens expire (e.g., after 15 minutes)
 * Solution: Use refresh token to get a new access token
 * 
 * Flow when access token expires:
 * 1. Make API call → 401 Unauthorized
 * 2. Pause failed request
 * 3. Call /auth/refresh with refresh token
 * 4. Receive new access + refresh tokens
 * 5. Save new tokens
 * 6. Retry original failed request with new token
 * 
 * Edge cases handled:
 * - Multiple requests failing simultaneously (queue them)
 * - Refresh token also expired (logout user)
 * - Network errors during refresh (logout user)
 */
apiClient.interceptors.response.use(
  // Success response - just pass it through
  (response) => response,
  
  // Error response - check if it's a 401 and handle token refresh
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Check if error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (originalRequest.url?.includes('/auth/refresh')) {
        console.log('❌ Refresh token expired, logging out')
        isRefreshing = false
        processQueue(new Error('Session expired. Please login again.'))
        
        // Call our logout API to clear cookies
        try {
          await axios.post('/api/auth/logout', {}, { withCredentials: true })
        } catch (logoutError) {
          console.error('Logout failed:', logoutError)
        }
        
        // ✅ Add safety check for window
        if (typeof window !== 'undefined') {
          window.location.href = '/signin'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        console.log('🔄 Token refresh in progress, queueing request')
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject })
        })
          .then(() => {
            console.log('✅ Retrying request after refresh completed')
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // Mark that we're refreshing to prevent duplicate refresh requests
      originalRequest._retry = true
      isRefreshing = true

      console.log('🔄 Access token expired, refreshing...')

      try {
        await axios.post('/api/auth/refresh', {}, { 
          withCredentials: true 
        })

        console.log('✅ Token refresh successful')

        isRefreshing = false
        processQueue()

        console.log('🔁 Retrying original request')
        return apiClient(originalRequest)
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError)
        
        isRefreshing = false
        processQueue(refreshError as Error)
        
        try {
          await axios.post('/api/auth/logout', {}, { withCredentials: true })
        } catch (logoutError) {
          console.error('Logout failed:', logoutError)
        }
        
        // ✅ Add safety check for window
        if (typeof window !== 'undefined') {
          window.location.href = '/signin'
        }
        return Promise.reject(refreshError)
      }
    }

    // Not a 401 error or already retried - just pass through the error
    return Promise.reject(error)
  }
)

export default apiClient