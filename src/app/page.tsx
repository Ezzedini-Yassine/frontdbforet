/**
 * Home Page (Landing Page)
 * 
 * This is the root page at "/"
 * Accessible to everyone (not protected)
 */

'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Next.js Auth Tutorial
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A complete, production-ready authentication system built with
            Next.js 14 App Router, TypeScript, and secure httpOnly cookies.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/signin"
                  className="px-8 py-3 bg-white text-gray-900 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Secure Authentication
            </h3>
            <p className="text-gray-600">
              httpOnly cookies, token refresh, and automatic session management.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Next.js 14 App Router
            </h3>
            <p className="text-gray-600">
              Server Components, Middleware, and modern React patterns.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Beautiful UI
            </h3>
            <p className="text-gray-600">
              Tailwind CSS, React Hook Form, and toast notifications.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Built With
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Next.js 14',
              'TypeScript',
              'Tailwind CSS',
              'React Hook Form',
              'Zod Validation',
              'Axios',
              'httpOnly Cookies',
              'NestJS Backend'
            ].map((tech) => (
              <div
                key={tech}
                className="text-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm font-medium text-gray-700">
                  {tech}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 🎓 KEY LEARNING: Conditional Content Based on Auth
 * ==================================================
 * 
 * This page shows different CTAs based on auth status:
 * - Not logged in: "Get Started" + "Sign In"
 * - Logged in: "Go to Dashboard"
 * 
 * This is a common pattern for landing pages.
 * The auth state comes from Context, making it easy to access.
 */