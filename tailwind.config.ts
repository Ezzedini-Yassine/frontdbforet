/**
 * Tailwind CSS Configuration
 * 
 * 🎓 LEARNING: Tailwind Configuration
 * ===================================
 * 
 * This file configures Tailwind CSS for your project.
 * 
 * Key sections:
 * 1. content: Files to scan for class names
 * 2. theme: Customize or extend default theme
 * 3. plugins: Add Tailwind plugins
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  /**
   * Content Configuration
   * 
   * Tells Tailwind which files to scan for class names.
   * Tailwind will only include CSS for classes found in these files.
   * 
   * This enables:
   * - Tree-shaking (unused classes removed)
   * - Smaller bundle size
   * - JIT (Just-In-Time) compilation
   * 
   * Glob patterns:
   * - ** matches any number of directories
   * - * matches any file name
   * - {tsx,ts,jsx,js} matches any of these extensions
   */
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  /**
   * Theme Configuration
   * 
   * Customize Tailwind's default theme or extend it.
   * 
   * Two approaches:
   * 1. theme: { ... } - Replace defaults entirely
   * 2. theme.extend: { ... } - Add to defaults (recommended)
   */
  theme: {
    extend: {
      /**
       * Custom Colors
       * 
       * Add your brand colors here:
       * brand: {
       *   50: '#...',
       *   100: '#...',
       *   // ... up to 900
       * }
       * 
       * Usage: bg-brand-500, text-brand-700
       */
      colors: {
        // Add custom colors here
      },

      /**
       * Background Images
       * 
       * CSS variables are used by default for gradients
       * This allows for better compatibility with CSS-in-JS
       */
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      /**
       * Custom Spacing
       * 
       * Extend spacing scale if needed:
       * spacing: {
       *   '128': '32rem',
       *   '144': '36rem',
       * }
       * 
       * Usage: p-128, m-144
       */

      /**
       * Custom Breakpoints
       * 
       * Add custom breakpoints:
       * screens: {
       *   'xs': '475px',
       *   '3xl': '1920px',
       * }
       * 
       * Default breakpoints:
       * sm: 640px
       * md: 768px
       * lg: 1024px
       * xl: 1280px
       * 2xl: 1536px
       */

      /**
       * Font Family
       * 
       * Add custom fonts:
       * fontFamily: {
       *   sans: ['Inter', 'sans-serif'],
       *   serif: ['Georgia', 'serif'],
       * }
       */
    },
  },

  /**
   * Plugins
   * 
   * Add Tailwind plugins for additional functionality
   * 
   * Popular plugins:
   * - @tailwindcss/forms - Better form styling
   * - @tailwindcss/typography - Prose styling
   * - @tailwindcss/aspect-ratio - Aspect ratio utilities
   * - @tailwindcss/line-clamp - Line clamp utilities
   * 
   * Install: npm install @tailwindcss/forms
   * Use: plugins: [require('@tailwindcss/forms')]
   */
  plugins: [],
}

export default config

/**
 * 🎓 KEY LEARNINGS: Tailwind Configuration
 * ========================================
 * 
 * 1. **Content Paths Are Critical**
 *    - Wrong paths = Tailwind can't find your classes
 *    - Classes not found = Not included in CSS
 *    - Result: Styles don't work
 * 
 * 2. **Theme vs Theme.extend**
 *    - theme: {} replaces all defaults
 *    - theme.extend: {} adds to defaults
 *    - Almost always use extend
 * 
 * 3. **JIT Mode**
 *    - On by default in Tailwind 3+
 *    - Generates classes on-demand
 *    - Supports arbitrary values: p-[17px]
 *    - Super fast build times
 * 
 * 4. **Custom Values**
 *    Use arbitrary values for one-offs:
 *    - bg-[#1da1f2] (custom color)
 *    - p-[17px] (custom spacing)
 *    - text-[22px] (custom font size)
 * 
 * 5. **Responsive Design**
 *    Mobile-first by default:
 *    - p-4 applies to all sizes
 *    - md:p-6 applies at md and up
 *    - lg:p-8 applies at lg and up
 * 
 * 6. **Dark Mode**
 *    Enable with:
 *    darkMode: 'class' or 'media'
 *    
 *    Then use:
 *    dark:bg-gray-800
 * 
 * 7. **Purging in Production**
 *    Tailwind automatically purges unused CSS:
 *    - Scans content files
 *    - Extracts class names
 *    - Removes unused styles
 *    - Result: Tiny CSS bundle
 * 
 * 8. **Configuration File Priority**
 *    1. tailwind.config.ts (this file)
 *    2. tailwind.config.js
 *    3. Default configuration
 * 
 * 9. **VS Code IntelliSense**
 *    Install "Tailwind CSS IntelliSense" extension
 *    - Autocomplete class names
 *    - See color previews
 *    - Lint class names
 */