# Vami Platform - Complete Setup Guide

This guide will walk you through setting up all external services and deploying the Vami platform.

**Total Time**: ~2-3 hours
**Cost**: Most services have free tiers for development

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Credit card (for service verification, most are free tier)
- [ ] Domain name (optional for MVP, required for production)

---

## 1️⃣ SUPABASE SETUP (15 minutes)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign in with GitHub
4. Click **New project**
5. Fill in:
   - **Name**: `vami-production` (or `vami-dev`)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing**: Free tier is fine for development
6. Click **Create new project**
7. Wait 2-3 minutes for setup

### Run Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click **New query**
3. Open `backend/migrations/000_COMPLETE_DATABASE_SETUP.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run** (bottom right)
7. Wait for "Success" message
8. Verify: You should see 14 tables created

### Create Storage Bucket

1. Go to **Storage** tab
2. Click **New bucket**
3. Settings:
   - **Name**: `knowledge-base`
   - **Public**: Toggle OFF (private bucket)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: Leave empty (we validate in code)
4. Click **Create bucket**
5. Go back to **SQL Editor** and run the storage policies from `backend/migrations/README_MIGRATION_GUIDE.md`

### Get API Credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public: eyJhbG...
   service_role: eyJhbG... (keep secret!)
   ```
3. Save these for `.env` file later

---

## 2️⃣ STRIPE SETUP (20 minutes)

### Create Account

