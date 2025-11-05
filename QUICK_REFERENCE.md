# Vami Platform - Quick Reference Guide

## 🚀 Quick Start Commands

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate              # Windows
source venv/bin/activate           # Mac/Linux
pip install -r requirements.txt
cp .env.example .env               # Edit with your keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env               # Edit with your API URL
npm run dev
```

## 🔑 Required API Keys

| Service | Where to Get | Environment Variable |
|---------|--------------|---------------------|
| Supabase | [supabase.com](https://supabase.com) | `SUPABASE_URL`, `SUPABASE_KEY` |
| Stripe | [stripe.com/register](https://stripe.com/register) | `STRIPE_SECRET_KEY` |
| ElevenLabs | [elevenlabs.io](https://elevenlabs.io) | `ELEVENLABS_API_KEY` |
| Google | [console.cloud.google.com](https://console.cloud.google.com) | `GOOGLE_CLIENT_ID` |
| SendGrid | [sendgrid.com](https://sendgrid.com) | `SENDGRID_API_KEY` |
| Twilio | [twilio.com](https://twilio.com) | `TWILIO_ACCOUNT_SID` |

## 📁 Project Structure

```
vami/
├── backend/               # FastAPI + Python
│   ├── app/
│   │   ├── models/       # Data models
│   │   ├── schemas/      # API schemas
│   │   ├── services/     # Business logic
│   │   ├── api/routes/   # API endpoints
│   │   └── main.py       # Entry point
│   ├── database/
│   │   └── schema.sql    # Database schema
│   └── requirements.txt
│
└── frontend/             # React + TypeScript
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── services/     # API clients
    │   ├── store/        # State management
    │   └── types/        # TypeScript types
    └── package.json
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - Get user's agent
- `PUT /api/agents/{id}` - Update agent

### Analytics
- `GET /api/analytics/conversations` - List conversations
- `GET /api/analytics/stats` - Get statistics

### Billing
- `POST /api/billing/create-checkout` - Create checkout session
- `GET /api/billing/usage` - Get current usage
- `POST /api/billing/portal` - Open customer portal

### Integrations
- `GET /api/integrations/google/auth-url` - Get OAuth URL
- `POST /api/integrations/google/callback` - Handle callback

### Webhooks
- `POST /api/webhooks/stripe` - Stripe events
- `POST /api/webhooks/elevenlabs` - ElevenLabs events

## 💻 Development URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔧 Common Tasks

### Add New API Endpoint
1. Create route in `backend/app/api/routes/`
2. Add to router in `main.py`
3. Create schema in `backend/app/schemas/`
4. Add API client method in `frontend/src/services/api.ts`

### Add New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add to navigation in `frontend/src/components/layout/Layout.tsx`

### Database Changes
1. Update `backend/database/schema.sql`
2. Run in Supabase SQL Editor
3. Update models in `backend/app/models/`
4. Update TypeScript types in `frontend/src/types/`

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt

# Check .env file exists
ls .env

# Check logs
uvicorn app.main:app --reload --log-level debug
```

### Frontend won't start
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check .env file
ls .env
```

### Database connection error
1. Check Supabase credentials in `.env`
2. Verify project is not paused in Supabase dashboard
3. Test connection: `psql $SUPABASE_URL`

### CORS errors
1. Check `CORS_ORIGINS` in backend `.env`
2. Should include `http://localhost:5173`
3. Restart backend after changes

## 📊 Database Tables

1. **users** - User accounts and subscription info
2. **agents** - ElevenLabs voice agents
3. **conversations** - Call records
4. **messages** - Conversation transcripts
5. **usage_records** - Minute consumption
6. **calendar_connections** - Google Calendar OAuth
7. **team_members** - Team access (Professional+)

## 🎨 UI Components

### Common Components
- `<ProtectedRoute>` - Requires authentication
- `<Layout>` - Main app layout with sidebar
- `<Card>` - Styled card container

### Pages
- `LoginPage` - User login
- `RegisterPage` - User registration
- `DashboardPage` - Main dashboard
- `AnalyticsPage` - Call history
- `BillingPage` - Subscription management
- `SettingsPage` - Account settings

## 🧪 Testing

### Test Stripe Payment
Card: `4242 4242 4242 4242`
Expiry: Any future date
CVC: Any 3 digits

### Test Email
Use [Mailtrap.io](https://mailtrap.io) for dev testing

### Test SMS
Use Twilio test credentials

## 📦 Deployment

### Backend to Railway
```bash
railway login
railway init
railway up
```

### Frontend to Vercel
```bash
vercel
```

## 🔐 Security Checklist

- [ ] All API keys in `.env`, not in code
- [ ] `.env` in `.gitignore`
- [ ] CORS properly configured
- [ ] Webhook signatures verified
- [ ] JWT tokens validated
- [ ] Input validation on all endpoints
- [ ] HTTPS in production

## 📞 Getting Help

- **Documentation**: Check README.md and SETUP.md
- **API Docs**: http://localhost:8000/docs
- **Logs**: Check terminal output
- **Database**: Check Supabase dashboard
- **Payments**: Check Stripe dashboard

## 🎯 Feature Flags by Plan

Check `user.features` object:
```typescript
user.features.inbound_calls       // All plans
user.features.outbound_calls      // Professional+
user.features.call_recordings     // Professional+
user.features.sentiment_analysis  // Premium only
user.features.voice_cloning       // Premium only
```

## 💡 Tips

1. **Development**: Use mock data for ElevenLabs if no API key
2. **Testing**: Use Stripe test mode initially
3. **Debugging**: Check browser console and terminal logs
4. **Performance**: Use React DevTools profiler
5. **Database**: Use Supabase Studio for visual query building

## 🚦 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (need login)
- `403` - Forbidden (upgrade plan)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Server Error

---

**Need more help?** See the full README.md or SETUP.md files.
