/**
 * Navigation Bar Component
 * 
 * Shows different content based on authentication state:
 * - Not authenticated: Sign In / Sign Up buttons
 * - Authenticated: Dashboard link and Logout button
 */

'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  /**
   * Handle logout button click
   */
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-gray-700"
            >
              MyApp
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              /**
               * Authenticated User Navigation
               */
              <>
                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>

                {/* User Email Display */}
                <span className="text-sm text-gray-600">
                  {user?.email}
                </span>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium text-white
                    transition-colors duration-200
                    ${isLoggingOut
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                    }
                  `}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              /**
               * Unauthenticated User Navigation
               */
              <>
                {/* Sign In Link */}
                <Link
                  href="/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>

                {/* Sign Up Button */}
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

/**
 * 🎓 KEY LEARNINGS: Conditional Rendering in React
 * =================================================
 * 
 * 1. **Ternary Operator for JSX**
 *    ```tsx
 *    {condition ? <ComponentA /> : <ComponentB />}
 *    ```
 *    - Clean syntax for binary conditions
 *    - Both branches must be valid JSX
 * 
 * 2. **Logical AND for Optional Rendering**
 *    ```tsx
 *    {condition && <Component />}
 *    ```
 *    - Renders component if condition is true
 *    - Renders nothing if false
 *    - Watch out for 0 and empty strings (falsy but render as "0" or "")
 * 
 * 3. **Fragment for Multiple Elements**
 *    ```tsx
 *    {condition ? (
 *      <>
 *        <ElementA />
 *        <ElementB />
 *      </>
 *    ) : (
 *      <ElementC />
 *    )}
 *    ```
 *    - Use <> </> (Fragment) to group elements
 *    - Doesn't add extra DOM nodes
 * 
 * 4. **Button vs Link**
 *    - <button>: For actions (logout, submit)
 *    - <Link>: For navigation (pages)
 *    - Don't use <a> for actions (accessibility issues)
 *    - Don't use <button> for navigation (wrong semantics)
 * 
 * 5. **Next.js Link Component**
 *    - Prefetches pages on hover (faster navigation)
 *    - Client-side navigation (no full page reload)
 *    - Automatically handles scroll restoration
 *    - Use href prop, not onClick for navigation
 * 
 * 6. **Disabled State Styling**
 *    - Change visual appearance when disabled
 *    - cursor-not-allowed shows user can't click
 *    - Reduce opacity or use gray color
 *    - Never hide disabled elements (confuses users)
 */