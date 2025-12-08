# SEO Kringle - Secret Santa 🎅

A modern Next.js application for managing the SEO Community Secret Santa gift exchange with mentor-based matching.

## 🔒 Security

This project uses **patched versions** to address known vulnerabilities:

- **Next.js 16.0.7** (patched for CVE-2025-55182)
- **React 19.0.0** (secure version)
- **Supabase SSR** (latest secure authentication)

All dependencies are audited with **0 vulnerabilities**.

## ✨ Features

- **Secure Authentication**: Magic link login via Supabase Auth (no passwords!)
- **User Profiles**: Rich profile system with expertise levels, pledges, and wishlists
- **Smart Matching**: Algorithm prioritizes Senior SEOs mentoring Juniors
- **Admin Dashboard**:
  - Participant statistics and expertise breakdown
  - One-click assignment generation
  - CSV export for participant data
- **Modern UI**: Built with Tailwind CSS for a clean, responsive design
- **Production Ready**: Optimized for Vercel deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- npm or yarn

### 1. Clone and Install

```bash
cd secret-santa-nextjs
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)

2. Create the `participants` table:

```sql
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  linkedin_url TEXT,
  website_url TEXT,
  bio TEXT,
  address TEXT,
  pledge TEXT NOT NULL,
  expertise_level TEXT CHECK (expertise_level IN ('Junior', 'Mid', 'Senior')),
  wishlist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

3. Create the `assignments` table:

```sql
CREATE TABLE assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

4. Enable Row Level Security (RLS):

```sql
-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all participants
CREATE POLICY "Allow authenticated read" ON participants
  FOR SELECT TO authenticated USING (true);

-- Allow users to insert/update their own profile
CREATE POLICY "Allow user insert own" ON participants
  FOR INSERT TO authenticated WITH CHECK (auth.email() = email);

CREATE POLICY "Allow user update own" ON participants
  FOR UPDATE TO authenticated USING (auth.email() = email);

-- Assignments: authenticated users can read their own
CREATE POLICY "Allow authenticated read own assignment" ON assignments
  FOR SELECT TO authenticated USING (giver_email = auth.email());

-- Service role can do anything (for admin operations)
-- This is handled via the service_role_key in server-side code
```

5. Configure Supabase Auth:

- Go to Authentication → Settings
- Enable "Email" provider
- Configure email templates (optional)
- Set Site URL to `http://localhost:3000` (for dev) or your production URL

### 3. Configure Environment Variables

Create `.env.local`:

```bash
# Get these from Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAILS=admin@seokringle.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment to Vercel

### Option 1: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project" and select your repository
4. Configure environment variables in Vercel dashboard
5. Deploy!

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_DOMAIN
vercel env add NEXT_PUBLIC_ADMIN_EMAILS

# Deploy to production
vercel --prod
```

### Post-Deployment

1. Update Supabase Auth Settings:
   - Go to Authentication → URL Configuration
   - Add your production URL to "Redirect URLs"
   - Update Site URL to your production domain

2. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_DOMAIN=https://your-app.vercel.app
   ```

## 🎯 How It Works

### Matching Algorithm

The Secret Santa matching algorithm implements a mentorship-based approach:

1. **Expertise Separation**: Participants are categorized as Junior, Mid, or Senior
2. **Priority Matching**: Senior SEOs are prioritized to give to Junior SEOs
3. **Derangement**: Remaining participants are matched ensuring no self-assignment
4. **Retry Logic**: Up to 100 attempts to find a valid matching

### Authentication Flow

1. User enters email on login page
2. Supabase sends magic link to email
3. User clicks link → redirected to `/auth/callback`
4. Session established → redirected to `/profile`
5. Middleware protects routes and refreshes sessions

### Admin Access

Set admin emails in `NEXT_PUBLIC_ADMIN_EMAILS` (comma-separated):

```bash
NEXT_PUBLIC_ADMIN_EMAILS=admin@seokringle.com,other-admin@example.com
```

Admins get access to:
- Participant statistics
- Assignment generation
- CSV export
- Assignment viewing

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.7 (React 19.0.0)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Links)
- **Deployment**: Vercel
- **Email**: Supabase (built-in email sending)

## 📁 Project Structure

```
secret-santa-nextjs/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts       # Auth callback handler
│   ├── profile/
│   │   └── page.tsx           # User profile form
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Login page
├── lib/
│   ├── supabase.ts            # Supabase clients
│   └── matching.ts            # Matching algorithm
├── middleware.ts              # Auth middleware
└── .env.local                 # Environment variables
```

## 🔐 Security Best Practices

1. **Never commit secrets**: `.env.local` is gitignored
2. **Use service role key server-side only**: Admin operations use service role key on server
3. **RLS enabled**: Row Level Security protects database
4. **Session management**: Middleware refreshes sessions automatically
5. **Patched dependencies**: All packages are up-to-date and security-audited

## 🎨 Customization

### Colors

Edit `tailwind.config.ts` to customize the color scheme:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

### Email Templates

Configure email templates in Supabase Dashboard → Authentication → Email Templates

## 🐛 Troubleshooting

### "Failed to send magic link"

- Check Supabase email provider is enabled
- Verify email in Supabase Auth settings
- Check spam folder

### "Authentication failed"

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check redirect URLs in Supabase Auth settings
- Clear browser cookies and try again

### "Failed to save profile"

- Check database permissions (RLS policies)
- Verify service role key is correct
- Check browser console for detailed errors

### "Admin panel not accessible"

- Verify your email is in `NEXT_PUBLIC_ADMIN_EMAILS`
- Make sure it's comma-separated for multiple admins
- Restart dev server after changing env vars

## 📝 License

MIT

## 🤝 Contributing

This is a community project for the SEO Community. Contributions welcome!

---

Built with ❤️ for the SEO Community
