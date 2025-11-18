# Vami Platform - Deployment Guide

Complete guide for deploying to production using Railway (backend) and Vercel (frontend).

---

## 🎯 Deployment Architecture

```
Frontend (Vercel)
  ↓ HTTPS
Backend (Railway)
  ↓
Supabase (managed)
Stripe (managed)
ElevenLabs (managed)
```

---

## 1️⃣ RAILWAY DEPLOYMENT (Backend)

### Prerequisites

- [ ] GitHub repository with backend code
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] All environment variables from setup guide

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **Login** → **Login with GitHub**
3. Click **New Project**
4. Choose **Deploy from GitHub repo**
5. Select your repository
6. Railway will auto-detect it's a Python project

### Step 2: Configure Build Settings

Railway should auto-detect, but verify:

1. **Root Directory**: `/backend` (if backend is in subfolder)
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

If not auto-detected, create `railway.json` in backend folder (already provided).

### Step 3: Add Environment Variables

In Railway dashboard → **Variables** tab, add all these:

```bash
# Application
APP_NAME=Vami Platform
DEBUG=False
SECRET_KEY=your-production-secret-key-256-bit

# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# ElevenLabs
ELEVENLABS_API_KEY=sk_live_xxxxx  # Use production key
ELEVENLABS_WEBHOOK_SECRET=whsec_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  # Use LIVE keys for production
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER_TRIAL=price_xxxxx
STRIPE_PRICE_BASIC=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_PREMIUM=price_xxxxx

# Google Calendar
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=https://dashboard.vami.app/integrations/google/callback

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@vami.app
SENDGRID_FROM_NAME=Vami

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx

# URLs (IMPORTANT: Update these!)
FRONTEND_URL=https://dashboard.vami.app
BACKEND_URL=https://vami-backend.up.railway.app  # Your Railway URL
MARKETING_SITE_URL=https://vami.app
CORS_ORIGINS=["https://vami.app","https://dashboard.vami.app"]
```

### Step 4: Deploy

1. Railway automatically deploys on push to `main` branch
2. Watch the **Deployments** tab for progress
3. First deploy takes ~5-10 minutes
4. When complete, you'll get a URL like: `https://vami-backend.up.railway.app`

### Step 5: Configure Custom Domain (Optional)

1. In Railway project → **Settings** → **Domains**
2. Click **Generate Domain** or **Custom Domain**
3. For custom: Add DNS record at your domain provider:
   ```
   Type: CNAME
   Name: api (or backend)
   Value: your-project.up.railway.app
   ```
4. Wait for SSL to provision (~5-10 mins)

### Step 6: Update Webhooks

Now that you have your production URL, update:

#### Stripe Webhook
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click your webhook endpoint
3. Update URL to: `https://your-railway-url.up.railway.app/api/webhooks/stripe`
4. **Save**

#### ElevenLabs Webhook
1. Go to ElevenLabs → **Agent Settings** → **Webhooks**
2. Update URL to: `https://your-railway-url.up.railway.app/api/webhooks/elevenlabs`
3. **Save**

### Step 7: Health Check

Visit: `https://your-railway-url.up.railway.app/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T..."
}
```

Also check: `https://your-railway-url.up.railway.app/docs` for API documentation

---

## 2️⃣ VERCEL DEPLOYMENT (Frontend)

### Prerequisites

