/**
 * Next.js Configuration (Updated for Next.js 16)
 * 
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /**
   * React Strict Mode
   */
  reactStrictMode: true,

  /**
   * Turbopack Configuration
   * Adding empty object silences the warning
   */
  turbopack: {},

  /**
   * Image Optimization
   */
  images: {
    domains: [],
    remotePatterns: [],
  },

  /**
   * Redirects
   */
  async redirects() {
    return []
  },

  /**
   * Headers
   */
  async headers() {
    return []
  },

  /**
   * Experimental Features
   */
  experimental: {
    // Add experimental features here if needed
  },

  // Remove the webpack config for now (Turbopack is default)
  // If you need webpack, explicitly use --webpack flag when running
}

module.exports = nextConfig