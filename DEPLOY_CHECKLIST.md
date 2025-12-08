# Deployment Checklist

Use this checklist to deploy your Next.js Secret Santa app.

## Pre-Deployment

### ✅ Local Testing

- [ ] Copied Supabase credentials to `.env.local`
- [ ] Configured Supabase Auth redirect URLs
- [ ] Ran `npm install` successfully
- [ ] Ran `npm run dev` successfully
- [ ] Tested login with magic link
- [ ] Tested profile save/update
- [ ] Tested admin panel access
- [ ] Tested assignment generation
- [ ] Verified 0 vulnerabilities (`npm audit`)

### ✅ Supabase Configuration

- [ ] Enabled Email provider in Auth settings
- [ ] Added `http://localhost:3000/auth/callback` to redirect URLs
- [ ] Set Site URL to `http://localhost:3000`
- [ ] Verified RLS policies exist on `participants` and `assignments` tables
- [ ] Tested that existing data loads correctly

## Deployment to Vercel

### Option 1: Via GitHub (Recommended)

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub:
  ```bash
  git init
  git add .
  git commit -m "feat: SEO Kringle Next.js app with security patches"
  git branch -M main
  git remote add origin <your-repo-url>
  git push -u origin main
  ```
- [ ] Went to [vercel.com](https://vercel.com)
- [ ] Clicked "Import Project"
- [ ] Selected repository
- [ ] Added environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_DOMAIN` (e.g., https://your-app.vercel.app)
  - `NEXT_PUBLIC_ADMIN_EMAILS`
- [ ] Clicked "Deploy"
- [ ] Deployment successful

### Option 2: Via Vercel CLI

- [ ] Installed Vercel CLI: `npm i -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Deployed: `vercel`
- [ ] Added environment variables:
  ```bash
  vercel env add NEXT_PUBLIC_SUPABASE_URL production
  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
  vercel env add SUPABASE_SERVICE_ROLE_KEY production
  vercel env add NEXT_PUBLIC_APP_DOMAIN production
  vercel env add NEXT_PUBLIC_ADMIN_EMAILS production
  ```
- [ ] Deployed to production: `vercel --prod`

## Post-Deployment

### ✅ Supabase Updates

- [ ] Added production redirect URL to Supabase Auth:
  - Go to: Auth → URL Configuration
  - Add: `https://your-app.vercel.app/auth/callback`
- [ ] Updated Site URL to production domain:
  - Set to: `https://your-app.vercel.app`
- [ ] Tested magic link login on production

### ✅ DNS Configuration (if using custom domain)

- [ ] Added custom domain in Vercel dashboard
- [ ] Added DNS records as instructed by Vercel:
  - Type: `CNAME`
  - Name: `seokringle` (or `@` for root)
  - Value: `cname.vercel-dns.com`
- [ ] Waited for DNS propagation (15 min - 48 hours)
- [ ] Verified SSL certificate issued automatically
- [ ] Updated Supabase redirect URLs with custom domain
- [ ] Updated `NEXT_PUBLIC_APP_DOMAIN` in Vercel env vars

### ✅ Production Testing

- [ ] Visited production URL
- [ ] Tested magic link login
- [ ] Verified profile page loads
- [ ] Tested profile save
- [ ] Accessed admin panel (with admin email)
- [ ] Viewed participant statistics
- [ ] Generated test assignments
- [ ] Exported CSV
- [ ] Tested logout
- [ ] Tested on mobile device
- [ ] Tested in different browsers (Chrome, Safari, Firefox)

## Monitoring

### ✅ Vercel Dashboard

- [ ] Checked deployment logs for errors
- [ ] Reviewed analytics (if available)
- [ ] Set up deployment notifications (optional)

### ✅ Supabase Dashboard

- [ ] Verified Auth users appearing in Auth → Users
- [ ] Checked Database → Table Editor for new participants
- [ ] Monitored API requests in Project Settings → API

## Rollback Plan

If something goes wrong:

- [ ] Know how to access Vercel dashboard
- [ ] Can redeploy previous version with one click
- [ ] Can point domain back to Streamlit if needed
- [ ] Have backup of Supabase credentials

## Success Criteria

✅ Application is live and accessible
✅ Magic link authentication works
✅ Users can create/update profiles
✅ Admin can view participants
✅ Admin can generate assignments
✅ No console errors in browser
✅ Mobile responsive
✅ SSL certificate active (https)
✅ 0 security vulnerabilities

## Next Steps After Deployment

### ✅ User Communication

- [ ] Drafted announcement email for participants
- [ ] Updated any documentation with new URL
- [ ] Informed admins of new admin panel location

### ✅ Optional Enhancements

- [ ] Set up email notifications for new signups
- [ ] Add assignment notification emails
- [ ] Implement sponsor management
- [ ] Add analytics tracking
- [ ] Set up error monitoring (Sentry, etc.)

## Estimated Timeline

| Task | Time |
|------|------|
| Copy environment variables | 2 minutes |
| Configure Supabase Auth | 3 minutes |
| Push to GitHub | 2 minutes |
| Deploy to Vercel | 5 minutes |
| Configure production URLs | 3 minutes |
| Testing | 5 minutes |
| **Total** | **~20 minutes** |

*Add 24-48 hours if configuring custom domain (DNS propagation)*

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Check Supabase Auth redirect URLs
5. Review [README.md](README.md) troubleshooting section

---

**Ready to deploy?** Start with local testing, then move to production! 🚀
