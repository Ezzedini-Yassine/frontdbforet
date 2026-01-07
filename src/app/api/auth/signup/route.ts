/**
 * Signup API Route Handler
 * 
 * 🎓 DEEP DIVE: API Route Handlers in App Router
 * ===============================================
 * 
 * Route Handlers are the App Router equivalent of API routes from Pages Router.
 * 
 * Old way (Pages Router):
 * pages/api/auth/signup.ts → export default function handler(req, res) {}
 * 
 * New way (App Router):
 * app/api/auth/signup/route.ts → export async function POST(request) {}
 * 
 * Key Differences:
 * 
 * 1. **Export named functions for HTTP methods**
 *    - GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
 *    - Each method is a separate export
 * 
 * 2. **Web Standard Request/Response**
 *    - Uses standard Request/Response objects
 *    - More aligned with modern web APIs
 *    - Easier to port code to other frameworks
 * 
 * 3. **Async by default**
 *    - All handlers are async functions
 *    - Use await for async operations
 * 
 * 4. **Edge Runtime support**
 *    - Can opt into Edge Runtime: export const runtime = 'edge'
 *    - Default is Node.js runtime
 * 
 * Why proxy through our own API route instead of calling backend directly?
 * 
 * 1. **httpOnly cookies**: Client JS can't set them, server can
 * 2. **Security**: Hide backend URL from client
 * 3. **Flexibility**: Add rate limiting, logging, validation
 * 4. **CORS**: Simplify CORS since requests go to same origin
 * 5. **Error handling**: Normalize errors for frontend
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies } from '@/lib/cookies'
import type { SignUpData, AuthResponse } from '@/types/auth'

/**
 * POST /api/auth/signup
 * 
 * Handles user signup by:
 * 1. Receiving signup data from client
 * 2. Forwarding to NestJS backend
 * 3. Setting httpOnly cookies with tokens
 * 4. Returning success response
 * 
 * @param request - Next.js Request object
 * @returns JSON response with success/error
 */
export async function POST(request: NextRequest) {
  try {
    /**
     * Parse request body
     * 
     * Note: request.json() is async and can only be called once
     * If you need the body multiple times, save it to a variable
     */
    const body: SignUpData = await request.json()
    
    /**
     * Validate request body
     * In production, use a validation library like Zod here
     */
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    /**
     * Call NestJS backend signup endpoint
     * 
     * Using axios here (not our apiClient) because:
     * 1. This is server-side, no need for token refresh interceptors
     * 2. We're making a first-time signup, no existing auth
     * 3. Simpler to use plain axios
     */
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await axios.post<AuthResponse>(
      `${backendUrl}/auth/signup`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    /**
     * Extract tokens from backend response
     * Your NestJS backend returns: { accessToken: string, refreshToken: string }
     */
    const { accessToken, refreshToken } = response.data

    /**
     * Set httpOnly cookies with the tokens
     * This is the KEY security step that can't be done client-side
     * 
     * Cookies will be automatically included in subsequent requests
     */
    await setAuthCookies(accessToken, refreshToken)

    /**
     * Return success response
     * 
     * We DON'T send tokens in response body because:
     * 1. They're already in httpOnly cookies
     * 2. Sending in body would expose them to JavaScript (less secure)
     * 3. Client doesn't need them (browser handles cookies automatically)
     */
    return NextResponse.json(
      { 
        message: 'Signup successful',
        user: { email: body.email }
      },
      { status: 201 }
    )

  } catch (error) {
    /**
     * Error handling
     * 
     * Different error types require different responses:
     * 1. Axios errors (from backend)
     * 2. Validation errors (from our code)
     * 3. Network errors (connection failed)
     * 4. Unexpected errors (bugs)
     */
    
    if (axios.isAxiosError(error)) {
      // Backend returned an error response
      const status = error.response?.status || 500
      const message = error.response?.data?.message || 'Signup failed'
      
      console.error('Backend signup error:', {
        status,
        message,
        data: error.response?.data
      })
      
      return NextResponse.json(
        { error: message },
        { status }
      )
    }

    // Unexpected error
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * 🎓 KEY LEARNINGS: API Route Handlers
 * ====================================
 * 
 * 1. **File-based routing for APIs**
 *    - app/api/auth/signup/route.ts → POST /api/auth/signup
 *    - URL structure mirrors file structure
 *    - Each route.ts exports HTTP method functions
 * 
 * 2. **HTTP method exports**
 *    - export async function GET(request) { }
 *    - export async function POST(request) { }
 *    - Only export the methods you support
 *    - Unsupported methods return 405 Method Not Allowed
 * 
 * 3. **Request object (Web Standard)**
 *    - request.json() - Parse JSON body
 *    - request.formData() - Parse form data
 *    - request.nextUrl - Next.js specific URL info
 *    - request.cookies - Cookie management
 *    - request.headers - Access headers
 * 
 * 4. **Response object (NextResponse)**
 *    - NextResponse.json(data, { status }) - JSON response
 *    - NextResponse.redirect(url) - Redirect
 *    - NextResponse.rewrite(url) - Rewrite URL
 *    - new Response(body, { headers }) - Standard web Response
 * 
 * 5. **Cookie management in API routes**
 *    - Read: request.cookies.get('name')
 *    - Set: Use our setCookie() utility (simpler)
 *    - Or: response.cookies.set('name', 'value', options)
 *    - httpOnly cookies MUST be set server-side
 * 
 * 6. **Error handling best practices**
 *    - Always wrap in try-catch
 *    - Log errors with context (which API, what data)
 *    - Don't expose sensitive info in error messages
 *    - Return appropriate HTTP status codes
 *    - Normalize errors for frontend (consistent shape)
 * 
 * 7. **Status codes guide**
 *    - 200: OK (general success)
 *    - 201: Created (successful creation)
 *    - 400: Bad Request (validation error)
 *    - 401: Unauthorized (auth required)
 *    - 403: Forbidden (authenticated but not allowed)
 *    - 404: Not Found
 *    - 409: Conflict (e.g., email already exists)
 *    - 500: Internal Server Error (unexpected error)
 * 
 * 8. **Security considerations**
 *    - Validate ALL inputs
 *    - Never trust client data
 *    - Sanitize error messages (don't leak stack traces)
 *    - Rate limit sensitive endpoints
 *    - Use HTTPS in production
 * 
 * 9. **Why not call backend directly from client?**
 *    - Can't set httpOnly cookies
 *    - Exposes backend URL (security through obscurity)
 *    - CORS complexity (need to configure backend)
 *    - Harder to add middleware (rate limiting, logging)
 *    - Less control over error responses
 * 
 * 10. **Performance tip**
 *     - API routes run on server, not edge
 *     - Keep them fast (they're in critical path)
 *     - Use streaming for large responses
 *     - Consider caching where appropriate
 */