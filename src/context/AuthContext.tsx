/**
 * Authentication Context - Global Auth State Management
 * 
 * This context provides authentication state and methods throughout the app.
 * 
 * 🎓 DEEP DIVE: React Context API
 * ================================
 * 
 * Why Context? The Prop Drilling Problem:
 * 
 * WITHOUT Context:
 * <App user={user}>
 *   <Layout user={user}>
 *     <Navbar user={user}>
 *       <UserMenu user={user} /> ← Finally used here!
 *     </Navbar>
 *   </Layout>
 * </App>
 * 
 * Every component passes `user` down even if it doesn't use it.
 * This is "prop drilling" and becomes unmaintainable.
 * 
 * WITH Context:
 * <AuthProvider> ← Set value here
 *   <App>
 *     <Layout>
 *       <Navbar>
 *         <UserMenu /> ← Access directly with useAuth()!
 *       </Navbar>
 *     </Layout>
 *   </App>
 * </AuthProvider>
 * 
 * Context is like a "portal" - put data in at top, access anywhere below.
 * 
 * When to use Context:
 * ✅ Auth state (needed everywhere)
 * ✅ Theme (dark/light mode)
 * ✅ Language/i18n
 * ❌ Form state (keep local)
 * ❌ Rarely-used data (prop drilling might be fine)
 * 
 * Performance Note:
 * When context value changes, ALL components using it re-render.
 * Split contexts if different parts change at different rates.
 * 
 * Alternatives to Context:
 * - Redux: More boilerplate, better DevTools, time-travel debugging
 * - Zustand: Simpler than Redux, better performance than Context
 * - Jotai/Recoil: Atomic state management
 * - TanStack Query: For server state (not auth state)
 * 
 * For auth state, Context is perfect - simple, built-in, and sufficient.
 */

'use client' // This MUST be a Client Component (uses hooks, interactivity)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import type { AuthContextType, User, SignInData, SignUpData } from '@/types/auth'

