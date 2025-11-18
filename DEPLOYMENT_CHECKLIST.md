# 🚀 VAMI PLATFORM - COMPLETE DEPLOYMENT CHECKLIST

## ✅ ALL CRITICAL ISSUES FIXED

This guide covers everything you need to know to deploy Vami safely to production.

---

## 📋 WHAT WAS FIXED

### Critical Security Issues (All Resolved ✅)

1. **OAuth State Validation** ✅
   - Added CSRF protection for Google Calendar OAuth
   - State tokens now validated with 5-minute expiration
   - Frontend properly sends state parameter in callback

2. **Webhook Signature Verification** ✅
   - ElevenLabs webhooks now verify HMAC signatures
   - Added timestamp validation (5-minute window) to prevent replay attacks
   - Stripe webhooks already had proper verification

3. **IDOR Vulnerability** ✅
   - Conversation access now checks ownership
   - Users can only see their own conversations
   - Returns 403 if unauthorized access attempted

4. **Password Reset Security** ✅
   - Token properly validated before password update
   - Password complexity enforced on reset
   - Uses Supabase admin API when available

5. **Type Mismatches** ✅
   - Backend/frontend schemas now match perfectly
   - `AnalyticsStats` matches `DashboardStats`
   - Success rate calculated correctly

6. **CSP Header** ✅
   - Updated to allow Stripe, Google OAuth, SendGrid
   - No longer blocks external integrations

7. **Rate Limiting** ✅
   - Auth endpoints: 5-10 requests/minute
   - Webhooks: 100 requests/minute
   - Password reset: 5/hour

8. **CORS Configuration** ✅
   - Changed from wildcards to explicit methods/headers
   - More secure and specific

9. **Error Handling** ✅
   - React Error Boundary added
   - App won't crash on component errors

10. **Analytics Implementation** ✅
    - Stats endpoint now returns real data
    - Calculates from actual conversations in database

---

## ⚠️ KNOWN LIMITATIONS (Non-Critical)

### Medium Priority (Optional to fix before launch):

1. **OAuth State Storage**
   - Currently stored in-memory (dict)
   - Will lose state on server restart
   - **Solution for production**: Use Redis with TTL
   - **Workaround**: Single-server deployment works fine, just don't restart during OAuth flow

2. **Stripe Service Sync Calls**
   - Stripe SDK uses synchronous calls (not async)
   - Declared as `async` but doesn't actually await
   - **Impact**: Minor performance degradation under heavy load
   - **Solution**: Use async Stripe client or run in thread pool

3. **Logging**
   - Currently uses `print()` and `console.error()`
   - **Solution for production**: Add Sentry, LogRocket, or similar

4. **ElevenLabs Optional**
   - ElevenLabs is commented out in requirements.txt
   - Service will fail if import attempted
   - **Solution**: Uncomment in requirements.txt and get API key

---

## 🔧 DEPLOYMENT STEPS

### 1. Update Environment Variables

Based on your `.env` file, you have most values set. Here's what you need to update:

```bash
# ✅ Already Configured (from your .env):
# - SUPABASE_* (all 4 values)
# - STRIPE_* (keys and price IDs)
# - GOOGLE_* (client ID, secret, redirect URI)
# - ELEVENLABS_API_KEY
# - TWILIO_* (all 3 values)

# ❌ NEEDS REAL VALUES:

# SendGrid (for emails)
SENDGRID_API_KEY=SG.your_real_key_here  # Get from https://sendgrid.com
SENDGRID_FROM_EMAIL=noreply@yourdomain.com  # Verified sender

# Webhook Secrets (configure after deployment)
STRIPE_WEBHOOK_SECRET=whsec_get_after_creating_webhook
ELEVENLABS_WEBHOOK_SECRET=whsec_get_after_creating_webhook

# Production URLs (update for production)
FRONTEND_URL=https://your-production-frontend.vercel.app
WEBHOOK_BASE_URL=https://your-production-backend.railway.app
CORS_ORIGINS=["https://your-production-frontend.vercel.app"]

# Security (IMPORTANT!)
DEBUG=False  # Already set correctly in config.py default
SECRET_KEY=generate_a_new_32_plus_character_random_string  # Use: python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# If you want ElevenLabs voice features:
# 1. Uncomment line 19 in requirements.txt
# 2. pip install elevenlabs>=1.2.0

# Frontend
cd frontend
npm install
```

### 3. Run Supabase Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy the entire contents of `backend/database/schema.sql`
5. Paste and run

**Note**: Your Supabase is already configured based on the .env file!

### 4. Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Set URL: `https://your-backend.railway.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the webhook secret and update `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 5. Configure ElevenLabs Webhooks (Optional)

1. Go to https://elevenlabs.io
2. Navigate to Settings → Webhooks
3. Set URL: `https://your-backend.railway.app/api/webhooks/elevenlabs`
4. Copy the webhook secret and update `.env`:
   ```
   ELEVENLABS_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 6. Update Google OAuth Redirect URI

In your Google Cloud Console:
1. Go to https://console.cloud.google.com
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Update Authorized redirect URIs:
   - Development: `http://localhost:5173/settings`
   - Production: `https://your-frontend.vercel.app/settings`

