/**
 * SignIn Form Component
 * 
 * Similar to SignUpForm but simpler validation
 * (no password confirmation needed)
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

/**
 * Zod Schema for Signin Form
 * Simpler than signup - just email and password
 */
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

export default function SignInForm() {
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsSubmitting(true)
      await signIn(data)
      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Signin error:', error)
      const message = error.response?.data?.error || error.message || 'Signin failed'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className={`
              w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
              ${errors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            className={`
              w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
              ${errors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="••••••••"
            disabled={isSubmitting}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full py-2 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Link to Sign Up */}
        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}