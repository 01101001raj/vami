# Deployment Checklist

## Pre-Deployment

### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run SQL schema from `backend/database/schema.sql`
- [ ] Enable Row Level Security (RLS)
- [ ] Copy credentials (URL, keys, JWT secret)
- [ ] Configure email templates (optional)

### 2. Stripe Setup
- [ ] Create Stripe account
- [ ] Switch to production mode
- [ ] Create 4 products with pricing:
  - Starter Trial: $99/mo (14-day trial)
  - Basic: $499/mo
  - Professional: $997/mo
  - Premium: $2,500/mo
- [ ] Copy production API keys
- [ ] Copy price IDs
- [ ] Set up webhook endpoint
- [ ] Copy webhook signing secret

### 3. ElevenLabs Setup
- [ ] Create ElevenLabs account
- [ ] Copy production API key
- [ ] Set up webhook endpoint
- [ ] Copy webhook secret

### 4. Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URIs
- [ ] Copy client ID and secret

### 5. SendGrid Setup
- [ ] Create SendGrid account
- [ ] Verify sender domain
- [ ] Create API key
- [ ] Design email templates (optional)

### 6. Twilio Setup
- [ ] Create Twilio account
- [ ] Purchase phone number
- [ ] Copy Account SID and Auth Token

## Backend Deployment (Railway)

### 1. Prepare Railway
```bash
npm install -g @railway/cli
railway login
```

### 2. Create New Project
```bash
cd backend
railway init
```

### 3. Set Environment Variables
In Railway dashboard, add all variables from `.env.example`:
- `APP_NAME`
- `SECRET_KEY`
- `DEBUG=False`
- All Supabase variables
- All Stripe variables
- All ElevenLabs variables
- All Google Calendar variables
- All SendGrid variables
- All Twilio variables
- `FRONTEND_URL` (your Vercel URL)
- `CORS_ORIGINS` (JSON array with your frontend URL)

### 4. Deploy
```bash
railway up
```

### 5. Get Deployment URL
```bash
railway domain
```
Note this URL for frontend configuration.

### 6. Configure Webhooks
Update webhook URLs in:
- Stripe dashboard: `https://your-api.railway.app/api/webhooks/stripe`
- ElevenLabs dashboard: `https://your-api.railway.app/api/webhooks/elevenlabs`

## Frontend Deployment (Vercel)

### 1. Prepare Vercel
```bash
npm install -g vercel
```

### 2. Deploy
```bash
cd frontend
vercel
```

### 3. Set Environment Variables
In Vercel dashboard > Settings > Environment Variables:
- `VITE_API_URL` = `https://your-api.railway.app/api`
- `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- `VITE_MARKETING_SITE` = `https://vami.app`

### 4. Redeploy
```bash
vercel --prod
```

### 5. Configure Custom Domain (Optional)
- Add domain in Vercel dashboard
- Update DNS records
- Enable SSL

## Post-Deployment

### 1. Test Authentication
- [ ] Register new user
- [ ] Complete Stripe checkout
- [ ] Verify email confirmation
- [ ] Login with new account

### 2. Test Agent Creation
- [ ] Check ElevenLabs dashboard for new agent
- [ ] Verify agent data in Supabase

### 3. Test Integrations
- [ ] Connect Google Calendar
- [ ] Verify OAuth flow
- [ ] Test appointment booking

### 4. Test Webhooks
- [ ] Complete a test payment
- [ ] Verify Stripe webhook delivery
- [ ] Check webhook logs in Railway

### 5. Verify Emails
- [ ] Welcome email after signup
- [ ] Payment confirmation
- [ ] Usage alerts

### 6. Monitor
- [ ] Set up Railway monitoring
- [ ] Set up Vercel monitoring
- [ ] Configure Sentry (optional)
- [ ] Set up Supabase alerts

## Security Checklist

- [ ] All environment variables set correctly
- [ ] No secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Row Level Security enabled in Supabase
- [ ] Webhook signatures verified
- [ ] Input validation in place

## Performance Optimization

- [ ] Database indexes created
- [ ] API response caching (optional)
- [ ] Image optimization (if applicable)
- [ ] CDN configured for frontend
- [ ] Database connection pooling

## Backup & Recovery

- [ ] Supabase automatic backups enabled
- [ ] Document recovery procedures
- [ ] Test backup restoration

## Monitoring & Alerts

- [ ] Railway health checks
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Payment failure alerts
- [ ] Usage limit alerts

## Documentation

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Create runbook for common issues
- [ ] Document scaling procedures

## Final Checks

- [ ] All features tested in production
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility checked
- [ ] Load testing performed (optional)
- [ ] Security audit completed

## Rollback Plan

If issues occur:

1. **Frontend**: Revert to previous deployment in Vercel
2. **Backend**: Rollback in Railway dashboard
3. **Database**: Use Supabase point-in-time recovery
4. **Notify users** if service interruption expected

## Support Setup

- [ ] Set up support email
- [ ] Create FAQ documentation
- [ ] Set up customer support system
- [ ] Prepare incident response plan

## Marketing Site Integration

- [ ] Update pricing page with correct plan IDs
- [ ] Ensure "Get Started" buttons point to correct registration URL
- [ ] Add success stories/testimonials
- [ ] Set up analytics tracking

## Compliance

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance verified (if applicable)
- [ ] HIPAA compliance verified (for healthcare)
- [ ] Cookie consent implemented

---

## Useful Commands

### Railway
```bash
railway logs          # View logs
railway status        # Check status
railway run bash      # SSH into container
railway link          # Link local project
```

### Vercel
```bash
vercel logs           # View logs
vercel inspect        # Inspect deployment
vercel env pull       # Pull environment variables
```

### Stripe
```bash
stripe listen --forward-to localhost:8000/api/webhooks/stripe  # Test webhooks locally
```

## Support Contacts

- Railway: support@railway.app
- Vercel: support@vercel.com
- Supabase: support@supabase.io
- Stripe: support@stripe.com
