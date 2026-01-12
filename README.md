# Next.js 14 Authentication System - Complete Guide

## 📚 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Testing Authentication Flows](#testing-authentication-flows)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Project Structure](#project-structure)
8. [Architecture Overview](#architecture-overview)
9. [Extensions & Next Steps](#extensions--next-steps)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **NestJS backend running** at `http://localhost:3000`
- Basic knowledge of React, TypeScript, and REST APIs

---

## Project Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest auth-frontend --typescript --tailwind --eslint --app --src-dir
cd auth-frontend
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install axios react-hook-form zod @hookform/resolvers react-hot-toast js-cookie

# Type definitions
npm install -D @types/js-cookie

# Utility libraries
npm install clsx tailwind-merge
```

### 3. Create Project Structure

```bash
# Create directory structure
mkdir -p src/{app/{api/auth/{signin,signup,logout,refresh},'(auth)'/{signin,signup},dashboard},components/{forms,ui},context,lib,types}

# The structure should look like:
src/
├── app/
│   ├── api/auth/
│   │   ├── signin/route.ts
│   │   ├── signup/route.ts
│   │   ├── logout/route.ts
│   │   └── refresh/route.ts
│   ├── (auth)/
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── providers.tsx
│   └── globals.css
├── components/
│   ├── forms/
│   │   ├── SignInForm.tsx
│   │   └── SignUpForm.tsx
│   └── ui/
│       └── Navbar.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts
│   ├── cookies.ts
│   └── utils.ts
├── types/
│   └── auth.ts
└── middleware.ts
```

---

## Environment Configuration

### Create `.env.local`

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Cookie names (these are NOT public, used in API routes)
COOKIE_ACCESS_TOKEN_NAME=accessToken
COOKIE_REFRESH_TOKEN_NAME=refreshToken
```

**⚠️ Security Note:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never put secrets in `NEXT_PUBLIC_*` variables
- Regular environment variables are server-only

---

## Running the Application

### 1. Start Your NestJS Backend

```bash
# In your backend directory
npm run start:dev

# Ensure it's running at http://localhost:3000
# Test with: curl http://localhost:3000/auth/signup
```

### 2. Start Next.js Development Server

```bash
# In your frontend directory
npm run dev
```

The app will be available at `http://localhost:3001` (or 3001 if 3000 is taken)

### 3. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

---

## Testing Authentication Flows

### Test 1: Sign Up Flow

1. **Navigate to Signup Page**
   ```
   http://localhost:3001/signup
   ```

2. **Fill out the form:**
   - Email: `test@example.com`
   - Password: `Test1234` (must have uppercase, lowercase, number)
   - Confirm Password: `Test1234`

3. **Expected Behavior:**
   - ✅ Form validates on blur
   - ✅ Shows validation errors if invalid
   - ✅ On success: Toast notification appears
   - ✅ Redirects to `/dashboard`
   - ✅ Navbar shows "Logout" button
   - ✅ Can see user email in navbar

4. **Verify Cookies (DevTools):**
   - Open DevTools → Application → Cookies
   - Should see `accessToken` and `refreshToken`
   - Both should be `HttpOnly` ✅
   - Both should be `Secure` in production ✅
   - `SameSite` should be `Strict` ✅

---

### Test 2: Sign In Flow

1. **Sign out first** (click Logout button)

2. **Navigate to Signin Page**
   ```
   http://localhost:3001/signin
   ```

3. **Sign in with your credentials**
   - Email: `test@example.com`
   - Password: `Test1234`

4. **Expected Behavior:**
   - ✅ Redirects to `/dashboard`
   - ✅ Toast shows "Welcome back!"
   - ✅ Cookies are set again

---

### Test 3: Protected Route Access

1. **Logout completely**

2. **Try to access Dashboard directly:**
   ```
   http://localhost:3001/dashboard
   ```

3. **Expected Behavior:**
   - ✅ Immediately redirects to `/signin`
   - ✅ URL shows: `/signin?callbackUrl=/dashboard`
   - ✅ No flash of dashboard content

4. **Sign in and verify:**
   - ✅ After signin, redirected back to `/dashboard`

---

### Test 4: Token Refresh (Advanced)

This is harder to test manually, but here's how:

1. **Sign in and go to Dashboard**

2. **Open DevTools → Application → Cookies**
   - Note the `accessToken` value

3. **Wait 15 minutes** (or modify your backend to use shorter token expiry)

4. **Make an API call** (refresh the dashboard or trigger an action)

5. **Expected Behavior:**
   - ✅ First request fails with 401
   - ✅ Axios interceptor automatically calls `/api/auth/refresh`
   - ✅ New tokens are set in cookies
   - ✅ Original request is retried and succeeds
   - ✅ User sees no interruption

**To test faster:** Modify backend token expiry to 1 minute instead of 15.

---

### Test 5: Authenticated User Trying to Access Auth Pages

1. **Sign in and stay on Dashboard**

2. **Try to navigate to Signin:**
   ```
   http://localhost:3001/signin
   ```

3. **Expected Behavior:**
   - ✅ Immediately redirects to `/dashboard`
   - ✅ Can't access signin page while logged in

---

## Common Issues & Solutions

### Issue 1: "CORS Error" when calling backend

**Problem:**
```
Access to fetch at 'http://localhost:3000/auth/signup' has been blocked by CORS policy
```

**Solution:**
Enable CORS in your NestJS backend:

```typescript
// main.ts (NestJS)
app.enableCors({
  origin: 'http://localhost:3001', // Your Next.js URL
  credentials: true, // REQUIRED for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

---

### Issue 2: Cookies not being set

**Problem:**
Cookies appear in Network tab but not in Application → Cookies

**Possible causes & solutions:**

1. **Missing `withCredentials: true`:**
   ```typescript
   // In API calls
   axios.post(url, data, { withCredentials: true })
   ```

2. **Backend not setting cookies correctly:**
   ```typescript
   // NestJS - ensure response includes Set-Cookie header
   res.cookie('accessToken', token, { httpOnly: true, ... })
   ```

3. **Secure flag in development:**
   ```typescript
   // In cookies.ts, ensure Secure is false in development
   secure: process.env.NODE_ENV === 'production'
   ```

---

### Issue 3: Middleware redirect loop

**Problem:**
Browser shows "Too many redirects" error

**Cause:**
Middleware is redirecting authenticated users from dashboard to signin, which redirects back to dashboard.

**Solution:**
Check your middleware logic:
```typescript
// middleware.ts - ensure logic is correct
if (isAuthenticated && AUTH_ROUTES.includes(pathname)) {
  // Redirect TO dashboard (not signin)
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

### Issue 4: "useAuth must be used within AuthProvider"

**Problem:**
Component throws this error when trying to use `useAuth()`

**Solution:**
Ensure component is wrapped in `AuthProvider`:
```tsx
// app/layout.tsx
<Providers> {/* This includes AuthProvider */}
  {children}
</Providers>
```

---

### Issue 5: Token refresh not working

**Problem:**
After 15 minutes, user is logged out instead of token being refreshed

**Solution:**

1. **Check axios interceptor is set up** (`lib/api.ts`)
2. **Verify refresh endpoint works:**
   ```bash
   curl -X POST http://localhost:3000/auth/refresh \
     -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
   ```
3. **Check browser console** for interceptor logs
4. **Verify refresh token is in cookies**

---

## Project Structure Explained

```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/                # API Route Handlers (server-side)
│   │   ├── signin/route.ts     # POST /api/auth/signin
│   │   ├── signup/route.ts     # POST /api/auth/signup
│   │   ├── logout/route.ts     # POST /api/auth/logout
│   │   └── refresh/route.ts    # POST /api/auth/refresh
│   ├── (auth)/                  # Route group (doesn't affect URL)
│   │   ├── signin/page.tsx     # /signin page
│   │   └── signup/page.tsx     # /signup page
│   ├── dashboard/               # Protected route
│   │   └── page.tsx            # /dashboard page
│   ├── layout.tsx              # Root layout (wraps all pages)
│   ├── page.tsx                # Home page (/)
│   ├── providers.tsx           # Client providers wrapper
│   └── globals.css             # Global styles + Tailwind
├── components/
│   ├── forms/                   # Form components
│   │   ├── SignInForm.tsx      # Sign in form with validation
│   │   └── SignUpForm.tsx      # Sign up form with validation
│   └── ui/                      # UI components
│       └── Navbar.tsx           # Navigation bar
├── context/
│   └── AuthContext.tsx          # Global auth state management
├── lib/
│   ├── api.ts                   # Axios instance with interceptors
│   ├── cookies.ts               # Server-side cookie utilities
│   └── utils.ts                 # Helper functions
├── types/
│   └── auth.ts                  # TypeScript type definitions
└── middleware.ts                # Route protection middleware
```

---

## Architecture Overview

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│                                                                 │
│  ┌──────────────┐    ┌────────────────┐    ┌───────────────┐ │
│  │   SignUp     │───▶│  AuthContext   │───▶│   Navbar      │ │
│  │    Form      │    │  (useAuth())   │    │  (user data)  │ │
│  └──────────────┘    └────────────────┘    └───────────────┘ │
│         │                     │                                │
│         │ POST /api/auth/signup                               │
│         ▼                     ▼                                │
└─────────┼─────────────────────┼────────────────────────────────┘
          │                     │
          │                     │ Axios Interceptor
          │                     │ (auto token refresh)
          │                     │
┌─────────▼─────────────────────▼────────────────────────────────┐
│                    Next.js Server (API Routes)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  POST /api/auth/signup                                   │ │
│  │  1. Validate input                                       │ │
│  │  2. Call NestJS backend                                  │ │
│  │  3. Set httpOnly cookies                                 │ │
│  │  4. Return success                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│         │ POST /auth/signup                                    │
│         ▼                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                      NestJS Backend                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  POST /auth/signup (SignupDto)                          │ │
│  │  1. Validate DTO (email, password)                      │ │
│  │  2. Hash password                                       │ │
│  │  3. Save user to database                               │ │
│  │  4. Generate JWT tokens (access + refresh)             │ │
│  │  5. Return { accessToken, refreshToken }               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. User submits signup form
   ↓
2. SignUpForm validates with Zod
   ↓
3. AuthContext.signUp() called
   ↓
4. Axios POST to /api/auth/signup (Next.js API route)
   ↓
5. API route forwards to NestJS /auth/signup
   ↓
6. NestJS creates user, returns tokens
   ↓
7. API route sets httpOnly cookies
   ↓
8. AuthContext updates state (user, isAuthenticated)
   ↓
9. Router redirects to /dashboard
   ↓
10. Middleware checks cookie, allows access
   ↓
11. Dashboard renders with user data
```

---

## Extensions & Next Steps

### Easy Extensions

1. **Remember Me Functionality**
   - Add checkbox to signin form
   - Extend refresh token expiry to 30 days
   - Store preference in localStorage

2. **Password Reset Flow**
   - "Forgot Password?" link
   - Email verification
   - Reset token generation
   - New API routes for reset flow

3. **Email Verification**
   - Send verification email on signup
   - Verify email token
   - Block unverified users from dashboard

4. **User Profile Page**
   - Display user info
   - Edit profile form
   - Change password functionality
   - Avatar upload

---

### Advanced Extensions

1. **Role-Based Access Control (RBAC)**
   ```typescript
   // Add role to user
   interface User {
     email: string
     role: 'user' | 'admin' | 'moderator'
   }
   
   // Protect routes by role
   if (user.role !== 'admin') {
     router.push('/dashboard')
   }
   ```

2. **Multi-Factor Authentication (MFA)**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Backup codes

3. **Social Authentication (OAuth)**
   - Sign in with Google
   - Sign in with GitHub
   - NextAuth.js integration

4. **Session Management**
   - View active sessions
   - Logout from all devices
   - Session timeout warnings

5. **Audit Logging**
   - Track login attempts
   - Log user actions
   - Export audit logs

---

### Performance Optimizations

1. **Server Components**
   - Convert static parts to Server Components
   - Reduce client-side JavaScript

2. **Streaming SSR**
   - Use Suspense boundaries
   - Stream dashboard data

3. **Image Optimization**
   - Use next/image for avatars
   - Lazy load images

4. **Code Splitting**
   - Dynamic imports for large components
   - Route-based splitting (automatic)

---

## Debugging Tips

### Enable Detailed Logging

```typescript
// lib/api.ts - Add request/response logging
apiClient.interceptors.request.use(config => {
  console.log('Request:', config.method?.toUpperCase(), config.url, config.data)
  return config
})

apiClient.interceptors.response.use(
  response => {
    console.log('Response:', response.status, response.data)
    return response
  },
  error => {
    console.error('Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)
```

### Check Middleware Execution

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  console.log('Middleware:', request.nextUrl.pathname)
  console.log('Cookies:', request.cookies.getAll())
  // ... rest of code
}
```

### Verify Token Contents (Development Only)

```typescript
// Decode JWT to see contents (don't verify, just decode)
function decodeToken(token: string) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload))
}

// Usage
const token = document.cookie.split('accessToken=')[1]?.split(';')[0]
console.log(decodeToken(token))
```

---

## Security Checklist

Before deploying to production:

- [ ] HTTPS enabled (Secure flag on cookies)
- [ ] CORS configured correctly (specific origins, not `*`)
- [ ] Rate limiting on auth endpoints
- [ ] Password strength requirements enforced
- [ ] SQL injection prevention (use ORMs with parameterized queries)
- [ ] XSS prevention (React escapes by default, but be careful with dangerouslySetInnerHTML)
- [ ] CSRF protection (SameSite=Strict cookies)
- [ ] Environment variables not committed to git (.env.local in .gitignore)
- [ ] Secrets not in NEXT_PUBLIC_* variables
- [ ] Token expiration times appropriate (15min access, 7days refresh)
- [ ] Refresh token rotation implemented
- [ ] Logout invalidates refresh tokens server-side
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated (npm audit)

---

## Resources & Further Learning

### Official Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
- [Axios](https://axios-http.com)

### Security Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [httpOnly Cookies Explained](https://owasp.org/www-community/HttpOnly)

### Next.js Specific
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Server vs Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

---

## Support

If you encounter issues:

1. Check the [Common Issues](#common-issues--solutions) section
2. Enable detailed logging (see [Debugging Tips](#debugging-tips))
3. Verify your backend is running and CORS is configured
4. Check browser console for errors
5. Check server logs (`npm run dev` output)

---

## License

This tutorial is provided as educational material. Feel free to use and modify for your projects.

---

**🎉 Congratulations!** You now have a complete, production-ready authentication system with Next.js 14 and deep understanding of how it all works together!