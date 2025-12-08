# Quick Setup Guide

## Step 1: Copy Supabase Credentials

From your existing Streamlit app, you already have Supabase set up. Copy the credentials:

```bash
# Copy from your old .env file
cp "../secret santa/.env" ".env.local.backup"

# Then extract and update the new .env.local with these values:
# - NEXT_PUBLIC_SUPABASE_URL (same as SUPABASE_URL)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (from SUPABASE_ANON_KEY)
# - SUPABASE_SERVICE_ROLE_KEY (same as before)
# - NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
# - NEXT_PUBLIC_ADMIN_EMAILS=admin@seokringle.com
```

## Step 2: Update .env.local

Edit `.env.local` with your actual Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://cnqujbaulqpgkuowwcwc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAILS=admin@seokringle.com
```

## Step 3: Database is Already Set Up!

Your Supabase database already has the `participants` and `assignments` tables from the Streamlit app. No migration needed!

## Step 4: Configure Supabase Auth

The only new thing is Supabase Auth (replaces your custom magic links):

1. Go to https://supabase.com/dashboard/project/cnqujbaulqpgkuowwcwc/auth/providers
2. Enable "Email" provider (should already be enabled)
3. Go to URL Configuration: https://supabase.com/dashboard/project/cnqujbaulqpgkuowwcwc/auth/url-configuration
4. Add redirect URL: `http://localhost:3000/auth/callback`
5. Set Site URL to: `http://localhost:3000`

## Step 5: Run the App

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Step 6: Test Login

1. Enter your email (admin@seokringle.com)
2. Check your email for the magic link
3. Click the link
4. You should be redirected to the profile page
5. Navigate to Admin Panel

## Step 7: Deploy to Vercel (when ready)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_DOMAIN production
vercel env add NEXT_PUBLIC_ADMIN_EMAILS production

# Deploy to production
vercel --prod
```

After deployment:
- Update Supabase Auth redirect URLs to include your production domain
- Update `NEXT_PUBLIC_APP_DOMAIN` to your production URL

## Differences from Streamlit Version

### ✅ Improvements

- **Proper Authentication**: Supabase Auth instead of custom JWT magic links
- **Better UX**: No page reloads, smooth React transitions
- **Type Safety**: Full TypeScript with type checking
- **Modern UI**: Professional Tailwind CSS design
- **Production Ready**: Optimized builds, middleware, proper session handling
- **Scalable**: Vercel edge functions, automatic scaling
- **Security**: 0 vulnerabilities, patched Next.js 16.0.7

### 🔄 Same Features

- All existing participants/assignments data preserved
- Same matching algorithm (ported to TypeScript)
- Same admin functionality
- Same database structure
- Same email (admin@seokringle.com)

### 🎯 New Features

- Automatic session refresh via middleware
- Better error handling and user feedback
- Responsive design works on mobile
- CSV export with proper formatting
- Protected routes with automatic redirect
