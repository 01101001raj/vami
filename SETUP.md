# Vami Platform - Quick Setup Guide

## 🎯 Quick Start (5 Minutes)

### Step 1: Clone and Navigate
```bash
cd c:\Users\Dell\Downloads\vami
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your credentials (see below)
```

### Step 3: Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env with your API URL
```

### Step 4: Database Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor
3. Copy and paste the entire contents of `backend/database/schema.sql`
4. Click "Run" to execute

### Step 5: Get API Keys

#### Supabase
1. Go to Settings > API in your Supabase project
2. Copy:
   - Project URL → `SUPABASE_URL`
   - Anon public key → `SUPABASE_KEY`
   - Service role key → `SUPABASE_SERVICE_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET`

#### Stripe
1. Go to [stripe.com/register](https://stripe.com/register)
2. After signup, go to Developers > API keys
3. Copy:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
4. Create products:
   - Go to Products > Add product
   - Create 4 products with recurring prices
   - Copy price IDs to `.env`

#### ElevenLabs
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up and go to Profile > API keys
3. Copy API key → `ELEVENLABS_API_KEY`
4. Generate webhook secret → `ELEVENLABS_WEBHOOK_SECRET`

#### Google Calendar (Optional for now)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Copy client ID and secret

#### SendGrid (Optional for now)
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create account and API key
3. Copy to `SENDGRID_API_KEY`

#### Twilio (Optional for now)
1. Go to [twilio.com](https://twilio.com)
2. Create account
3. Copy Account SID and Auth Token

### Step 6: Run the Application

```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate  # If not already activated
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 7: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## ✅ Minimal Setup (Skip Optional Services)

For development, you can use placeholder values for:
- `ELEVENLABS_API_KEY` = "sk_test_placeholder"
- `SENDGRID_API_KEY` = "SG.placeholder"
- `TWILIO_ACCOUNT_SID` = "ACplaceholder"
- `TWILIO_AUTH_TOKEN` = "placeholder"

The app will work without these services, but features will be limited:
- Voice agents won't actually be created (mock data returned)
- Emails won't send
- SMS won't send

## 🔧 Environment Variables Template

### Backend (.env)

```env
# Required
APP_NAME=Vami Platform
SECRET_KEY=your-secret-key-min-32-characters-long
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER_TRIAL=price_xxxxx
STRIPE_PRICE_BASIC=price_xxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxx
STRIPE_PRICE_PREMIUM=price_xxxxx

# Optional (use placeholders for testing)
ELEVENLABS_API_KEY=sk_test_placeholder
ELEVENLABS_WEBHOOK_SECRET=whsec_placeholder
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:5173/integrations/google/callback
SENDGRID_API_KEY=SG.placeholder
SENDGRID_FROM_EMAIL=noreply@vami.app
TWILIO_ACCOUNT_SID=ACplaceholder
TWILIO_AUTH_TOKEN=placeholder
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_MARKETING_SITE=https://vami.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

## 🎨 Test User Flow

1. Go to http://localhost:5173/register
2. Fill in the form:
   - Company: "Test Medical"
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Continue to Payment"
4. You'll be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
6. Any future date for expiry
7. Any 3 digits for CVC
8. Complete payment
9. You'll be redirected back to the app
10. Your agent will be created automatically

## 🐛 Common Issues

### Database Connection Error
- Check Supabase credentials in `.env`
- Ensure schema was run in Supabase SQL Editor

### Stripe Checkout Not Loading
- Verify `STRIPE_PUBLISHABLE_KEY` in frontend `.env`
- Check `STRIPE_SECRET_KEY` in backend `.env`
- Ensure price IDs are correct

### CORS Error
- Check `CORS_ORIGINS` in backend `.env`
- Should include `http://localhost:5173`

### Port Already in Use
```bash
# Backend - use different port
uvicorn app.main:app --reload --port 8001

# Frontend - edit vite.config.ts
# Change server.port to 5174
```

## 📞 Need Help?

Check the full README.md for detailed documentation and troubleshooting.

## 🚀 Next Steps

After basic setup:
1. Configure Stripe products and webhooks
2. Set up ElevenLabs account
3. Connect Google Calendar
4. Configure SendGrid for emails
5. Set up Twilio for SMS
6. Deploy to Railway (backend) and Vercel (frontend)
