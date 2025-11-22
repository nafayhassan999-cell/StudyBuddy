# 🔧 Fix Supabase Auth 401 Error

## The Issue

You're getting a **401 error** when trying to sign up. This is because Supabase has **email confirmation enabled by default** for security, but it needs proper configuration.

## Quick Fix Options

### Option 1: Disable Email Confirmation (Development Only) ⚡ RECOMMENDED FOR TESTING

1. Go to your Supabase Dashboard: https://asdglggfwzeebcieckmq.supabase.co
2. Click **Authentication** in the left sidebar
3. Click **Providers** tab
4. Find **Email** provider (should be first)
5. Scroll down to **"Confirm email"** toggle
6. **Turn it OFF** (disable)
7. Click **Save**

✅ **This allows instant signup without email verification** - perfect for development!

### Option 2: Configure Email Properly (Production) 📧

If you want to keep email confirmation (recommended for production):

1. **Set up SMTP (Email Delivery):**
   - Dashboard → **Project Settings** → **Auth**
   - Scroll to **SMTP Settings**
   - Either:
     - Use Supabase's built-in email (limited to 3 emails/hour on free tier)
     - OR add your own SMTP credentials (Gmail, SendGrid, etc.)

2. **Configure Email Templates:**
   - Dashboard → **Authentication** → **Email Templates**
   - Customize the "Confirm signup" template
   - Make sure redirect URL is set correctly

3. **Test with a real email** you can access

### Option 3: Use Magic Link Instead 🪄

Magic links work without any extra setup:

1. Go to `/auth/login`
2. Toggle **"Use Magic Link"** switch
3. Enter your email
4. Check your email for the login link
5. Click it to sign in instantly!

---

## Step-by-Step: Disable Email Confirmation

Since you're in development, here's the easiest fix:

### 1. Open Supabase Dashboard
```
https://asdglggfwzeebcieckmq.supabase.co
```

### 2. Navigate to Auth Settings
- Left sidebar → **Authentication** ⚙️
- Top tabs → **Providers**

### 3. Configure Email Provider
- Find "Email" in the list
- Click to expand settings
- Look for **"Confirm email"** toggle
- **Turn it OFF** ❌
- Scroll down and click **Save**

### 4. Test Signup Again
- Go to: http://localhost:3000/auth/signup
- Fill in the form:
  - Name: `Nafay Hassan`
  - Email: `nafayhassan66@gmail.com`
  - Password: `yourpassword` (8+ characters)
- Click **Sign Up**
- Should work instantly! ✅

---

## Verify It's Working

After disabling email confirmation:

1. **Try Signup:**
   - Visit `/auth/signup`
   - Complete the form
   - Should see success message immediately
   - Automatically logged in

2. **Check in Supabase:**
   - Dashboard → **Authentication** → **Users**
   - You should see your new user listed
   - Status should be "confirmed"

3. **Try Login:**
   - Logout
   - Go to `/auth/login`
   - Login with same credentials
   - Should work!

---

## Alternative: Test with Magic Link

If you don't want to change settings, test magic link auth:

1. Go to `/auth/login`
2. Click the toggle **"Use Magic Link"** 
3. Enter your email
4. Click "Send Magic Link"
5. Check your email inbox
6. Click the link in the email
7. Automatically logged in! ✨

**Note:** Magic links always work, even with email confirmation enabled.

---

## Common Issues & Solutions

### Issue: "Email not confirmed"
**Fix:** Disable email confirmation in Auth settings (see above)

### Issue: "Invalid login credentials" 
**Fix:** Make sure you're using the same email/password you signed up with

### Issue: "User already registered"
**Fix:** Go to Dashboard → Authentication → Users → Delete the test user, then try again

### Issue: Still getting 401 errors
**Fix:** 
1. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
2. Restart your dev server: `npm run dev`
3. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)

---

## Production Recommendations

For production (when you deploy to Vercel):

✅ **DO:**
- Enable email confirmation
- Set up custom SMTP (SendGrid, Mailgun, etc.)
- Customize email templates with your branding
- Use environment variables for API keys

❌ **DON'T:**
- Leave email confirmation disabled
- Use Supabase's default email service (rate limited)
- Hard-code credentials

---

## Next Steps After Fixing

Once auth is working:

1. ✅ Test all auth methods:
   - Email/password signup
   - Email/password login
   - Magic link login
   - Google OAuth (after configuring)

2. ✅ Create a test profile:
   - Go to `/profile`
   - Add subjects, goals, bio
   - Upload avatar (after setting up storage)

3. ✅ Test features:
   - Browse groups
   - Send connection requests
   - Join study sessions

---

## Quick Reference

**Your Supabase Dashboard:**  
https://asdglggfwzeebcieckmq.supabase.co

**Key Settings Locations:**
- Auth Providers: Authentication → Providers
- Users: Authentication → Users  
- Email Templates: Authentication → Email Templates
- SMTP: Project Settings → Auth
- API Keys: Project Settings → API

**Test URLs:**
- Signup: http://localhost:3000/auth/signup
- Login: http://localhost:3000/auth/login
- Test Page: http://localhost:3000/test-supabase

---

Need help? Check the error message in your browser console for specific details!
