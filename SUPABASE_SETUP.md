# 🚀 Supabase Migration Guide - StudyBuddy

## Why Supabase?

Supabase is the **fastest full-stack backend for Next.js in 2025**. It replaces multiple services with one unified platform:

- ✅ **PostgreSQL Database** - Powerful relational database
- ✅ **Authentication** - Email, OAuth (Google, GitHub), Magic Links
- ✅ **Realtime** - Live database changes, presence, broadcasts
- ✅ **Storage** - File uploads with CDN
- ✅ **Row Level Security** - Database-level authorization
- ✅ **Auto-generated APIs** - RESTful and GraphQL endpoints
- ✅ **Built-in Dashboard** - Manage everything visually
- ✅ **Generous Free Tier** - Perfect for development

---

## 📋 Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Login
3. Click **"New Project"**
4. Name: `studybuddy`
5. Database Password: **(save this securely!)**
6. Region: Choose closest to your users
7. Wait ~2 minutes for provisioning ⏳

### 2. Get API Credentials

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long JWT token)

### 3. Update Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT:** Never commit `.env.local` to git!

### 4. Run Database Schema

1. In Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Copy entire content from `supabase/schema.sql`
4. Click **Run** or press `Cmd/Ctrl + Enter`
5. Wait for success confirmation ✅

This creates:
- All tables (profiles, connections, groups, messages, etc.)
- Row Level Security policies
- Triggers & functions
- Indexes for performance

### 5. Configure Authentication Providers

#### Enable Email/Password Auth (already enabled)

#### Enable Magic Link Auth

1. Dashboard → **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **"Enable Email OTP"** → ON
4. Configure email templates (optional)
5. Save

#### Enable Google OAuth

1. Dashboard → **Authentication** → **Providers**
2. Find **Google** → Click **"Enable"**
3. Add your **Google Client ID** and **Secret**
   - Get from: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client
   - Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Save

### 6. Create Storage Buckets

1. Dashboard → **Storage**
2. Click **"New Bucket"** for each:
   - `avatars` (Public)
   - `group-files` (Private)
   - `course-thumbnails` (Public)
   - `notes` (Private)

#### Set Storage Policies

For each bucket, go to **Policies** tab:

**Avatars (public bucket):**
```sql
-- Anyone can view avatars
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
```

---

## 🔄 Migration from NextAuth to Supabase Auth

### What Changed

| Feature | NextAuth | Supabase Auth |
|---------|----------|---------------|
| Session Storage | JWT in cookies | JWT + Database |
| OAuth Providers | Manual setup | Built-in |
| Magic Links | Not supported | ✅ Native |
| Email Verification | Custom | ✅ Built-in |
| Password Reset | Custom | ✅ Built-in |
| User Management | Custom | ✅ Dashboard |
| Realtime | ❌ | ✅ Yes |

### Auth Context Updated

- ✅ Replaced `useSession` with `supabase.auth.getSession()`
- ✅ Added `loginWithGoogle()` - 1-click OAuth
- ✅ Added `loginWithMagicLink()` - passwordless auth
- ✅ Session automatically synced across tabs
- ✅ Automatic token refresh

### Login Page Updated

- ✅ **Magic Link Toggle** - Switch between password & magic link
- ✅ **Google Sign-In Button** - OAuth integration
- ✅ **Email/Password** - Traditional auth (still works)
- ✅ Auto-redirect if already logged in
- ✅ Beautiful UI preserved

---

## 📊 Database Structure

### Core Tables

**profiles** - User information
- Links to `auth.users` (Supabase auth table)
- Auto-created on signup via trigger

**connections** - Study buddy connections
- Pending/accepted/declined states
- Realtime updates supported

**groups** - Study groups
- Public/private
- Auto member count tracking

**messages** - Chat messages
- Direct & group messages
- Supports text, images, files

**courses** - Learning courses
- Creator ownership
- Enrollment tracking

**study_sessions** - Scheduled sessions
- RSVP system
- Virtual & in-person

See `supabase/schema.sql` for complete structure.

---

## 🎯 Using Server Actions

Server actions are located in `app/actions/`:

### Profile Actions

```typescript
import { getProfile, updateProfile, updatePoints } from "@/app/actions/profiles";

// Get current user's profile
const profile = await getProfile();

// Update profile
await updateProfile({
  subjects: ["Math", "Physics"],
  goal: "Ace my finals!",
  bio: "Computer Science student",
});

// Add points (gamification)
await updatePoints(50);
```

### Connection Actions

