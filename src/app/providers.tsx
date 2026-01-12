/**
 * Providers Component
 * 
 * 🎓 DEEP DIVE: Why Separate Providers?
 * ======================================
 * 
 * In Next.js 14 App Router, the root layout is a Server Component by default.
 * But providers (Context, toast, etc.) need to be Client Components.
 * 
 * Problem:
 * ```tsx
 * // layout.tsx (Server Component)
 * export default function RootLayout({ children }) {
 *   return (
 *     <AuthProvider> ← ERROR! Can't use Client Component in Server Component
 *       {children}
 *     </AuthProvider>
 *   )
 * }
 * ```
 * 
 * Solution: Create a separate Client Component for providers
 * ```tsx
 * // providers.tsx (Client Component)
 * 'use client'
 * export function Providers({ children }) {
 *   return <AuthProvider>{children}</AuthProvider>
 * }
 * 
 * // layout.tsx (Server Component)
 * export default function RootLayout({ children }) {
 *   return <Providers>{children}</Providers>
 * }
 * ```
 * 
 * This pattern:
 * ✅ Keeps root layout as Server Component (better performance)
 * ✅ Isolates client-only code
 * ✅ Makes it easy to add more providers
 * ✅ Follows Next.js best practices
 */

'use client'

import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'react-hot-toast'

/**
 * Providers Wrapper Component
 * 
 * Wraps the app with all client-side providers:
 * - AuthProvider: Global authentication state
 * - Toaster: Toast notifications
 * 
 * Add more providers here as needed:
 * - ThemeProvider (dark mode)
 * - I18nProvider (internationalization)
 * - QueryClientProvider (React Query)
 * etc.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      
      {/**
       * Toaster component for react-hot-toast
       * 
       * This renders the toast container.
       * Place it anywhere in the component tree.
       * 
       * Configuration options:
       * - position: top-center, top-right, bottom-center, etc.
       * - duration: How long toasts stay visible (ms)
       * - toastOptions: Default styling for all toasts
       * - reverseOrder: Stack order of toasts
       */}
      <Toaster
        position="top-right"
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          // Success toast styling
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          // Error toast styling
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  )
}

/**
 * 🎓 KEY LEARNINGS: Provider Pattern in React
 * ===========================================
 * 
 * 1. **What is the Provider Pattern?**
 *    - Wrap your app with a Provider component
 *    - Provider gives access to data/methods via Context
 *    - Any child component can access the data
 *    - No need to pass props through every level
 * 
 * 2. **When to Use Providers**
 *    ✅ Data needed by many components (auth, theme)
 *    ✅ Configuration that affects whole app (i18n, router)
 *    ✅ Cross-cutting concerns (analytics, error tracking)
 *    ❌ Local state (use useState in component)
 *    ❌ Data for single component tree (pass props)
 * 
 * 3. **Multiple Providers**
 *    You can nest multiple providers:
 *    ```tsx
 *    <AuthProvider>
 *      <ThemeProvider>
 *        <QueryClientProvider>
 *          {children}
 *        </QueryClientProvider>
 *      </ThemeProvider>
 *    </AuthProvider>
 *    ```
 *    
 *    Or use a utility to compose them:
 *    ```tsx
 *    import { compose } from 'some-utility'
 *    
 *    const Providers = compose(
 *      AuthProvider,
 *      ThemeProvider,
 *      QueryClientProvider
 *    )
 *    ```
 * 
 * 4. **Performance Considerations**
 *    - Providers cause re-renders when their value changes
 *    - Split contexts if parts change at different rates
 *    - Use React.memo for expensive child components
 *    - Consider using a state management library for complex state
 * 
 * 5. **Server vs Client Components**
 *    - Providers are almost always Client Components
 *    - They use React hooks (Context API)
 *    - Keep them as close to where they're needed as possible
 *    - Don't wrap entire app if only part needs it
 * 
 * 6. **Testing with Providers**
 *    Create a custom render function:
 *    ```tsx
 *    const renderWithProviders = (ui: React.ReactElement) => {
 *      return render(
 *        <AuthProvider>
 *          <Toaster />
 *          {ui}
 *        </AuthProvider>
 *      )
 *    }
 *    ```
 */