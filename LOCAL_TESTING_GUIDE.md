# 🚀 LOCAL TESTING GUIDE - Quick Start

## ⚡ Get Running in 10 Minutes!

Follow these steps to run Vami locally on your machine.

---

## 📋 Prerequisites

- Python 3.11+ installed
- Node.js 18+ installed
- Git installed

---

## 🎯 Step 1: Setup Supabase (5 minutes) - REQUIRED

This is the ONLY required service to get started.

### **1.1 Create Supabase Project**

1. Go to https://supabase.com
2. Sign up / Login
3. Click **"New Project"**
4. Fill in:
   - **Name**: vami-local
   - **Database Password**: (generate strong password - save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup

### **1.2 Get Your Credentials**

1. Go to **Settings** (gear icon) → **API**
2. Copy these 4 values:

```
Project URL:          https://xxxxx.supabase.co
anon public key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT Secret:           your-super-secret-jwt-token...
```

### **1.3 Setup Database**

1. Go to **SQL Editor** (in left sidebar)
2. Open your file: `c:\Users\Dell\Downloads\vami\backend\database\schema.sql`
3. Copy the **ENTIRE contents** (Ctrl+A, Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click **"RUN"** (bottom right)
6. You should see: ✅ **"Success. No rows returned"**

### **1.4 Update Backend .env**

Open: `c:\Users\Dell\Downloads\vami\backend\.env`

Replace these lines with your actual values:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token...
```

---

## 🔧 Step 2: Run Backend (3 minutes)

Open **Command Prompt** or **PowerShell**:

```bash
# Navigate to backend
cd c:\Users\Dell\Downloads\vami\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies (this takes 1-2 minutes)
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Backend is running!** Keep this terminal open.

---

## 🎨 Step 3: Run Frontend (2 minutes)

Open a **NEW Command Prompt** or **PowerShell**:

```bash
# Navigate to frontend
cd c:\Users\Dell\Downloads\vami\frontend

# Install dependencies (this takes 1-2 minutes)
npm install

# Run the dev server
npm run dev
```

You should see:
```
VITE v5.0.8  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend is running!** Keep this terminal open too.

---

## 🎉 Step 4: Test Your App!

### **4.1 Open Your Browser**

Visit: **http://localhost:5173**

You should see the Vami login page!

### **4.2 Register a New Account**

1. Click **"Sign up"**
2. Fill in:
   - **Company Name**: Test Medical
   - **Email**: test@example.com
   - **Password**: password123
3. Click **"Continue to Payment"**
4. You'll see Stripe checkout (it won't work with placeholders - that's OK!)

### **4.3 Verify in Supabase**

1. Go to Supabase Dashboard
2. Click **Table Editor** → **users** table
3. You should see your newly created user! ✅

### **4.4 Test API Documentation**

Visit: **http://localhost:8000/docs**

You should see the interactive API documentation (Swagger UI)

---

## ✅ What Works Without Additional Services

With just Supabase setup, you can test:

✅ **Working:**
- User registration
- Login/Logout
- Database operations
- API endpoints
- Dashboard (basic view)
- User authentication

❌ **Not Working (needs additional setup):**
- Payment processing (needs Stripe)
- Voice agents (needs ElevenLabs)
- Calendar booking (needs Google Calendar)
- Email notifications (needs SendGrid)
- SMS notifications (needs Twilio)

---

## 🔧 Troubleshooting

### **Backend won't start**

```bash
# Check Python version (must be 3.11+)
python --version

# If wrong version, try:
python3 --version
python3.11 --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### **Frontend won't start**

```bash
# Check Node version (must be 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Database connection error**

1. Check Supabase credentials in `.env`
2. Verify project is not paused in Supabase dashboard
3. Make sure schema was run successfully

### **Port already in use**

**Backend (port 8000):**
```bash
# Windows: Find and kill process
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

**Frontend (port 5173):**
```bash
# Edit vite.config.ts and change port to 5174
# Or just kill the process using port 5173
```

---

## 📊 Checking It Works

### **Test 1: API Health Check**

Visit: http://localhost:8000/

You should see:
```json
{
  "message": "Vami Platform API",
  "version": "1.0.0",
  "status": "operational"
}
```

### **Test 2: Database Connection**

Visit: http://localhost:8000/docs

Try the `/api/auth/me` endpoint (will fail if not logged in - that's correct!)

### **Test 3: Frontend Rendering**

Visit: http://localhost:5173

- Should see login page
- No console errors in browser DevTools (F12)
- CSS should be styled properly

---

## 🎯 Next Steps

Once local testing works:

### **1. Add Stripe (for payments)**

1. Go to https://stripe.com/register
2. Get test API keys
3. Update `.env` files
4. Create 4 products (Starter, Basic, Professional, Premium)
5. Add price IDs to backend `.env`

### **2. Add ElevenLabs (for voice AI)**

1. Go to https://elevenlabs.io
2. Sign up for free tier
3. Get API key
4. Update `ELEVENLABS_API_KEY` in backend `.env`

### **3. Deploy to Production**

Follow **DEPLOYMENT_READY.md** for:
- Railway deployment (backend)
- Vercel deployment (frontend)

---

## 📞 Need Help?

**Common Issues:**

1. **ModuleNotFoundError**: Run `pip install -r requirements.txt`
2. **Port in use**: Change port or kill existing process
3. **Database error**: Check Supabase credentials
4. **CORS error**: Verify `CORS_ORIGINS` in backend `.env`

**Check Logs:**

- **Backend logs**: In terminal running uvicorn
- **Frontend logs**: Browser console (F12)
- **Database logs**: Supabase Dashboard → Logs

---

## ✨ You're All Set!

Your local development environment is ready. Happy coding! 🚀

**What you have:**
- ✅ Full-stack app running locally
- ✅ Database connected (Supabase)
- ✅ API working (FastAPI)
- ✅ Frontend working (React)
- ✅ Authentication system functional

**Repository**: https://github.com/01101001raj/vami