```typescript
import { sendConnectionRequest, acceptConnectionRequest } from "@/app/actions/connections";

// Send buddy request
await sendConnectionRequest(userId);

// Accept request
await acceptConnectionRequest(connectionId);

// Get all connections
const buddies = await getConnections("accepted");
```

### Group Actions

```typescript
import { createGroup, joinGroup, sendGroupMessage } from "@/app/actions/groups";

// Create study group
const group = await createGroup({
  name: "Math Study Group",
  category: "Mathematics",
  privacy: "public",
});

// Join group
await joinGroup(groupId);

// Send message
await sendGroupMessage(groupId, "Hello everyone!");
```

---

## ⚡ Realtime Features

### Live Connection Requests

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function RealtimeConnections() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Subscribe to new connection requests
    const channel = supabase
      .channel('connections')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
        },
        (payload) => {
          console.log('New connection request!', payload.new);
          // Update UI
          setRequests(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>...</div>;
}
```

### Live Chat Messages

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`group:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [groupId]);
```

### Presence (Who's Online)

```typescript
const channel = supabase.channel('study-room', {
  config: { presence: { key: user.id } },
});

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user: user.name, online_at: new Date() });
    }
  });
```

---

## 📁 File Upload Example

```typescript
"use client";

import { supabase } from "@/lib/supabase/client";

async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);

  return publicUrl;
}
```

---

## 🔒 Row Level Security (RLS)

RLS is **enabled by default** in our schema. This means:

- ✅ Users can only update their own profile
- ✅ Users can only see connections they're part of
- ✅ Group messages only visible to members
- ✅ File access controlled by ownership

### Example RLS Policy

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

**Test RLS:**
1. Dashboard → **Authentication** → **Policies**
2. Click table name
3. See all active policies
4. Test with **"Authenticate as user"**

---

## 🚀 Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Import your repository
4. **Add Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! 🎉

Supabase automatically works with:
- ✅ Preview deployments
- ✅ Multiple environments
- ✅ Serverless functions

---

## 📈 Next Steps

### 1. Enable Email Confirmations

In Supabase Dashboard → **Authentication** → **Email Templates**:
- Customize confirmation email
- Add your branding
- Set redirect URLs

### 2. Set Up Edge Functions (Optional)

For complex server-side logic:
```bash
npx supabase functions new my-function
```

### 3. Monitor Performance

Dashboard → **Database** → **Query Performance**
- See slow queries
- Add indexes
- Optimize

### 4. Set Up Backups

Dashboard → **Database** → **Backups**
- Daily automatic backups (included)
- Point-in-time recovery (paid plans)

### 5. Add More OAuth Providers

Supabase supports:
- GitHub
- GitLab
- Bitbucket
- Discord
- Facebook
- Twitter
- And more...

---

## 🆘 Troubleshooting

### Error: "Invalid API key"

**Fix:** Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches dashboard

### Error: "Row level security policy violation"

**Fix:** Ensure user is authenticated and policies allow the action

### Error: "relation does not exist"

**Fix:** Run the SQL schema in SQL Editor

### Realtime not working

**Fix:** Check Realtime is enabled in Dashboard → **Settings** → **API**

### File upload fails

**Fix:** 
1. Check bucket exists
2. Check storage policies
3. Verify file size < 50MB (free tier)

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Integration:** https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Realtime Guide:** https://supabase.com/docs/guides/realtime
- **Storage Guide:** https://supabase.com/docs/guides/storage
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 Migration Checklist

- [x] Install Supabase packages
- [x] Create Supabase project
- [x] Add environment variables
- [x] Run database schema
- [x] Update AuthContext
- [x] Update login/signup pages
- [x] Add middleware
- [x] Create server actions
- [ ] Run SQL schema in Supabase Dashboard
- [ ] Configure OAuth providers
- [ ] Create storage buckets
- [ ] Test authentication flow
- [ ] Test realtime features
- [ ] Deploy to Vercel

---

## 💡 Pro Tips

1. **Use Server Actions** - Keep Supabase logic server-side when possible
2. **Enable RLS** - Always protect data with Row Level Security
3. **Use Realtime** - Better UX than polling
4. **Optimize Queries** - Use `.select()` to fetch only needed columns
5. **Cache Smartly** - Use Next.js `revalidatePath()` after mutations
6. **Monitor Usage** - Check dashboard for API limits
7. **Use TypeScript** - Generate types: `npx supabase gen types typescript`

---

**Ready to go live? All the pieces are in place!** 🚀

Just run the SQL schema in your Supabase dashboard and you're ready to build the next generation of StudyBuddy with real-time collaboration, instant auth, and scalable storage!
