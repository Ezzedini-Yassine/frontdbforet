/**
 * Type definitions for authentication
 * 
 * Why centralize types?
 * - Single source of truth
 * - TypeScript inference across the app
 * - Easy to update if backend API changes
 */

// Matches your NestJS CreateUserDto
export interface SignUpData {
  email: string
  username: string
  password: string
}

// Matches your NestJS AuthDto
export interface SignInData {
  email: string
  password: string
}

// Response from /auth/signup and /auth/signin
export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

// User object (you might expand this later)
export interface User {
  email: string
  username?: string
  // Add more fields as your backend provides them
  // e.g., id, name, role, etc.
}

// Global auth state shape
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Auth context methods
export interface AuthContextType extends AuthState {
  signIn: (data: SignInData) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}