/**
 * Create the context with undefined as initial value
 * We'll throw an error if someone tries to use it outside the Provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Custom hook to access auth context
 * 
 * This is a common pattern in React:
 * Instead of importing AuthContext and useContext everywhere,
 * we create a custom hook that does both and adds error handling.
 * 
 * Usage: const { user, signIn, logout } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * AuthProvider Component
 * 
 * Wraps the entire app to provide auth state to all children.
 * Handles all authentication logic in one place.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading=true
  
  /**
   * Check authentication status on mount
   * 
   * Why? When user refreshes page, we need to check if they're still logged in.
   * We call our API route which checks for valid cookies.
   * 
   * 🎓 useEffect Hook:
   * Runs after component renders. Perfect for side effects like:
   * - Data fetching
   * - Subscriptions
   * - Manually changing the DOM
   * 
   * The empty dependency array [] means "run only once on mount"
   */
  useEffect(() => {
    checkAuth()
  }, [])

  /**
   * Check if user is authenticated
   * 
   * This calls a (hypothetical) endpoint to verify the token.
   * In a real app, you might:
   * 1. Call /auth/me or /auth/verify endpoint
   * 2. Backend checks if access token in cookie is valid
   * 3. Returns user data if valid, 401 if not
   * 
   * For this tutorial, we'll implement a simple check.
   */
  const checkAuth = async () => {
  try {
    // Check if cookie exists
    const hasAuth = document.cookie.includes('accessToken')
    if (hasAuth) {
      // In production, you'd fetch user data from /api/auth/me
      // For now, get from localStorage or set placeholder
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser({ 
          email: 'user@example.com',
          username: 'User' 
        })
      }
    }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sign up function
   * 
   * 🎓 useCallback Hook:
   * Memoizes the function so it doesn't get recreated on every render.
   * Important when passing functions as props or dependencies.
   * 
   * Without useCallback:
   * - New function created on every render
   * - Child components re-render unnecessarily
   * - useEffect dependencies trigger unnecessarily
   * 
   * With useCallback:
   * - Same function reference unless dependencies change
   * - Better performance
   * 
   * When to use:
   * ✅ Functions passed as props to optimized children
   * ✅ Functions in useEffect dependencies
   * ❌ Simple event handlers (overkill)
   * ❌ Functions not used as dependencies
   */
  const signUp = useCallback(async (data: SignUpData) => {
  try {
    setIsLoading(true)
    
    const response = await axios.post('/api/auth/signup', data, {
      withCredentials: true,
    })

    const user = { 
      email: data.email,
      username: data.username 
    }
    setUser(user)
    localStorage.setItem('user', JSON.stringify(user)) // ✅ Store user
    
    router.push('/dashboard')
  } catch (error) {
    console.error('Signup failed:', error)
    throw error
  } finally {
    setIsLoading(false)
  }
}, [router])

  /**
   * Sign in function
   * Similar to signUp but for existing users
   */
  const signIn = useCallback(async (data: SignInData) => {
  try {
    setIsLoading(true)
    
    const response = await axios.post('/api/auth/signin', data, {
      withCredentials: true,
    })

    // In production, backend would return username
    const user = { 
      email: data.email,
      username: data.email.split('@')[0] // Extract from email as fallback
    }
    setUser(user)
    localStorage.setItem('user', JSON.stringify(user)) // ✅ Store user
    
    router.push('/dashboard')
  } catch (error) {
    console.error('Signin failed:', error)
    throw error
  } finally {
    setIsLoading(false)
  }
}, [router])

const logout = useCallback(async () => {
  try {
    setIsLoading(true)
    
    await axios.post('/api/auth/logout', {}, {
      withCredentials: true,
    })
    
    setUser(null)
    localStorage.removeItem('user') // ✅ Clear stored user
    
    router.push('/signin')
  } catch (error) {
    console.error('Logout failed:', error)
    setUser(null)
    localStorage.removeItem('user')
    router.push('/signin')
  } finally {
    setIsLoading(false)
  }
}, [router])

  /**
   * Manually refresh authentication
   * 
   * This is called by the axios interceptor when token expires.
   * You can also expose this for manual refresh (e.g., after long idle time).
   */
  const refreshAuth = useCallback(async () => {
    await checkAuth()
  }, [])

  /**
   * Context value object
   * 
   * This is what consumers of useAuth() will receive.
   * 
   * 🎓 Memoization:
   * We could wrap this in useMemo to prevent unnecessary re-renders,
   * but since auth state doesn't change frequently, it's not critical.
   * 
   * const value = useMemo(() => ({
   *   user, isAuthenticated, isLoading, signIn, signUp, logout, refreshAuth
   * }), [user, isLoading, signIn, signUp, logout, refreshAuth])
   */
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    logout,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 🎓 KEY LEARNINGS: React Context & State Management
 * ==================================================
 * 
 * 1. **Context API is for global state**
 *    - Auth, theme, language - things needed everywhere
 *    - Not for frequently changing data (performance issues)
 * 
 * 2. **Custom hooks improve DX**
 *    - useAuth() is cleaner than useContext(AuthContext)
 *    - Can add validation, error handling in one place
 * 
 * 3. **Loading state is crucial**
 *    - Always start with isLoading=true
 *    - Check auth on mount before rendering protected content
 *    - Prevents flash of wrong UI
 * 
 * 4. **Error handling strategies**
 *    - Re-throw errors from context functions
 *    - Let UI components decide how to display errors
 *    - Log errors for debugging
 * 
 * 5. **useCallback for function stability**
 *    - Prevents unnecessary re-renders
 *    - Important for functions passed to children
 *    - Use when function is in dependency arrays
 * 
 * 6. **Separation of concerns**
 *    - Context: Manages state and provides methods
 *    - API routes: Handle HTTP and cookies
 *    - Backend: Validates and processes requests
 *    - Components: Display UI and handle user input
 * 
 * 7. **Why not Redux?**
 *    - Auth state is simple (user + loading + methods)
 *    - Context is lighter, no extra dependencies
 *    - Redux shines with complex state and many actions
 *    - For larger apps, consider Redux Toolkit
 * 
 * 8. **Server State vs Client State**
 *    - Server state: Data from API (use React Query/SWR)
 *    - Client state: UI state (use Context/Zustand)
 *    - Auth is hybrid: tokens are server state, but auth status is client state
 */