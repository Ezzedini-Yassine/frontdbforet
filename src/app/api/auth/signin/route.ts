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

    console.log('📤 Calling backend signin:', body.email)

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

    console.log('📥 Backend response status:', response.status)
    console.log('📥 Backend response data:', {
      hasAccessToken: !!response.data?.accessToken,
      hasRefreshToken: !!response.data?.refreshToken,
      accessTokenLength: response.data?.accessToken?.length || 0,
      refreshTokenLength: response.data?.refreshToken?.length || 0
    })

    const { accessToken, refreshToken } = response.data

    // ✅ Validate tokens exist
    if (!accessToken || !refreshToken) {
      console.error('❌ Backend did not return tokens!')
      return NextResponse.json(
        { error: 'Authentication failed - no tokens received' },
        { status: 500 }
      )
    }

    // ✅ Set cookies
    await setAuthCookies(accessToken, refreshToken)
    
    console.log('✅ Signin successful, cookies set')

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
      
      console.error('❌ Backend signin error:', {
        status,
        message,
        data: error.response?.data
      })
      
      return NextResponse.json(
        { error: message },
        { status }
      )
    }

    console.error('❌ Signin error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}