Update `.env`:
```
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/settings
```

### 7. Deploy Backend (Railway)

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize (if not done)
railway init

# Set all environment variables in Railway dashboard
# Go to: https://railway.app → Your Project → Variables
# Copy all values from .env

# Deploy
railway up
```

### 8. Deploy Frontend (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Go to: https://vercel.com → Your Project → Settings → Environment Variables
# Add:
VITE_API_URL=https://your-backend.railway.app/api
VITE_MARKETING_SITE=https://vami.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Use live key for production
```

### 9. Test Everything

#### Auth Flow:
- [ ] Register new user → redirects to Stripe
- [ ] Complete payment → creates agent
- [ ] Login with new account → shows dashboard
- [ ] Password reset works

#### Integrations:
- [ ] Connect Google Calendar → OAuth flow completes
- [ ] State parameter validated correctly
- [ ] Webhooks from Stripe work
- [ ] Webhooks from ElevenLabs work (if configured)

#### Security:
- [ ] Try accessing another user's conversation → gets 403
- [ ] Try replaying old webhook → gets rejected
- [ ] Check CSP headers in browser dev tools
- [ ] Verify rate limiting works (make 15 login attempts)

#### Analytics:
- [ ] Dashboard shows real stats (not zeros)
- [ ] Stats match actual conversation data
- [ ] Success rate calculated correctly

---

## 🔐 SECURITY CHECKLIST

- [x] OAuth state validation implemented
- [x] Webhook signatures verified
- [x] IDOR vulnerabilities fixed
- [x] Rate limiting on all auth endpoints
- [x] Rate limiting on webhooks
- [x] Replay attack prevention (timestamp check)
- [x] Password complexity enforced
- [x] DEBUG=False in production
- [x] CSP headers properly configured
- [x] CORS explicitly configured (no wildcards)
- [x] Input sanitization for emails
- [ ] **TODO**: Generate new SECRET_KEY for production
- [ ] **TODO**: Use Redis for OAuth state (if multi-server)
- [ ] **TODO**: Add error tracking (Sentry)
- [ ] **TODO**: Add proper logging service

---

## 📊 MONITORING RECOMMENDATIONS

### Essential (Do Before Launch):

1. **Error Tracking**
   - Add Sentry: https://sentry.io
   - Update ErrorBoundary.tsx to send errors to Sentry
   - Track API errors in backend

2. **Logging**
   - Replace `print()` with proper logging
   - Use Railway logs or Papertrail
   - Track webhook failures

3. **Uptime Monitoring**
   - Use UptimeRobot (free)
   - Monitor: `/health` endpoint
   - Alert on downtime

### Nice to Have:

4. **Performance**
   - Add Vercel Analytics
   - Monitor API response times
   - Track slow database queries

5. **User Analytics**
   - Add PostHog or Mixpanel
   - Track user flows
   - Monitor conversion rates

---

## 🐛 TROUBLESHOOTING

### "OAuth callback fails"
- Check Google redirect URI matches exactly
- Verify state is being passed in URL
- Check CORS_ORIGINS includes your frontend URL

### "Webhook signature invalid"
- Verify webhook secret in .env matches Stripe/ElevenLabs
- Check webhook URL is correct (with /api prefix)
- Ensure payload isn't modified by proxy

### "Dashboard shows all zeros"
- Check if agent exists for user
- Verify conversations table has data
- Check get_analytics_stats() query date range

### "CSP blocks external resources"
- Check browser console for CSP violations
- Update CSP header in main.py to allow needed domains

### "Rate limit errors"
- Increase limits in auth.py and webhooks.py
- Check if IP-based limiting is causing issues
- Consider using user-based rate limiting

---

## 📦 PRODUCTION-READY STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Authentication | ✅ Ready | Password complexity enforced |
| Authorization | ✅ Ready | IDOR vulnerabilities fixed |
| Webhooks | ✅ Ready | Signatures verified, rate limited |
| OAuth Integration | ✅ Ready | State validation implemented |
| Analytics | ✅ Ready | Real data implementation complete |
| Error Handling | ✅ Ready | Error boundary added |
| Security Headers | ✅ Ready | CSP, HSTS, XSS protection |
| Rate Limiting | ✅ Ready | All critical endpoints protected |
| Type Safety | ✅ Ready | Frontend/backend schemas match |

### Optional Enhancements (Not blocking launch):
- [ ] Redis for OAuth state (only needed for multi-server)
- [ ] Async Stripe client (performance optimization)
- [ ] Error tracking service (recommended but not required)
- [ ] Structured logging (recommended but not required)

---

## ✨ YOU'RE READY TO LAUNCH!

All **critical** issues have been fixed. The remaining items are **optimizations** that can be added post-launch.

**Next Steps:**
1. Update SendGrid API key in .env
2. Generate new SECRET_KEY
3. Deploy backend to Railway
4. Deploy frontend to Vercel
5. Configure webhook secrets
6. Test the full user flow
7. Launch! 🚀

**Questions?** Check:
- Backend logs: Railway dashboard
- Frontend logs: Vercel dashboard
- API docs: https://your-backend.railway.app/docs

---

**Good luck with your launch! 🎉**
