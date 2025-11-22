# NextAuth.js Authentication Upgrade

## Overview
StudyBuddy has been upgraded from mock authentication to real authentication using **NextAuth.js v5** (beta) with JWT sessions and credentials-based login.

## What Changed

### 1. **Installed Dependencies**
- `next-auth@5.0.0-beta.30` - NextAuth.js v5 for Next.js 14

### 2. **New Files Created**

#### `lib/auth.ts`
Main NextAuth configuration with:
- **Credentials Provider** for email/password authentication
- Mock authentication logic (email must end with `@example.com` and password ≥8 characters)
- JWT session strategy
- Custom callbacks for token and session management

#### `app/api/auth/[...nextauth]/route.ts`
NextAuth API route handlers for authentication endpoints.

#### `types/next-auth.d.ts`
TypeScript type declarations extending NextAuth's default types to include user `id`.

#### `.env.local`
Environment variables with generated `NEXTAUTH_SECRET` and `NEXTAUTH_URL`.

### 3. **Updated Files**

#### `contexts/AuthContext.tsx`
- **Replaced Zustand** store with NextAuth's `useSession` hook
- **Replaced mock login/signup** with `signIn('credentials')` from NextAuth
- **Replaced mock logout** with NextAuth's `signOut`
- Removed localStorage persistence (handled by JWT sessions)
- Added `isLoading` state from session status

#### `app/auth/login/page.tsx`
- Uses NextAuth's `signIn` instead of mock login
- **Added session redirect**: If already authenticated, redirects to dashboard
- **Added error handling**: Displays toast for NextAuth errors via query params
- **Added "Forgot Password?" link** with animated underline (mock - shows toast "Email sent")

#### `app/auth/signup/page.tsx`
- Uses NextAuth's `signIn` for signup flow (creates session)
- **Added session redirect**: If already authenticated, redirects to dashboard
- **Added error handling**: Displays toast for NextAuth errors

#### `app/layout.tsx`
- **Wrapped app with `SessionProvider`** from `next-auth/react`
- Required for client-side session access

#### `.env.local.example`
- Updated with NextAuth configuration requirements

## Authentication Flow

### Login
1. User submits email and password
2. NextAuth validates credentials via `authorize` function
3. If valid (email ends with `@example.com` and password ≥8 chars):
   - JWT token created with user info
   - Session established
   - User redirected to dashboard
4. If invalid, error toast displayed

### Signup
1. User submits name, email, and password
2. Password strength validated client-side
3. NextAuth `signIn` called with credentials
4. Same flow as login (creates session)

### Logout
1. User clicks logout
2. NextAuth's `signOut` called
3. JWT token cleared
4. Session ended

## Mock Authentication Rules

Currently using mock authentication for demonstration:
- ✅ Email must end with `@example.com`
- ✅ Password must be ≥8 characters
- ✅ All valid logins create the same user (id: "1")

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123` (or any 8+ char password)

## Environment Variables

Required in `.env.local`:

```env
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
```

**IMPORTANT**: Never commit `.env.local` to version control!

## Session Management

- **Strategy**: JWT (stateless)
- **Storage**: HTTP-only cookies (secure)
- **Expiry**: Default NextAuth expiration (30 days)

## Protected Routes

Components can check authentication using:

```tsx
const { user, isAuthenticated, isLoading } = useAuth();

if (isLoading) return <div>Loading...</div>;
if (!isAuthenticated) router.push('/auth/login');
```

## UI Enhancements

### Login Page
- Animated gradient background with orbs
- Floating label inputs
- Password visibility toggle
- **Forgot Password link** with animated underline (mock)
- Error handling via toasts
- Confetti animation on success

### Signup Page
- All login page features plus:
- Password strength indicator
- Password confirmation with mismatch warning

## Future Enhancements

To upgrade to real authentication:

1. **Add Database** (e.g., Prisma)
   ```bash
   npm install @auth/prisma-adapter @prisma/client
   ```

2. **Update `lib/auth.ts`**:
   - Replace mock `authorize` with real database lookup
   - Add password hashing (bcrypt)
   - Add email verification
   - Implement actual password reset

3. **Add OAuth Providers** (optional):
   ```typescript
   import Google from "next-auth/providers/google"
   import GitHub from "next-auth/providers/github"
   ```

4. **Add Protected API Routes**:
   ```typescript
   import { auth } from "@/lib/auth";
   
   export async function GET() {
     const session = await auth();
     if (!session) return new Response("Unauthorized", { status: 401 });
     // ...
   }
   ```

## Troubleshooting

### Error: "Session not found"
- Ensure `SessionProvider` wraps the app in `layout.tsx`
- Check `.env.local` has `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### Error: "Invalid credentials"
- Verify email ends with `@example.com`
- Verify password is ≥8 characters

### Session not persisting
- Check browser cookies are enabled
- Verify `NEXTAUTH_URL` matches your domain

## API Reference

### `useAuth()` Hook

```typescript
const {
  user,           // User object or null
  isAuthenticated,// Boolean
  isLoading,      // Boolean (session loading state)
  login,          // (email, password) => Promise<boolean>
  signup,         // (name, email, password) => Promise<boolean>
  logout,         // () => Promise<void>
} = useAuth();
```

## Resources

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
