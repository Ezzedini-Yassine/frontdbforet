/**
 * Signin API Route Handler
 * 
 * Similar to signup, but for existing users.
 * Authenticates user and sets auth cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { setAuthCookies } from '@/lib/cookies'
import type { SignInData } from '@/types/auth'

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
    const response = await axios.post(
      `${backendUrl}/auth/signin`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    console.log('📥 Backend response status:', response.status)
    
    // ✅ LOG THE ENTIRE RESPONSE
    console.log('📥 FULL Backend response.data:', JSON.stringify(response.data, null, 2))
    console.log('📥 Type of response.data:', typeof response.data)
    console.log('📥 Keys in response.data:', Object.keys(response.data || {}))

    // Try different possible property names
    const data = response.data
    const accessToken = data.access_token 
    const refreshToken = data.refresh_token
    console.log('📥 Extracted tokens:', {
      accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'MISSING',
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    })

    if (!accessToken || !refreshToken) {
      console.error('❌ Backend did not return tokens!')
      console.error('❌ Available properties:', Object.keys(data || {}))
      return NextResponse.json(
        { error: 'Authentication failed - no tokens received from backend' },
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