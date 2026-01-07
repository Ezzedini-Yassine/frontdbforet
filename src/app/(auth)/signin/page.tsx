/**
 * Sign In Page
 */

'use client'

import SignInForm from '@/components/forms/SignInForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
          <SignInForm />
        </div>
      </div>
    </div>
  )
}