- [ ] GitHub repository with frontend code
- [ ] Vercel account ([vercel.com](https://vercel.com))
- [ ] Railway backend deployed and URL available

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **Login** → **Continue with GitHub**
3. Click **Add New** → **Project**
4. Select your repository
5. Vercel auto-detects Vite project

### Step 2: Configure Build Settings

Verify these settings (usually auto-detected):

- **Framework Preset**: Vite
- **Root Directory**: `/frontend` (if in subfolder)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project → **Settings** → **Environment Variables**:

```bash
VITE_API_URL=https://your-railway-url.up.railway.app
VITE_MARKETING_SITE=https://vami.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Production key
```

**Important**: Click **Production** checkbox for each variable.

### Step 4: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build
3. When complete, you'll get a URL like: `https://your-project.vercel.app`

### Step 5: Configure Custom Domain

1. In Vercel project → **Settings** → **Domains**
2. Click **Add**
3. Enter: `dashboard.vami.app`
4. Vercel provides DNS records to add:
   ```
   Type: A
   Name: dashboard
   Value: 76.76.21.21

   Type: CNAME
   Name: dashboard
   Value: cname.vercel-dns.com
   ```
5. Add these in your DNS provider (Cloudflare, etc.)
6. Wait for propagation (~10-30 mins)
7. Vercel auto-provisions SSL

### Step 6: Update Google OAuth

Since your domain changed, update redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Click your OAuth client ID
4. **Authorized redirect URIs** → Add:
   ```
   https://dashboard.vami.app/integrations/google/callback
   ```
5. **Save**

### Step 7: Update Backend CORS

In Railway, update environment variable:

```bash
CORS_ORIGINS=["https://vami.app","https://dashboard.vami.app"]
FRONTEND_URL=https://dashboard.vami.app
```

Redeploy backend for changes to take effect.

### Step 8: Test Production

1. Visit: `https://dashboard.vami.app`
2. Try registering a new user
3. Complete payment with Stripe
4. Verify agent creation
5. Test all features

---

## 3️⃣ CLOUDFLARE SETUP (DNS & CDN)

### Add Site to Cloudflare

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click **Add a Site**
3. Enter: `vami.app`
4. Choose **Free** plan
5. Cloudflare scans your existing DNS records
6. Click **Continue**
7. Update nameservers at your domain registrar

### Configure DNS Records

Add these records in Cloudflare DNS:

```
# Marketing site (WordPress)
Type: A
Name: @
Value: [Your WordPress hosting IP]
Proxy: ON (orange cloud)

Type: CNAME
Name: www
Value: vami.app
Proxy: ON

# Dashboard (Vercel)
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
Proxy: OFF (grey cloud) - Important!

# API (Railway)
Type: CNAME
Name: api
Value: your-project.up.railway.app
Proxy: OFF (grey cloud) - Important!
```

**Important**: Keep proxy OFF for dashboard and api to allow SSL from Vercel/Railway.

### Configure SSL/TLS

1. Go to **SSL/TLS** tab
2. Set encryption mode: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Enable **Automatic HTTPS Rewrites**

### Configure Security

1. **Security** → **WAF**
   - Enable managed rules
   - Set challenge passage to 30 minutes

2. **Security** → **Bots**
   - Enable **Bot Fight Mode**

3. **Firewall Rules** (optional):
   - Create rule to block traffic from certain countries
   - Rate limiting for API

---

## 4️⃣ MONITORING & ALERTS

### Railway Monitoring

1. In Railway → **Metrics** tab:
   - CPU usage
   - Memory usage
   - Network

2. **Settings** → **Notifications**:
   - Enable email alerts for deployments
   - Enable alerts for crashes

### Vercel Monitoring

1. In Vercel → **Analytics** (optional paid feature):
   - Page views
   - Performance metrics

2. **Settings** → **Notifications**:
   - Enable deployment notifications

### Supabase Monitoring

1. Go to **Database** → **Statistics**
   - Monitor connection count
   - Query performance

2. **Settings** → **Billing** → **Usage**:
   - Database size
   - Bandwidth
   - Set usage alerts

### Sentry Setup (Optional but Recommended)

1. Go to [sentry.io](https://sentry.io)
2. Create account
3. Create new project: **Vami Platform**
4. Choose **Python** for backend
5. Get DSN: `https://xxxxx@sentry.io/xxxxx`

Add to Railway environment:
```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

Create frontend project in Sentry:
Add to Vercel environment:
```bash
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 5️⃣ CONTINUOUS DEPLOYMENT

### Automatic Deployments

Both Railway and Vercel auto-deploy on push to `main` branch.

### Branch Deployments

**Vercel** automatically creates preview deployments for PRs:
- Each PR gets unique URL
- Test before merging to main

**Railway** can be configured for branch deployments:
1. **Settings** → **Deployments**
2. Enable **PR Deploy**

### Rollback

**Railway**:
1. Go to **Deployments**
2. Find previous successful deployment
3. Click **Redeploy**

**Vercel**:
1. Go to **Deployments**
2. Find previous deployment
3. Click ⋯ → **Promote to Production**

---

## 6️⃣ PRODUCTION CHECKLIST

### Before Launch

- [ ] All environment variables set to production values
- [ ] Stripe in **Live Mode** (not test mode)
- [ ] ElevenLabs production API key
- [ ] All webhooks updated to production URLs
- [ ] Google OAuth redirect URIs updated
- [ ] SendGrid domain verified (not just single sender)
- [ ] Twilio account upgraded (remove trial limits)
- [ ] Custom domains configured (dashboard.vami.app, api.vami.app)
- [ ] SSL certificates active
- [ ] CORS configured correctly
- [ ] Database backed up
- [ ] Error tracking enabled (Sentry)
- [ ] Monitoring alerts configured

### Testing in Production

- [ ] Create test account with real email
- [ ] Complete payment with real card (cancel immediately after)
- [ ] Book test appointment
- [ ] Receive email confirmation
- [ ] Receive SMS confirmation
- [ ] Make test call to ElevenLabs agent
- [ ] Verify conversation appears in dashboard
- [ ] Test team member invitation
- [ ] Test knowledge base upload
- [ ] Cancel test subscription

### Performance

- [ ] Frontend loads in < 2s
- [ ] API responses < 300ms
- [ ] Lighthouse score > 90
- [ ] Mobile responsive
- [ ] Works in Chrome, Firefox, Safari

### Security

- [ ] HTTPS everywhere
- [ ] No exposed secrets in code
- [ ] RLS enabled on all Supabase tables
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

---

## 7️⃣ SCALING CONSIDERATIONS

### When You Outgrow Free Tiers

**Railway** (Free tier: 500 hours/month):
- Upgrade to **Hobby** ($5/month)
- Or **Pro** ($20/month) for better performance

**Vercel** (Free tier: 100GB bandwidth):
- Upgrade to **Pro** ($20/month)

**Supabase** (Free tier: 500MB database):
- Upgrade to **Pro** ($25/month)

**Stripe** (No fees until you earn revenue):
- Standard: 2.9% + 30¢ per transaction

**ElevenLabs** (Depends on usage):
- Scale plan as needed

### Auto-scaling

**Railway**:
- Automatically scales based on traffic
- Set max replicas in settings

**Vercel**:
- Automatically scales on Edge Network
- No configuration needed

---

## 8️⃣ BACKUP & DISASTER RECOVERY

### Database Backups

**Supabase Pro**:
- Daily automatic backups (7-day retention)
- Point-in-time recovery

**Free tier**:
- Manual backups using pg_dump:
  ```bash
  pg_dump -h db.xxxxx.supabase.co -U postgres > backup.sql
  ```

### Code Backups

- GitHub is your source of truth
- Tag releases: `git tag v1.0.0`
- Keep production branch protected

### Recovery Plan

1. **Database failure**:
   - Restore from latest Supabase backup
   - Update connection string if needed

2. **Backend crash**:
   - Railway auto-restarts
   - Rollback to previous deployment if needed

3. **Frontend issues**:
   - Vercel rollback to previous deployment
   - Clear CDN cache

---

## ✅ DEPLOYMENT COMPLETE!

Your Vami platform is now live at:
- **Dashboard**: https://dashboard.vami.app
- **API**: https://api.vami.app
- **Marketing**: https://vami.app
- **API Docs**: https://api.vami.app/docs

### Next Steps

1. Monitor error rates for first 24 hours
2. Set up uptime monitoring (UptimeRobot, Pingdom)
3. Create runbook for common issues
4. Document incident response plan
5. Set up weekly backups schedule

---

## 🆘 TROUBLESHOOTING

### Deployment Failed

**Railway**:
- Check build logs
- Verify requirements.txt
- Check Python version (3.11+)

**Vercel**:
- Check build logs
- Verify package.json
- Check Node version

### 500 Errors in Production

- Check Railway logs
- Verify environment variables
- Check Supabase connection
- Verify Stripe webhook secret

### CORS Errors

- Verify CORS_ORIGINS includes your frontend URL
- Ensure HTTPS (not HTTP)
- Check Vercel domain matches exactly

### Webhook Not Firing

- Verify webhook URL is accessible
- Check webhook signature validation
- Test with curl or Postman
- Check Railway logs for errors

---

**Support**: If you encounter issues, check logs first:
- Railway: Click deployment → View logs
- Vercel: Click deployment → View Function Logs
- Supabase: Database → Logs

---

**Congratulations!** 🎉 Your platform is production-ready!
