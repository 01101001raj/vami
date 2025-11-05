# Vami Platform - AI Voice Agents for Healthcare

A complete B2B SaaS platform that enables healthcare practices to deploy AI-powered voice agents for handling inbound calls, booking appointments, and managing patient communications 24/7.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + TailwindCSS (Vercel)
- **Backend**: FastAPI + Python (Railway)
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe
- **Voice AI**: ElevenLabs
- **Calendar**: Google Calendar API
- **Email**: SendGrid
- **SMS**: Twilio

## 📁 Project Structure

```
vami/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── models/    # Pydantic models
│   │   ├── schemas/   # Request/response schemas
│   │   ├── services/  # Business logic
│   │   ├── api/       # API routes
│   │   └── main.py    # FastAPI app
│   ├── database/      # SQL schema
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/          # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/  # API clients
    │   ├── store/     # Zustand state
    │   └── types/     # TypeScript types
    ├── package.json
    └── vercel.json

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account
- Stripe account
- ElevenLabs API key
- Google Cloud project (for Calendar API)
- SendGrid API key
- Twilio account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

5. Run Supabase migration:
- Go to your Supabase project
- Open SQL Editor
- Run the SQL in `database/schema.sql`

6. Start the server:
```bash
uvicorn app.main:app --reload
```

Backend will be running at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Start development server:
```bash
npm run dev
```

Frontend will be running at `http://localhost:5173`

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings > API
3. Run the SQL schema from `backend/database/schema.sql`
4. Update `.env` with your Supabase credentials

### Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Create products for each plan:
   - Starter Trial ($99/mo with 14-day trial)
   - Basic ($499/mo)
   - Professional ($997/mo)
   - Premium ($2,500/mo)
3. Get price IDs for each product
4. Configure webhook endpoint: `https://your-api.com/api/webhooks/stripe`
5. Add webhook secret to `.env`

### ElevenLabs Setup

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get API key from dashboard
3. Configure webhook: `https://your-api.com/api/webhooks/elevenlabs`
4. Add API key and webhook secret to `.env`

### Google Calendar Setup

1. Create project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://your-frontend.com/integrations/google/callback`
5. Add credentials to `.env`

## 📦 Deployment

### Backend (Railway)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Set environment variables in Railway dashboard

4. Deploy:
```bash
railway up
```

### Frontend (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Set environment variables in Vercel dashboard

## 🔐 Environment Variables

### Backend

See `backend/.env.example` for all required variables including:
- Supabase credentials
- Stripe keys
- ElevenLabs API key
- Google OAuth credentials
- SendGrid API key
- Twilio credentials

### Frontend

See `frontend/.env.example` for required variables:
- API URL
- Stripe publishable key

## 📊 Features

- ✅ User authentication with Supabase
- ✅ Subscription management with Stripe
- ✅ AI voice agents with ElevenLabs
- ✅ Google Calendar integration
- ✅ Email notifications with SendGrid
- ✅ SMS notifications with Twilio
- ✅ Call analytics and transcripts
- ✅ Usage tracking and limits
- ✅ Multi-tier pricing
- ✅ Team member management
- ✅ Webhook handlers for Stripe and ElevenLabs

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**: Check `CORS_ORIGINS` in backend `.env`
2. **Database connection failed**: Verify Supabase credentials
3. **Stripe webhook not working**: Ensure webhook secret is correct
4. **Calendar integration fails**: Check Google OAuth redirect URI

### Logs

- Backend logs: Check Railway logs or console output
- Frontend logs: Check browser console
- Database logs: Check Supabase dashboard

## 📚 Documentation

- [Product Requirements Document](./PRD.md)
- [API Documentation](http://localhost:8000/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [ElevenLabs Docs](https://elevenlabs.io/docs)

## 🤝 Support

For issues and questions:
- Create an issue in this repository
- Email: support@vami.app

## 📄 License

Proprietary - All rights reserved

## 🎉 Acknowledgments

- FastAPI for the excellent web framework
- React team for the UI library
- Supabase for the database and auth
- Stripe for payment processing
- ElevenLabs for voice AI technology