1. Go to [stripe.com/register](https://stripe.com/register)
2. Create account with business email
3. Verify email
4. Complete business profile
5. **Important**: Stay in **Test Mode** for development

### Create Products & Prices

In Stripe Dashboard → **Products**:

#### Product 1: Starter Trial
1. Click **Add product**
2. Fill in:
   - **Name**: Starter Trial
   - **Description**: 14-day trial with 240 minutes/month
   - **Pricing model**: Recurring
   - **Price**: $99.00
   - **Billing period**: Monthly
   - **Free trial**: 14 days
3. Click **Add product**
4. Copy the **Price ID** (starts with `price_...`)

#### Product 2: Basic
1. **Name**: Basic
2. **Description**: 1,500 minutes/month
3. **Price**: $499.00/month
4. Click **Add product**
5. Copy **Price ID**

#### Product 3: Professional
1. **Name**: Professional
2. **Description**: 4,200 minutes/month with advanced features
3. **Price**: $997.00/month
4. Click **Add product**
5. Copy **Price ID**

#### Product 4: Premium
1. **Name**: Premium
2. **Description**: 13,800 minutes/month with all features
3. **Price**: $2,500.00/month
4. Click **Add product**
5. Copy **Price ID**

### Setup Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://YOUR_BACKEND_URL/api/webhooks/stripe`
   - For development: `http://localhost:8000/api/webhooks/stripe`
   - For production: Use your Railway URL (we'll get this later)
4. **Description**: Vami subscription webhooks
5. **Events to send**: Select these:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**
7. Copy the **Signing secret** (starts with `whsec_...`)

### Get API Keys

1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Keep secret!

### Customer Portal (Optional but Recommended)

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate**
3. Customize branding (logo, colors)
4. Enable these features:
   - Update payment method
   - View invoices
   - Cancel subscription
5. **Save**

---

## 3️⃣ ELEVENLABS SETUP (10 minutes)

### Create Account

1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up with business email
3. Choose plan:
   - **Starter**: Free tier works for testing
   - **Creator**: $5/month for production testing
   - **Pro**: Required for production

### Get API Key

1. Go to **Profile Settings** (top right avatar)
2. Click **API Keys**
3. Click **Generate new API key**
4. **Name**: Vami Platform
5. Copy the key (starts with `sk_...`)
6. **Important**: Save immediately - can't view again!

### Create Test Agent (Optional)

1. Go to **Conversational AI** → **Agents**
2. Click **Create Agent**
3. Fill in:
   - **Name**: Test Clinic Agent
   - **Prompt**: "You are a friendly receptionist for a medical clinic..."
   - **Voice**: Choose from library
   - **Language**: English
4. Click **Create**
5. Note the **Agent ID** for testing

### Setup Webhook

1. In agent settings, go to **Webhooks**
2. **Post-call webhook URL**: `https://YOUR_BACKEND_URL/api/webhooks/elevenlabs`
3. **Events**: Select all
4. Click **Save**

### Get Webhook Secret

1. In **Settings** → **Webhooks**
2. Copy the **Signing secret**

---

## 4️⃣ GOOGLE CLOUD SETUP (25 minutes)

### Create Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. **Project name**: Vami Platform
4. Click **Create**
5. Select the new project from dropdown

### Enable Google Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it
4. Click **Enable**
5. Wait for activation

### Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure **OAuth consent screen** first:
   - User Type: **External**
   - App name: Vami Platform
   - User support email: your@email.com
   - Developer contact: your@email.com
   - Scopes: Add `https://www.googleapis.com/auth/calendar`
   - Test users: Add your email
   - Click **Save and Continue**

4. Now create OAuth client ID:
   - Application type: **Web application**
   - Name: Vami Calendar Integration
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (development)
     - `https://dashboard.vami.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/integrations/google/callback`
     - `https://dashboard.vami.app/integrations/google/callback`
5. Click **Create**
6. Copy:
   - **Client ID** (ends with `.apps.googleusercontent.com`)
   - **Client secret**

---

## 5️⃣ SENDGRID SETUP (15 minutes)

### Create Account

1. Go to [sendgrid.com/pricing](https://sendgrid.com/pricing)
2. Choose **Free** plan (100 emails/day)
3. Sign up with business email
4. Verify email address

### Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. **Name**: Vami Platform
4. **Permissions**: **Full Access**
5. Click **Create & View**
6. Copy the API key (starts with `SG.`)
7. **Important**: Save immediately!

### Setup Sender Authentication

1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** (easiest):
   - **From Name**: Vami
   - **From Email**: noreply@yourdomain.com
   - **Reply To**: support@yourdomain.com
   - Click **Create**
   - Verify the email address

**OR** Domain Authentication (better for production):
1. Choose **Authenticate Your Domain**
2. Enter your domain
3. Add DNS records provided by SendGrid
4. Wait for verification

### Create Email Templates (Optional)

1. Go to **Email API** → **Dynamic Templates**
2. Create templates for:
   - Welcome email
   - Appointment confirmation
   - Payment failed
   - Usage limit warning

---

## 6️⃣ TWILIO SETUP (20 minutes)

### Create Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up with phone verification
3. Get **$15 trial credit**

### Get Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. **Country**: United States (or your country)
3. **Capabilities**: Check **Voice** and **SMS**
4. Search for available numbers
5. Click **Buy** on one you like
6. **Confirm** purchase

### Get API Credentials

1. Go to **Account** → **API keys & tokens**
2. Copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)
3. Also note your purchased phone number

### Configure Messaging

1. Go to **Messaging** → **Services**
2. Create a messaging service (if needed for production)
3. Add your phone number to the service

---

## 7️⃣ ENVIRONMENT CONFIGURATION

### Backend Environment Variables

Create `backend/.env`:

```bash
# ============================================
# VAMI PLATFORM - BACKEND ENVIRONMENT
# ============================================

# Application
APP_NAME=Vami Platform
DEBUG=False
SECRET_KEY=generate-random-256-bit-key-here

# Database (Supabase)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbG...your-anon-key
SUPABASE_SERVICE_KEY=eyJhbG...your-service-role-key

# ElevenLabs
ELEVENLABS_API_KEY=sk_...your-api-key
ELEVENLABS_WEBHOOK_SECRET=whsec_...your-webhook-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_...your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_...your-webhook-secret
STRIPE_PRICE_STARTER_TRIAL=price_...from-step-2
STRIPE_PRICE_BASIC=price_...from-step-2
STRIPE_PRICE_PROFESSIONAL=price_...from-step-2
STRIPE_PRICE_PREMIUM=price_...from-step-2

# Google Calendar
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:5173/integrations/google/callback

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Vami

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
MARKETING_SITE_URL=https://vami.app
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
# ============================================
# VAMI PLATFORM - FRONTEND ENVIRONMENT
# ============================================

VITE_API_URL=http://localhost:8000
VITE_MARKETING_SITE=https://vami.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...your-publishable-key
```

---

## 8️⃣ LOCAL TESTING

### Test Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Visit: http://localhost:8000/docs

### Test Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

### Test Full Flow

1. Register a new user
2. Should redirect to Stripe checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Should create agent in ElevenLabs
6. Verify in dashboard

---

## 9️⃣ PRODUCTION DEPLOYMENT

See `DEPLOYMENT_GUIDE.md` for:
- Railway backend deployment
- Vercel frontend deployment
- Custom domain setup
- SSL certificates
- Environment variables for production

---

## ✅ VERIFICATION CHECKLIST

- [ ] Supabase project created and migrated
- [ ] Storage bucket "knowledge-base" created
- [ ] Stripe products created (4 price IDs)
- [ ] Stripe webhook configured
- [ ] ElevenLabs API key obtained
- [ ] Google Cloud project created
- [ ] Google Calendar API enabled
- [ ] OAuth credentials created
- [ ] SendGrid account created and verified
- [ ] Twilio account created
- [ ] Phone number purchased
- [ ] Backend `.env` file configured
- [ ] Frontend `.env` file configured
- [ ] Backend runs locally without errors
- [ ] Frontend runs locally without errors
- [ ] Test registration flow works

---

## 🆘 TROUBLESHOOTING

### Can't connect to Supabase
- Verify URL and keys
- Check if project is paused (free tier limitation)
- Verify RLS policies allow access

### Stripe webhook not firing locally
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to localhost:8000/api/webhooks/stripe
  ```

### Google OAuth redirect mismatch
- Verify redirect URI exactly matches in Google Console
- Include `http://` or `https://`
- No trailing slash

### SendGrid emails not sending
- Verify sender authentication
- Check spam folder
- Verify API key has full access

---

## 📞 SUPPORT

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **ElevenLabs**: [elevenlabs.io/docs](https://elevenlabs.io/docs)
- **Google**: [developers.google.com/calendar](https://developers.google.com/calendar)
- **SendGrid**: [sendgrid.com/docs](https://sendgrid.com/docs)
- **Twilio**: [twilio.com/docs](https://twilio.com/docs)

---

**Next**: See `DEPLOYMENT_GUIDE.md` for deploying to production
