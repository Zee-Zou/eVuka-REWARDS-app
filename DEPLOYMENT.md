# Deployment Guide

This guide explains how to set up automated deployment for the eVuka REWARDS app.

## Overview

The app uses GitHub Actions for CI/CD with automatic deployment to Netlify:
- **Production**: Deploys automatically when code is pushed to `main` branch
- **Preview**: Creates preview deployments for all pull requests

## Prerequisites

1. **GitHub Repository**: Code must be hosted on GitHub
2. **Netlify Account**: Free account at [netlify.com](https://netlify.com)
3. **Node.js 22+**: For local development and testing

## Setup Instructions

### 1. Create Netlify Site

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. **Important**: Do NOT connect to GitHub yet (we'll use GitHub Actions instead)
4. Skip the build settings
5. Once created, note down your **Site ID** from Settings → General → Site details

### 2. Get Netlify Auth Token

1. Go to [Netlify User Settings](https://app.netlify.com/user/applications)
2. Scroll to "Personal access tokens"
3. Click "New access token"
4. Give it a description like "GitHub Actions Deploy"
5. Copy the generated token (you won't be able to see it again!)

### 3. Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret" and add:

   - **Name**: `NETLIFY_AUTH_TOKEN`
   - **Value**: The token you copied in step 2

4. Click "New repository secret" again and add:

   - **Name**: `NETLIFY_SITE_ID`
   - **Value**: Your Site ID from step 1

### 4. Configure Environment Variables

Update your `.env` file with production values:

```bash
# Production Supabase
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# WebSocket URL (production)
VITE_WEBSOCKET_URL=https://your-production-websocket.com

# Production environment
VITE_ENVIRONMENT=production
```

**Important**: Never commit `.env` file! It's in `.gitignore` for security.

## Deployment Workflows

### Production Deployment

Triggered automatically when you push to `main`:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**What happens:**
1. ✅ Tests run
2. ✅ Linting checks
3. ✅ Build creation
4. ✅ Deploy to Netlify production
5. ✅ Smoke tests
6. ✅ Commit comment with deployment URL

### Preview Deployment

Triggered automatically for pull requests:

```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add feature"
git push origin feature/my-feature
# Create PR on GitHub
```

**What happens:**
1. ✅ Build creation
2. ✅ Deploy to Netlify preview URL
3. ✅ Comment on PR with preview link
4. ✅ Each PR gets unique URL: `https://pr-123--evuka-rewards.netlify.app`

### Manual Deployment

If you need to deploy manually:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables configured in Netlify
- [ ] Supabase RLS policies enabled
- [ ] Service keys NOT exposed in client bundle
- [ ] Security headers configured
- [ ] Error monitoring enabled (Sentry, etc.)

## Environment Variables in Netlify

After deployment, configure environment variables in Netlify:

1. Go to Netlify site dashboard
2. **Site settings** → **Environment variables**
3. Add all `VITE_*` variables from `.env.example`
4. **Important**: Do NOT add `SUPABASE_SERVICE_KEY` - it should never be in client code!

Example variables to add:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WEBSOCKET_URL=https://...
VITE_ENABLE_OCR=true
VITE_ENVIRONMENT=production
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

**Push Notifications Setup:**
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add public key to Netlify: `VITE_VAPID_PUBLIC_KEY`
3. Store private key as secret (for backend): `VAPID_PRIVATE_KEY`
4. Create Supabase table for push subscriptions:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

## Build Settings

Netlify will use these settings (configured in `netlify.toml` or via GitHub Actions):

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 22.x

## Troubleshooting

### Build Fails in CI

**Error**: "Tests failed"
- **Fix**: Run `npm test` locally and fix failing tests

**Error**: "Node version mismatch"
- **Fix**: Ensure Netlify is using Node 22+ in build settings

### Deployment Fails

**Error**: "NETLIFY_AUTH_TOKEN not found"
- **Fix**: Verify secret is added in GitHub Settings → Secrets

**Error**: "Site not found"
- **Fix**: Verify `NETLIFY_SITE_ID` matches your Netlify site

### Preview Not Working

**Error**: PR preview not deployed
- **Fix**: Check workflow runs in GitHub Actions tab
- **Fix**: Ensure PR is targeting `main` branch

### Site Loads But Features Broken

**Error**: "Supabase connection failed"
- **Fix**: Add environment variables in Netlify dashboard
- **Fix**: Verify Supabase URL and anon key are correct

**Error**: "WebSocket connection failed"
- **Fix**: Update `VITE_WEBSOCKET_URL` in Netlify environment variables

## Monitoring Deployments

### GitHub Actions

View deployment status:
1. Go to repository → **Actions** tab
2. Click on workflow run
3. View logs for each step
4. Check deployment URL in comments

### Netlify Dashboard

View deployment details:
1. Go to [Netlify dashboard](https://app.netlify.com)
2. Click on your site
3. **Deploys** tab shows all deployments
4. Click on a deploy to see build logs

## Rollback

If you need to rollback to a previous version:

### Via Netlify (Recommended)

1. Go to Netlify → **Deploys**
2. Find the working deploy
3. Click **Publish deploy**

### Via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force  # ⚠️ Use with caution!
```

## Performance Optimization

After deployment, check:
- **Lighthouse score**: Should be > 90
- **Bundle size**: Initial JS < 300KB
- **Time to Interactive**: < 5s
- **First Contentful Paint**: < 1.5s

Tools:
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://www.npmjs.com/package/vite-bundle-visualizer)

## Security Post-Deployment

Verify:
- [ ] HTTPS enforced (Netlify does this automatically)
- [ ] CSP headers active
- [ ] No service keys in bundle: `grep -r "service.*key" dist/`
- [ ] Environment variables not leaked in source maps

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Check Netlify deploy logs
3. Review this deployment guide
4. Check `.env.example` for required variables

---

**Last Updated**: 2026-02-12
**Deployment Platform**: Netlify
**CI/CD**: GitHub Actions
