/**
 * Sign Up Page
 * 
 * 🎓 LEARNING: This is a Client Component because it uses the SignUpForm
 * which needs interactivity (form submission, state management, etc.)
 * 
 * In Next.js 14 App Router, pages are Server Components by default.
 * We make this a Client Component with 'use client' directive.
 */

'use client'

import SignUpForm from '@/components/forms/SignUpForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start your journey with us today
          </p>
        </div>

        {/* Form */}
        <div className="mt-8 bg-white py-8 px-6 shadow rounded-lg">
          <SignUpForm />
        </div>
      </div>
    </div>
  )
}

/**
 * 🎓 KEY LEARNING: Page Structure in App Router
 * =============================================
 * 
 * File location: app/(auth)/signup/page.tsx
 * URL: /signup (the (auth) is a route group, doesn't affect URL)
 * 
 * Special files in a route folder:
 * - page.tsx - The page UI
 * - layout.tsx - Shared layout for this route and children
 * - loading.tsx - Loading UI (Suspense fallback)
 * - error.tsx - Error UI (Error Boundary)
 * - not-found.tsx - 404 UI
 * - template.tsx - Like layout but re-renders on navigation
 * 
 * Why this is a Client Component:
 * - Uses SignUpForm which has interactive elements
 * - Could be Server Component if we passed form submission to a server action
 * - But we're using client-side API calls with axios
 * 
 * Alternative: Server Component with Server Actions
 * ```tsx
 * // page.tsx (Server Component)
 * async function signup(formData: FormData) {
 *   'use server'
 *   // Handle signup server-side
 * }
 * 
 * export default function SignUpPage() {
 *   return <form action={signup}>...</form>
 * }
 * ```
 * 
 * We use Client Component approach because:
 * - More familiar to React developers
 * - Better for complex validation (Zod + RHF)
 * - Easier to show loading states and errors
 * - More control over UX
 */