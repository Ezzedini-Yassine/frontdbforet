/**
 * Root Layout Component
 * 
 * 🎓 DEEP DIVE: Layouts in Next.js App Router
 * ============================================
 * 
 * Layouts are UI that is shared between multiple pages.
 * The root layout (app/layout.tsx) wraps your entire application.
 * 
 * Key characteristics:
 * 1. Required: Every Next.js app must have a root layout
 * 2. Must have <html> and <body> tags
 * 3. Server Component by default (good for performance)
 * 4. Doesn't re-render when navigating (preserves state)
 * 5. Can nest layouts (layout per route)
 * 
 * Layout vs Template:
 * - Layout: Preserves state, doesn't re-render
 * - Template: Re-renders on every navigation
 * 
 * Example layout nesting:
 * app/layout.tsx (root)
 * └── app/dashboard/layout.tsx (dashboard layout)
 *     └── app/dashboard/settings/layout.tsx (settings layout)
 * 
 * Metadata:
 * - Define in layout to apply to all child pages
 * - Or in page.tsx to override for specific page
 * - Automatically generates <head> tags
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/ui/Navbar'

/**
 * Load Inter font from Google Fonts
 * 
 * 🎓 Next.js Font Optimization:
 * - Fonts are automatically optimized (subset, preload)
 * - No layout shift (font metrics known at build time)
 * - Self-hosted (privacy, performance)
 * - Supports variable fonts
 * 
 * Usage:
 * const inter = Inter({ subsets: ['latin'] })
 * <body className={inter.className}>
 */
const inter = Inter({ subsets: ['latin'] })

/**
 * Metadata for SEO and social sharing
 * 
 * This generates:
 * <title>Next.js Auth Tutorial</title>
 * <meta name="description" content="..." />
 * 
 * Can also set:
 * - openGraph (Facebook/LinkedIn previews)
 * - twitter (Twitter cards)
 * - icons (favicons, app icons)
 * - viewport (mobile responsiveness)
 * - robots (search engine indexing)
 */
export const metadata: Metadata = {
  title: 'Next.js Auth Tutorial',
  description: 'Complete authentication system with Next.js 14 and NestJS',
}

/**
 * Root Layout Component
 * 
 * @param children - Child pages/layouts
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/**
         * Wrap with Providers (Client Component)
         * 
         * This keeps the layout as a Server Component
         * while allowing client-side providers.
         */}
        <Providers>
          {/* Navigation bar appears on all pages */}
          <Navbar />
          
          {/* Page content */}
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}

/**
 * 🎓 KEY LEARNINGS: Root Layout
 * =============================
 * 
 * 1. **Why Layouts Don't Re-render**
 *    - Layouts preserve state during navigation
 *    - Good: Smoother transitions, keep scroll position
 *    - Bad: Can't reset state on navigation (use templates if needed)
 * 
 * 2. **Metadata Best Practices**
 *    - Set title and description for SEO
 *    - Use template syntax for dynamic titles:
 *      ```tsx
 *      title: {
 *        template: '%s | MyApp',
 *        default: 'MyApp'
 *      }
 *      // In page.tsx:
 *      title: 'Dashboard' // Becomes: Dashboard | MyApp
 *      ```
 * 
 * 3. **Font Loading Strategies**
 *    - next/font/google: Google Fonts (what we use)
 *    - next/font/local: Local font files
 *    - Both are optimized automatically
 *    - Supports font display swap, fallbacks, etc.
 * 
 * 4. **Global Styles**
 *    - Import globals.css in root layout
 *    - Contains Tailwind directives, CSS resets
 *    - Applied to entire app
 * 
 * 5. **Navbar Placement**
 *    - In layout: Shows on all pages
 *    - In page: Shows only on that page
 *    - We want navbar everywhere, so it's in layout
 * 
 * 6. **Server vs Client in Layouts**
 *    - Keep layouts as Server Components when possible
 *    - Use Client Components only for interactive parts
 *    - Wrap client providers in separate component
 * 
 * 7. **Layout Composition**
 *    You can have nested layouts:
 *    ```
 *    app/
 *      layout.tsx (root - has navbar)
 *      dashboard/
 *        layout.tsx (dashboard - has sidebar)
 *        page.tsx (dashboard page)
 *        settings/
 *          layout.tsx (settings - has tabs)
 *          page.tsx (settings page)
 *    ```
 *    
 *    Each layout wraps its children:
 *    Root → Dashboard → Settings → Page
 * 
 * 8. **Special Layout Features**
 *    - Can fetch data in Server Component layouts
 *    - Can add meta tags, link tags
 *    - Can define error boundaries
 *    - Can add analytics, monitoring
 */