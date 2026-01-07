/**
 * Axios API Client with Automatic Token Refresh
 * 
 * This file sets up an Axios instance with interceptors that:
 * 1. Automatically attach access tokens to requests
 * 2. Detect 401 errors (expired access token)
 * 3. Refresh tokens automatically
 * 4. Retry the original failed request
 * 
 * 🎓 DEEP DIVE: Axios Interceptors
 * ================================
 * Interceptors are middleware for HTTP requests/responses.
 * They run BEFORE a request is sent or AFTER a response arrives.
 * 
 * Request Interceptor Flow:
 * Your code → request interceptor → network → server
 * 
 * Response Interceptor Flow:
 * Server → network → response interceptor → your code
 * 
 * This allows us to centralize:
 * - Adding auth headers
 * - Handling token expiration
 * - Error logging
 * - Request/response transformation
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { AuthResponse } from '@/types/auth'

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
      // Special case: if the failed request was to /auth/refresh itself,
      // it means our refresh token is invalid/expired
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh token is invalid - logout user
        isRefreshing = false
        processQueue(new Error('Session expired. Please login again.'))
        
        // Call our logout API to clear cookies
        try {
          await axios.post('/api/auth/logout')
        } catch (logoutError) {
          console.error('Logout failed:', logoutError)
        }
        
        // Redirect to signin page
        window.location.href = '/signin'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        /**
         * Token refresh is already in progress
         * Queue this request and wait for refresh to complete
         * 
         * This is a Promise that resolves when refresh completes successfully
         * or rejects if refresh fails
         */
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject })
        })
          .then(() => {
            // Refresh completed successfully, retry original request
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // Mark that we're refreshing to prevent duplicate refresh requests
      originalRequest._retry = true
      isRefreshing = true

      try {
        /**
         * Call our Next.js API route to refresh tokens
         * 
         * Why use our own API route instead of calling backend directly?
         * 1. Our API route can set httpOnly cookies (client JS can't)
         * 2. It keeps backend URL hidden from client
         * 3. We can add additional logic (logging, rate limiting, etc.)
         */
        await axios.post('/api/auth/refresh', {}, { withCredentials: true })

        // Refresh successful! Process queued requests
        isRefreshing = false
        processQueue()

        // Retry the original request with new token
        // (new token is now in cookies, will be sent automatically)
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear queue and logout
        isRefreshing = false
        processQueue(refreshError as Error)
        
        try {
          await axios.post('/api/auth/logout')
        } catch (logoutError) {
          console.error('Logout failed:', logoutError)
        }
        
        window.location.href = '/signin'
        return Promise.reject(refreshError)
      }
    }

    // Not a 401 error or already retried - just pass through the error
    return Promise.reject(error)
  }
)

export default apiClient

/**
 * 🎓 KEY LEARNINGS: Axios Interceptors
 * ====================================
 * 
 * 1. **Interceptors are middleware**: They sit between your code and the network
 * 
 * 2. **Request interceptors run first**: Modify requests before sending
 *    - Add auth headers
 *    - Transform request data
 *    - Log requests
 * 
 * 3. **Response interceptors run on every response**: Success OR error
 *    - Transform response data
 *    - Handle global errors
 *    - Refresh tokens
 * 
 * 4. **Promise chains**: Interceptors return Promises
 *    - Return promise to continue chain
 *    - Throw/reject to propagate error
 * 
 * 5. **Retry logic**: Save original request config to retry later
 *    - Add _retry flag to prevent infinite loops
 *    - Use queues for concurrent failures
 * 
 * 6. **Alternative: Native fetch()**
 *    - Pros: No external dependency, standard web API
 *    - Cons: No interceptors, manual retry logic, more boilerplate
 *    - You'd need to wrap every fetch() call or create a custom wrapper
 * 
 * 7. **Why withCredentials: true?**
 *    - Tells browser to include cookies in cross-origin requests
 *    - Required for httpOnly cookies to be sent automatically
 *    - Backend must set CORS header: Access-Control-Allow-Credentials: true
 */