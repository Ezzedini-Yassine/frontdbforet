/**
 * SignUp Form Component
 * 
 * 🎓 DEEP DIVE: React Hook Form + Zod
 * ====================================
 * 
 * Why React Hook Form?
 * 
 * Traditional approach (controlled inputs):
 * ```tsx
 * const [email, setEmail] = useState('')
 * const [password, setPassword] = useState('')
 * <input value={email} onChange={(e) => setEmail(e.target.value)} />
 * ```
 * Problems:
 * - Re-renders on EVERY keystroke
 * - Lots of boilerplate (state + handler for each field)
 * - Manual validation logic
 * 
 * React Hook Form approach (uncontrolled):
 * ```tsx
 * const { register } = useForm()
 * <input {...register('email')} />
 * ```
 * Benefits:
 * ✅ No re-renders until submit
 * ✅ Less code
 * ✅ Built-in validation
 * ✅ Better performance
 * 
 * How it works:
 * - Uses refs instead of state
 * - Only re-renders on errors or submit
 * - Integrates with validation libraries (Zod, Yup)
 * 
 * Why Zod?
 * - TypeScript-first validation
 * - Type inference (types from schema automatically)
 * - Composable schemas
 * - Runtime + compile-time safety
 * 
 * Alternative validation libraries:
 * - Yup: Similar, but JS-first
 * - Joi: Backend-focused
 * - Vest: Test-inspired syntax
 * - Manual: Roll your own (not recommended)
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
 * Zod Schema for Signup Form
 * 
 * This defines the shape and validation rules for our form data.
 * 
 * Common Zod methods:
 * - z.string() - Must be string
 * - .email() - Must be valid email format
 * - .min(n) - Minimum length
 * - .max(n) - Maximum length
 * - .regex(/pattern/) - Must match regex
 * - .optional() - Field is optional
 * - .nullable() - Can be null
 * - .refine((val) => test, { message }) - Custom validation
 */

const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(30, 'Password must be at most 30 characters')
    .regex(
      /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
      'Password must contain uppercase, lowercase, and a number or special character'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],  // Show error on confirmPassword field
})
/**
 * Infer TypeScript type from Zod schema
 * This is the magic of Zod - automatic type inference!
 * 
 * signUpFormData will be:
 * {
 *   email: string
 *   username: string
 *   password: string
 *   confirmPassword: string
 * }
 */
type SignUpFormData = z.infer<typeof signUpSchema>

export default function SignUpForm() {
  const { signUp } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Initialize React Hook Form
   * 
   * useForm returns:
   * - register: Function to register inputs
   * - handleSubmit: Wrapper for submit handler
   * - formState: Contains errors, isValid, isDirty, etc.
   * - watch: Watch field values
   * - setValue: Programmatically set values
   * - reset: Reset form to defaults
   * - trigger: Manually trigger validation
   * 
   * resolver: zodResolver(schema)
   * - Integrates Zod validation with React Hook Form
   * - Validates on blur, change, or submit (configurable)
   */
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur', // Validate on blur (also: onChange, onSubmit, onTouched, all)
  })

  /**
   * Form submit handler
   * 
   * handleSubmit from RHF:
   * 1. Validates all fields using Zod schema
   * 2. If valid, calls this function with data
   * 3. If invalid, doesn't call, shows errors
   * 
   * @param data - Validated form data (type-safe!)
   */
  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true)

      /**
       * Call signup function from AuthContext
       * Only pass email and password (not confirmPassword)
       */
      await signUp({
        email: data.email,
        username: data.username,
        password: data.password,
      })

      /**
       * Show success toast
       * 
       * Toast library alternatives:
       * - react-hot-toast (what we use): Simple, beautiful
       * - react-toastify: More features, heavier
       * - sonner: Modern, from Shadcn UI
       */
      toast.success('Account created! Redirecting...')

      // Reset form on success
      reset()

      // AuthContext will handle redirect to dashboard
    } catch (error: any) {
      /**
       * Handle signup errors
       * 
       * Common error scenarios:
       * - Email already exists (409)
       * - Validation failed (400)
       * - Server error (500)
       * - Network error (no response)
       */
      console.error('Signup error:', error)
      
      // Extract error message from different error shapes
      const message = error.response?.data?.error || error.message || 'Signup failed'
      
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
          
          {/**
           * The magic: {...register('email')}
           * 
           * This spreads these props onto the input:
           * - name="email"
           * - ref={...} (for form control)
           * - onChange={...}
           * - onBlur={...}
           * 
           * RHF tracks this input and validates it
           */}
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
          
          {/* Show error message if validation failed */}
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Username Field */}
          <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <input
            {...register('username')}
            type="text"
            id="username"
            className={`
              w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
              ${errors.username 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="yacine_dev"
            disabled={isSubmitting}
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && (
            <p id="username-error" className="mt-1 text-sm text-red-600">
              {errors.username.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            3-30 characters. Letters, numbers, underscores, and hyphens only.
          </p>
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

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            id="confirmPassword"
            className={`
              w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
              ${errors.confirmPassword 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="••••••••"
            disabled={isSubmitting}
            aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
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
          {isSubmitting ? 'Creating account...' : 'Sign Up'}
        </button>

        {/* Link to Sign In */}
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            href="/signin" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

/**
 * 🎓 KEY LEARNINGS: Forms in React
 * =================================
 * 
 * 1. **Controlled vs Uncontrolled Components**
 *    
 *    Controlled (React state):
 *    - Value stored in React state
 *    - onChange updates state
 *    - Re-renders on every change
 *    - Full React control
 *    
 *    Uncontrolled (refs):
 *    - Value stored in DOM
 *    - Access via ref when needed
 *    - No re-renders
 *    - Better performance
 *    
 *    React Hook Form uses uncontrolled approach
 * 
 * 2. **Form Validation Timing**
 *    - onSubmit: Only when form submitted (default)
 *    - onBlur: When field loses focus (good UX)
 *    - onChange: On every keystroke (immediate feedback)
 *    - onTouched: After first interaction
 *    - all: All of the above
 *    
 *    Best practice: onBlur or onChange after first submit
 * 
 * 3. **Accessibility (a11y) Best Practices**
 *    - Always use <label> with htmlFor
 *    - Use aria-invalid for error states
 *    - Use aria-describedby to link errors
 *    - Disable buttons during submission
 *    - Show loading states clearly
 *    - Ensure keyboard navigation works
 * 
 * 4. **Error Handling Patterns**
 *    - Show field-level errors (validation)
 *    - Show form-level errors (server errors)
 *    - Clear errors on retry
 *    - Prevent multiple submissions
 *    - Provide helpful error messages
 * 
 * 5. **Loading States**
 *    - Disable form during submission
 *    - Change button text to show progress
 *    - Optional: Show spinner icon
 *    - Prevent accidental double submissions
 * 
 * 6. **Password Best Practices**
 *    - Minimum 8 characters
 *    - Require mix of character types
 *    - Show password strength meter (nice-to-have)
 *    - Allow showing/hiding password
 *    - Never autofill in plain text
 * 
 * 7. **Form Reset**
 *    - reset() clears form to defaults
 *    - Call after successful submission
 *    - Can set new default values
 *    - Resets validation state
 * 
 * 8. **TypeScript Integration**
 *    - z.infer<typeof schema> for type inference
 *    - Fully type-safe form data
 *    - Autocomplete for form fields
 *    - Compile-time error checking
 */