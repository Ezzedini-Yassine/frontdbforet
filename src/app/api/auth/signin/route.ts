/**
 * Signin API Route Handler
 * 
 * Similar to signup, but for existing users.
 * Authenticates user and sets auth cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies } from '@/lib/cookies'
import type { SignInData, AuthResponse } from '@/types/auth'

/**
 * POST /api/auth/signin
 * 
 * @param request - Contains email and password
 * @returns JSON response with user data or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body: SignInData = await request.json()
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call NestJS backend signin endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await axios.post<AuthResponse>(
      `${backendUrl}/auth/signin`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    // Extract tokens from backend response
    const { accessToken, refreshToken } = response.data

    // Set httpOnly cookies with tokens
    await setAuthCookies(accessToken, refreshToken)

    // Return success (tokens are in cookies, not body)
    return NextResponse.json(
      { 
        message: 'Signin successful',
        user: { email: body.email }
      },
      { status: 200 }
    )

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message = error.response?.data?.message || 'Signin failed'
      
      console.error('Backend signin error:', {
        status,
        message,
        data: error.response?.data
      })
      
      return NextResponse.json(
        { error: message },
        { status }
      )
    }

    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}