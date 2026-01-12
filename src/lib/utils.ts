/**
 * Utility Functions
 * 
 * Common helper functions used throughout the app
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine and merge Tailwind CSS classes
 * 
 * 🎓 LEARNING: Why this utility?
 * 
 * Problem: Conflicting Tailwind classes
 * ```tsx
 * <div className="p-4 p-8"> // Which padding wins?
 * ```
 * 
 * Solution: clsx + tailwind-merge
 * - clsx: Conditionally join classNames
 * - tailwind-merge: Merge conflicting classes intelligently
 * 
 * Example usage:
 * ```tsx
 * cn(
 *   "p-4 text-white",
 *   isActive && "bg-blue-500",
 *   "p-8" // This overrides p-4
 * )
 * // Result: "p-8 text-white bg-blue-500"
 * ```
 * 
 * @param inputs - Class names to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 * 
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

/**
 * Delay execution (useful for loading states in development)
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Truncate string with ellipsis
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Check if code is running in browser
 * Useful for code that needs to run only client-side
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * 🎓 KEY LEARNING: Utility Functions Best Practices
 * =================================================
 * 
 * 1. **Keep them pure**: Same input = same output
 * 2. **Make them reusable**: Generic, not specific
 * 3. **Document them**: Explain what, why, and how
 * 4. **Type them**: Always use TypeScript
 * 5. **Test them**: Easy to test since they're pure
 * 
 * Common utility categories:
 * - String manipulation (truncate, slugify, etc.)
 * - Date formatting (formatDate, timeAgo, etc.)
 * - Array operations (unique, groupBy, etc.)
 * - Object operations (pick, omit, merge, etc.)
 * - Validation (isEmail, isURL, etc.)
 * - Styling (cn, classNames, etc.)
 */