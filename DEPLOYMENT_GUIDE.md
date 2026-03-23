# VidyaSetu Deployment Guide

Complete guide for deploying the VidyaSetu AI-Powered Learning Management System to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Supabase Setup](#supabase-setup)
4. [Database Migration](#database-migration)
5. [Build Process](#build-process)
6. [Deployment Platforms](#deployment-platforms)
7. [Jitsi Token Server Deployment](#jitsi-token-server-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts and Services

- **Supabase Account**: [https://supabase.com](https://supabase.com)
- **Google Cloud Account**: For Gemini AI API access
- **Jitsi JaaS Account**: [https://jaas.8x8.vc](https://jaas.8x8.vc)
- **Deployment Platform**: Vercel, Netlify, or similar
- **Node.js Server**: For Jitsi token server (VPS, Railway, Render, etc.)

### Local Development Requirements

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### API Keys and Credentials Checklist

Before deployment, ensure you have:

- [ ] Supabase Project URL
- [ ] Supabase Anon Key
- [ ] Google Gemini API Key
- [ ] Jitsi App ID (vpaas-magic-cookie-...)
- [ ] Jitsi Key ID
- [ ] Jitsi Private Key (PEM format)

---

## Environment Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI
VITE_GEMINI_API_KEY=your-gemini-api-key

# Jitsi Configuration (Frontend - Optional)
VITE_JITSI_APP_ID=your-jitsi-app-id
VITE_JITSI_JWT_SECRET=your-jwt-secret

# Jitsi Token Server Configuration
TOKEN_PORT=3002
JITSI_APP_ID=vpaas-magic-cookie-xxxxx
JITSI_KEY_ID=vpaas-magic-cookie-xxxxx/key-id
JITSI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### Getting API Keys

#### 1. Supabase Setup

1. Create a new project at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings** → **API**
3. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public Key → `VITE_SUPABASE_ANON_KEY`

#### 2. Google Gemini API

1. Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key → `VITE_GEMINI_API_KEY`

#### 3. Jitsi JaaS Credentials

1. Sign up at [https://jaas.8x8.vc](https://jaas.8x8.vc)
2. Create a new app
3. Navigate to **Credentials**
4. Copy:
   - App ID → `JITSI_APP_ID`
   - Key ID → `JITSI_KEY_ID`
   - Download Private Key → `JITSI_PRIVATE_KEY`

**Important**: Format the private key as a single-line string with `\n` for newlines:

```bash
JITSI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----"
```

### Environment-Specific Configuration

#### Development

```bash
# .env.development
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
VITE_GEMINI_API_KEY=dev-gemini-key
TOKEN_PORT=3002
```

#### Production

```bash
# .env.production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_GEMINI_API_KEY=prod-gemini-key
TOKEN_PORT=3002
```

---

## Supabase Setup

### 1. Create Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Configure:
   - **Name**: VidyaSetu Production
   - **Database Password**: Strong password (save securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Select appropriate tier

### 2. Configure Authentication

1. Navigate to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

#### Email Template Customization

Go to **Authentication** → **Email Templates** and customize:

```html
<!-- Confirmation Email -->
<h2>Confirm your VidyaSetu account</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

### 3. Configure Storage Buckets

Storage buckets are created automatically by the schema migration, but verify:

1. Navigate to **Storage**
2. Verify buckets exist:
   - `materials` - Course materials (2GB limit)
   - `avatars` - User avatars (50MB limit)
3. Buckets should be **public** for read access

### 4. Configure Realtime

1. Navigate to **Database** → **Replication**
2. Ensure `direct_messages` table is enabled for realtime
3. This is handled by the schema but verify it's active

---

## Database Migration

### Step 1: Access SQL Editor

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Run Schema Migration

Copy the entire contents of `server/schema.sql` and execute it in the SQL Editor.

**Important**: The schema includes:
- Table creation with proper indexes
- Row-Level Security (RLS) policies
- Database functions and triggers
- Storage bucket configuration
- Realtime publication setup

### Step 3: Verify Migration

Run these verification queries:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Expected tables:
- profiles
- courses
- quizzes
- quiz_assignments
- quiz_attempts
- forum_categories
- forum_threads
- forum_posts
- mentorship_requests
- tutoring_sessions
- direct_messages
- activity_logs
- user_progress

### Step 4: Seed Initial Data (Optional)

Create forum categories:

```sql
INSERT INTO public.forum_categories (name, description, icon) VALUES
('General Discussion', 'General topics and announcements', '💬'),
('Course Help', 'Get help with course materials', '📚'),
('Technical Support', 'Technical issues and bugs', '🔧'),
('Feature Requests', 'Suggest new features', '💡');
```

Create admin user (after first signup):

```sql
-- Update a user's role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@vidyasetu.com';
```

---

## Build Process

### Local Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Build Output

The build process creates a `dist/` directory containing:
- `index.html` - Entry point
- `assets/` - Bundled JS, CSS, and static assets
- Optimized and minified code

### Build Optimization Tips

#### 1. Reduce Bundle Size

Check bundle size:

```bash
npm run build -- --mode production
```

Analyze bundle:

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});
```

#### 2. Environment-Specific Builds

```bash
# Development build
npm run build -- --mode development

# Production build
npm run build -- --mode production
```

#### 3. Code Splitting

Vite automatically code-splits by route. Verify in `dist/assets/`:
- Each page should have its own chunk
- Shared dependencies in vendor chunks

### Build Verification Checklist

- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] Bundle size is reasonable (<2MB total)
- [ ] Environment variables are correctly embedded
- [ ] Source maps are generated (for debugging)

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

#### Prerequisites
- Vercel account
- GitHub repository with your code

#### Deployment Steps

1. **Connect Repository**
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository

2. **Configure Project**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Add Environment Variables**
   - Go to **Settings** → **Environment Variables**
   - Add all variables from `.env`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GEMINI_API_KEY`
     - `VITE_JITSI_APP_ID`
     - `VITE_JITSI_JWT_SECRET`

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Custom Domain Setup

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### Vercel Configuration File

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

#### Deployment Steps

1. **Connect Repository**
   - Go to [https://app.netlify.com/start](https://app.netlify.com/start)
   - Connect to GitHub
   - Select repository

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Add Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add all `VITE_*` variables

4. **Deploy**
   - Click **Deploy site**
   - Site will be live at `https://random-name.netlify.app`

#### Netlify Configuration File

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Option 3: Self-Hosted (Nginx)

#### Prerequisites
- Ubuntu/Debian server with root access
- Domain name pointed to server IP
- Nginx installed

#### Deployment Steps

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Upload to Server**
   ```bash
   scp -r dist/* user@your-server:/var/www/vidyasetu/
   ```

3. **Configure Nginx**

Create `/etc/nginx/sites-available/vidyasetu`:

```nginx
server {
    listen 80;
    server_name vidyasetu.com www.vidyasetu.com;
    root /var/www/vidyasetu;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

4. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/vidyasetu /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d vidyasetu.com -d www.vidyasetu.com
   ```

---

## Jitsi Token Server Deployment

The Jitsi token server (`server/token-server.js`) must be deployed separately as it's a Node.js backend service.

### Option 1: Railway

1. **Create Railway Account**
   - Go to [https://railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your repository
   - Railway will auto-detect Node.js

3. **Configure Start Command**
   - Go to **Settings** → **Deploy**
   - Set start command: `node server/token-server.js`

4. **Add Environment Variables**
   ```
   TOKEN_PORT=3002
   JITSI_APP_ID=vpaas-magic-cookie-xxxxx
   JITSI_KEY_ID=vpaas-magic-cookie-xxxxx/key-id
   JITSI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

5. **Get Public URL**
   - Railway provides a public URL: `https://your-app.railway.app`
   - Update frontend to use this URL for token requests

### Option 2: Render

1. **Create Render Account**
   - Go to [https://render.com](https://render.com)

2. **Create Web Service**
   - Click **New** → **Web Service**
   - Connect GitHub repository

3. **Configure Service**
   ```
   Name: vidyasetu-token-server
   Environment: Node
   Build Command: npm install
   Start Command: node server/token-server.js
   ```

4. **Add Environment Variables**
   - Add all `JITSI_*` and `TOKEN_PORT` variables

5. **Deploy**
   - Service will be available at `https://vidyasetu-token-server.onrender.com`

### Option 3: VPS (Self-Hosted)

1. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Upload Server Code**
   ```bash
   scp -r server/ user@your-server:/opt/vidyasetu-token-server/
   ```

3. **Install Dependencies**
   ```bash
   cd /opt/vidyasetu-token-server
   npm install
   ```

4. **Create .env File**
   ```bash
   nano .env
   # Add JITSI_* variables
   ```

5. **Setup PM2 for Process Management**
   ```bash
   sudo npm install -g pm2
   pm2 start server/token-server.js --name vidyasetu-token
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx Reverse Proxy**

Add to Nginx config:

```nginx
location /api/jitsi-token {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Update Frontend Configuration

After deploying the token server, update the frontend to use the production URL:

In `pages/common/TutoringRoom.tsx`, update the token fetch URL:

```typescript
const TOKEN_SERVER_URL = import.meta.env.PROD 
  ? 'https://your-token-server.railway.app/api/jitsi-token'
  : 'http://localhost:3002/api/jitsi-token';
```

Or add to environment variables:

```bash
VITE_TOKEN_SERVER_URL=https://your-token-server.railway.app
```

---

## Post-Deployment Verification

### 1. Frontend Verification

#### Health Check Endpoints

Visit your deployed URL and verify:

- [ ] Homepage loads without errors
- [ ] Login page is accessible
- [ ] Registration page is accessible
- [ ] No console errors in browser DevTools

#### Authentication Flow

1. Register a new account
2. Verify email confirmation (if enabled)
3. Log in with credentials
4. Verify redirect to appropriate dashboard
5. Log out and verify session cleared

#### Role-Based Access

Test each role:

**Student**:
- [ ] Can access student dashboard
- [ ] Cannot access mentor/admin pages
- [ ] Can view available courses
- [ ] Can enroll in courses

**Mentor**:
- [ ] Can access mentor dashboard
- [ ] Cannot access admin pages
- [ ] Can create courses
- [ ] Can generate quizzes with AI

**Admin**:
- [ ] Can access admin dashboard
- [ ] Can view all users
- [ ] Can access analytics
- [ ] Can moderate content

### 2. Database Verification

Run these queries in Supabase SQL Editor:

```sql
-- Check user profiles
SELECT COUNT(*), role FROM profiles GROUP BY role;

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check storage buckets
SELECT * FROM storage.buckets;
```

### 3. API Integration Verification

#### Google Gemini AI

Test quiz generation:
1. Log in as mentor
2. Navigate to Quiz Management
3. Click "Generate with AI"
4. Enter a topic
5. Verify questions are generated

#### Jitsi Token Server

Test tutoring room:
1. Create a tutoring session
2. Join the session
3. Verify Jitsi room loads
4. Check video/audio works

### 4. Performance Verification

Use Lighthouse in Chrome DevTools:

```bash
# Target scores
Performance: >90
Accessibility: >90
Best Practices: >90
SEO: >90
```

Check key metrics:
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.8s
- Cumulative Layout Shift (CLS): <0.1

### 5. Security Verification

- [ ] HTTPS is enabled
- [ ] Environment variables are not exposed in client
- [ ] RLS policies are enforced
- [ ] CORS is properly configured
- [ ] API keys are not in source code

### Verification Checklist

```bash
# Complete Post-Deployment Checklist

## Frontend
- [ ] Site loads on production URL
- [ ] No console errors
- [ ] All routes accessible
- [ ] Assets load correctly (images, fonts, icons)

## Authentication
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Session persistence works
- [ ] Role-based access control works

## Features
- [ ] Course creation works (mentor)
- [ ] Quiz generation works (AI)
- [ ] Forum posting works
- [ ] Tutoring room loads (Jitsi)
- [ ] File uploads work (materials, avatars)

## Database
- [ ] All tables exist
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Functions working

## Performance
- [ ] Page load <2s
- [ ] Lighthouse score >90
- [ ] No memory leaks
- [ ] Mobile responsive

## Security
- [ ] HTTPS enabled
- [ ] Secrets not exposed
- [ ] CORS configured
- [ ] Input validation working
```

---

## Rollback Procedures

### Vercel Rollback

1. Go to **Deployments** in Vercel dashboard
2. Find the last working deployment
3. Click **⋯** → **Promote to Production**
4. Confirm rollback

### Netlify Rollback

1. Go to **Deploys** in Netlify dashboard
2. Find the last working deploy
3. Click **Publish deploy**
4. Confirm rollback

### Database Rollback

**Warning**: Database rollbacks are complex. Always backup before migrations.

#### Backup Current State

```sql
-- Export all data
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

#### Restore from Backup

1. Go to Supabase Dashboard → **Database** → **Backups**
2. Select a backup point
3. Click **Restore**
4. Confirm restoration

#### Manual Rollback

If you need to undo specific changes:

```sql
-- Example: Remove a new column
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column;

-- Example: Restore old RLS policy
DROP POLICY IF EXISTS "new_policy" ON profiles;
CREATE POLICY "old_policy" ON profiles FOR SELECT USING (true);
```

### Environment Variable Rollback

1. Go to platform settings (Vercel/Netlify)
2. Navigate to **Environment Variables**
3. Update variables to previous values
4. Redeploy

### Token Server Rollback

#### Railway/Render

1. Go to **Deployments**
2. Select previous working deployment
3. Click **Redeploy**

#### Self-Hosted (PM2)

```bash
# Stop current version
pm2 stop vidyasetu-token

# Restore from backup
cd /opt/vidyasetu-token-server
git checkout <previous-commit>
npm install

# Restart
pm2 restart vidyasetu-token
```

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Error**: `Module not found` or `Cannot resolve module`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: TypeScript errors during build

**Solution**:
```bash
# Check for type errors
npx tsc --noEmit

# Fix errors or temporarily skip
npm run build -- --mode production --no-typecheck
```

#### 2. Environment Variables Not Working

**Symptoms**: API calls fail, "undefined" in console

**Solution**:
- Verify all `VITE_*` variables are set in deployment platform
- Redeploy after adding variables
- Check variables are prefixed with `VITE_`
- Verify no typos in variable names

**Debug**:
```typescript
// Add to App.tsx temporarily
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Gemini Key exists:', !!import.meta.env.VITE_GEMINI_API_KEY);
```

#### 3. Supabase Connection Fails

**Error**: `Failed to fetch` or `Network error`

**Solution**:
- Verify Supabase URL is correct
- Check anon key is valid
- Verify Supabase project is not paused
- Check CORS settings in Supabase dashboard

**Test connection**:
```typescript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase.from('profiles').select('count');
console.log('Connection test:', { data, error });
```

#### 4. RLS Policy Blocks Queries

**Error**: `new row violates row-level security policy`

**Solution**:
```sql
-- Check which policies are active
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for debugging (NOT for production)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

#### 5. Jitsi Room Not Loading

**Symptoms**: Blank screen, "Failed to load room"

**Solution**:
- Verify token server is running
- Check token server URL is correct
- Verify Jitsi credentials are valid
- Check CORS on token server

**Debug token server**:
```bash
# Test token generation
curl "http://localhost:3002/api/jitsi-token?room=test&name=User&email=user@test.com&id=123&role=student"
```

#### 6. AI Quiz Generation Fails

**Error**: `Failed to generate quiz` or `API key invalid`

**Solution**:
- Verify Gemini API key is valid
- Check API quota/limits
- Verify API is enabled in Google Cloud Console
- Check network connectivity

**Test Gemini API**:
```typescript
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const result = await model.generateContent('Test prompt');
console.log(result.response.text());
```

#### 7. File Upload Fails

**Error**: `Failed to upload file` or `Storage error`

**Solution**:
- Verify storage buckets exist in Supabase
- Check bucket policies allow uploads
- Verify file size is within limits
- Check file type is allowed

**Debug**:
```sql
-- Check bucket configuration
SELECT * FROM storage.buckets;

-- Check storage policies
SELECT * FROM storage.policies;
```

#### 8. Slow Performance

**Symptoms**: Pages load slowly, high Time to Interactive

**Solution**:
- Enable gzip compression on server
- Optimize images (use WebP format)
- Implement code splitting
- Add caching headers
- Use CDN for static assets

**Check bundle size**:
```bash
npm run build
ls -lh dist/assets/
```

#### 9. Mobile Layout Issues

**Symptoms**: UI broken on mobile, elements overflow

**Solution**:
- Test on actual devices
- Use Chrome DevTools mobile emulation
- Verify Tailwind responsive classes
- Check viewport meta tag in index.html

**Verify viewport**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 10. Session Expires Too Quickly

**Symptoms**: Users logged out frequently

**Solution**:

Configure Supabase Auth settings:
1. Go to **Authentication** → **Settings**
2. Adjust **JWT expiry**: 3600 (1 hour) or higher
3. Enable **Refresh token rotation**

### Debug Mode

Enable debug logging:

```typescript
// lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      debug: true // Enable auth debug logs
    }
  }
);
```

### Getting Help

If issues persist:

1. **Check Logs**:
   - Vercel: **Deployments** → **Functions** → **Logs**
   - Netlify: **Deploys** → **Deploy log**
   - Supabase: **Logs** → **Postgres Logs**

2. **Community Support**:
   - Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
   - Vite Discord: [https://chat.vitejs.dev](https://chat.vitejs.dev)

3. **Documentation**:
   - Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
   - Vite Docs: [https://vitejs.dev](https://vitejs.dev)
   - React Router Docs: [https://reactrouter.com](https://reactrouter.com)

---

## Production Best Practices

### Security

1. **Never commit secrets**: Use `.gitignore` for `.env`
2. **Rotate API keys**: Regularly update production keys
3. **Enable 2FA**: On all service accounts
4. **Monitor logs**: Set up alerts for suspicious activity
5. **Regular backups**: Automate database backups

### Performance

1. **CDN**: Use Vercel/Netlify CDN for static assets
2. **Caching**: Implement proper cache headers
3. **Compression**: Enable gzip/brotli
4. **Image optimization**: Use WebP, lazy loading
5. **Code splitting**: Leverage Vite's automatic splitting

### Monitoring

1. **Error tracking**: Integrate Sentry or similar
2. **Analytics**: Add Google Analytics or Plausible
3. **Uptime monitoring**: Use UptimeRobot or Pingdom
4. **Performance monitoring**: Use Lighthouse CI

### Maintenance

1. **Regular updates**: Keep dependencies updated
2. **Security patches**: Apply immediately
3. **Database maintenance**: Regular VACUUM and ANALYZE
4. **Log rotation**: Prevent log files from growing too large
5. **Backup testing**: Regularly test restore procedures

---

## Conclusion

This guide covers the complete deployment process for VidyaSetu. Follow each section carefully and use the verification checklists to ensure a successful deployment.

For additional support, refer to the project documentation:
- `DATABASE_SCHEMA.md` - Database structure
- `AUTHENTICATION_FLOW.md` - Auth implementation
- `API_DOCUMENTATION.md` - API reference
- `COMPONENT_LIBRARY.md` - UI components

**Happy Deploying! 🚀**
