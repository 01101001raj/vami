# Vami Platform - Testing Guide

Complete testing checklist and scripts for verifying all functionality works correctly.

---

## 🎯 Testing Strategy

1. **Unit Tests** - Test individual functions (future)
2. **Integration Tests** - Test API endpoints
3. **End-to-End Tests** - Test complete user flows
4. **Manual Testing** - Verify UI/UX

---

## 1️⃣ PRE-DEPLOYMENT TESTING

### Backend Health Check

```bash
# Start backend locally
cd backend
source venv/Scripts/activate
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-..."}
```

### Frontend Build Test

```bash
# Build frontend
cd frontend
npm run build

# Should complete without errors
# Check dist/ folder created
```

### Environment Variables Check

```bash
# Backend - verify all required vars set
cd backend
python -c "from app.config import settings; print(settings.SUPABASE_URL)"

# Should print your Supabase URL
# If error, check .env file
```

---

## 2️⃣ API ENDPOINT TESTING

### Test Authentication Endpoints

```bash
# Register new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "company_name": "Test Clinic"
  }'

# Expected: 201 Created with user object

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Expected: 200 OK with access_token
# Save the token for next requests

# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with user object
```

### Test Agent Endpoints

```bash
# Get user's agent
curl http://localhost:8000/api/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with agent object

# Get agent API token
curl http://localhost:8000/api/agents/AGENT_ID/api-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with token details
```

### Test Knowledge Base Upload

```bash
# Upload a PDF file
curl -X POST http://localhost:8000/api/agents/knowledge-base/upload?agent_id=AGENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@test.pdf"

# Expected: 200 OK with file details

# List knowledge base files
curl http://localhost:8000/api/agents/knowledge-base/files?agent_id=AGENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with array of files
```

### Test Analytics Endpoints

```bash
# Get analytics stats
curl "http://localhost:8000/api/analytics/stats?days=7" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with stats object

# Get conversations
curl "http://localhost:8000/api/analytics/conversations?page=1&per_page=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with conversations array
```

### Test Calendar Integration

```bash
# Get Google OAuth URL
curl http://localhost:8000/api/integrations/google/auth-url \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with auth_url
```

---

## 3️⃣ WEBHOOK TESTING

### Test Stripe Webhook

```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/webhooks/stripe

# In another terminal, trigger test event
stripe trigger checkout.session.completed

# Check backend logs for webhook processing
```

### Test ElevenLabs Webhook

```bash
# Send test webhook
curl -X POST http://localhost:8000/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_call_transcription",
    "data": {
      "conversation_id": "test_123",
      "agent_id": "YOUR_AGENT_ID",
      "duration_secs": 120,
      "call_successful": "success",
      "summary": "Test conversation",
      "title": "Test call",
      "sentiment": "positive",
      "intent": "appointment"
    }
  }'

# Expected: 200 OK
# Check database: conversations table should have new entry
```

---

## 4️⃣ INTEGRATION TESTING

### Complete User Registration Flow

```bash
#!/bin/bash
# test_registration_flow.sh

API_URL="http://localhost:8000/api"
EMAIL="test$(date +%s)@example.com"  # Unique email
PASSWORD="Test123!"
COMPANY="Test Clinic $(date +%s)"

echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"company_name\": \"$COMPANY\"
  }")

echo "$REGISTER_RESPONSE" | jq .

echo "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .access_token)
echo "Token: $TOKEN"

echo "\n3. Getting user profile..."
curl -s "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n4. Getting agent..."
curl -s "$API_URL/agents" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "\n✅ Registration flow complete!"
```

### Payment Flow Test

```
1. Go to http://localhost:5173
2. Click "Register"
3. Fill in form
4. Click "Continue to Payment"
5. Use Stripe test card: 4242 4242 4242 4242
6. Enter any future expiry date
7. Enter any 3-digit CVC
8. Click "Subscribe"
9. Verify redirect to success page
10. Verify agent created in database
```

---

## 5️⃣ END-TO-END TESTING CHECKLIST

### User Journey: New Customer

- [ ] Visit marketing site (vami.app)
- [ ] Click "Get Started"
- [ ] Redirected to dashboard.vami.app/register
- [ ] Fill registration form
- [ ] Validate email format
- [ ] Validate password strength
- [ ] Click "Sign Up"
- [ ] Redirected to Stripe checkout
- [ ] Enter payment details (test card)
- [ ] Complete payment
- [ ] Redirected to dashboard
- [ ] See welcome message
- [ ] Agent status shows "Active"
- [ ] Usage shows "0 / 240 minutes"

### User Journey: Upload Knowledge Base

- [ ] Login to dashboard
- [ ] Navigate to Knowledge Base
- [ ] Click "Upload Document"
- [ ] Select PDF file
- [ ] Click "Upload"
- [ ] See upload progress
- [ ] See file in list
- [ ] Verify file size shown
- [ ] Click "Delete" on file
- [ ] Confirm deletion
- [ ] File removed from list

### User Journey: Connect Google Calendar

- [ ] Login to dashboard
- [ ] Navigate to Integrations
- [ ] Click "Connect Google Calendar"
- [ ] Redirected to Google OAuth
- [ ] Grant calendar access
- [ ] Redirected back to dashboard
- [ ] See "Connected ✓" status
- [ ] Select calendar from dropdown
- [ ] Save selection
- [ ] See confirmation message

### User Journey: View Analytics

- [ ] Login to dashboard
- [ ] Navigate to Analytics
- [ ] See stats cards (total calls, duration, etc.)
- [ ] See conversations list
- [ ] Click on a conversation
- [ ] See conversation details
- [ ] See transcript (if available)
- [ ] See sentiment badge
- [ ] Click "Export" button
- [ ] Download CSV file

### User Journey: Team Management

- [ ] Login to dashboard (Professional plan)
- [ ] Navigate to Team
- [ ] Click "Invite Member"
- [ ] Enter email address
- [ ] Select role (Viewer/Editor/Admin)
- [ ] Click "Send Invitation"
- [ ] See invitation in "Pending" list
- [ ] Check email for invitation
- [ ] Click invitation link
- [ ] New member can access dashboard
- [ ] Verify permissions match role

---

## 6️⃣ PERFORMANCE TESTING

### Load Time Testing

```bash
# Install Lighthouse
npm install -g lighthouse

# Test frontend
lighthouse http://localhost:5173 --view

# Check scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

### API Response Time Testing

```bash
# Install Apache Bench
# On Mac: brew install httpd
# On Ubuntu: apt-get install apache2-utils

# Test API endpoint
ab -n 100 -c 10 http://localhost:8000/health

# Check:
# Time per request: < 100ms
# Failed requests: 0
```

### Database Query Performance

```sql
-- Run in Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM conversations
WHERE agent_id = 'test_agent'
ORDER BY created_at DESC
LIMIT 20;

-- Check execution time: < 100ms
```

---

## 7️⃣ SECURITY TESTING

### OWASP Top 10 Checks

#### SQL Injection
```bash
# Try SQL injection in login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com\" OR \"1\"=\"1",
    "password": "anything"
  }'

# Expected: 401 Unauthorized (not 200)
```

#### XSS (Cross-Site Scripting)
```
1. Try entering: <script>alert('xss')</script>
2. In company name field during registration
3. Check if it's escaped in dashboard
4. Should show as plain text, not execute
```

#### CORS
```bash
# Try accessing from unauthorized origin
curl -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS \
  http://localhost:8000/api/agents

# Expected: No CORS headers in response
```

#### Rate Limiting
```bash
# Send 100 requests rapidly
for i in {1..100}; do
  curl http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test", "password": "test"}' &
done

# Expected: Some requests return 429 Too Many Requests
```

---

## 8️⃣ BROWSER COMPATIBILITY TESTING

### Desktop Browsers

- [ ] Chrome (latest)
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] All features functional
  - [ ] No console errors

- [ ] Firefox (latest)
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] All features functional
  - [ ] No console errors

- [ ] Safari (latest)
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] All features functional
  - [ ] No console errors

- [ ] Edge (latest)
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] All features functional
  - [ ] No console errors

### Mobile Browsers

- [ ] Chrome Mobile
  - [ ] Responsive layout
  - [ ] Touch interactions work
  - [ ] No horizontal scroll

- [ ] Safari iOS
  - [ ] Responsive layout
  - [ ] Touch interactions work
  - [ ] No horizontal scroll

---

## 9️⃣ ACCESSIBILITY TESTING

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Can press Enter to submit forms
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader
- [ ] Install NVDA (Windows) or VoiceOver (Mac)
- [ ] Navigate site with screen reader
- [ ] All images have alt text
- [ ] Form labels are readable
- [ ] Error messages are announced

### Color Contrast
```bash
# Use browser DevTools
# Lighthouse > Accessibility > Contrast

# All text should meet WCAG AA standards:
# Normal text: 4.5:1
# Large text: 3:1
```

---

## 🔟 PRODUCTION SMOKE TESTS

### After Deployment

```bash
# Replace with your production URLs
PROD_API="https://api.vami.app"
PROD_FRONTEND="https://dashboard.vami.app"

# 1. Health check
curl $PROD_API/health
# Expected: {"status": "healthy"}

# 2. Frontend loads
curl -I $PROD_FRONTEND
# Expected: 200 OK

# 3. API docs accessible
curl -I $PROD_API/docs
# Expected: 200 OK

# 4. Stripe webhook works
# Trigger real payment in Stripe Dashboard
# Check backend logs for webhook processing

# 5. ElevenLabs integration
# Make test call to agent
# Verify conversation appears in dashboard
```

---

## ✅ TESTING CHECKLIST SUMMARY

### Pre-Launch

- [ ] All API endpoints return expected responses
- [ ] Database migrations applied successfully
- [ ] Environment variables set correctly
- [ ] Stripe webhooks working
- [ ] ElevenLabs integration functional
- [ ] Google Calendar OAuth works
- [ ] Email sending works (SendGrid)
- [ ] SMS sending works (Twilio)
- [ ] Frontend builds without errors
- [ ] Backend starts without errors

### Performance

- [ ] Page load < 2 seconds
- [ ] API response < 300ms
- [ ] Lighthouse score > 90
- [ ] No memory leaks
- [ ] Database queries optimized

### Security

- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CORS configured correctly
- [ ] Rate limiting working
- [ ] Authentication required for protected routes
- [ ] Passwords hashed (never plain text)
- [ ] API keys encrypted
- [ ] HTTPS enforced

### User Experience

- [ ] All buttons work
- [ ] All links work
- [ ] Forms validate input
- [ ] Error messages helpful
- [ ] Success messages shown
- [ ] Loading states visible
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Monitoring

- [ ] Error tracking setup (Sentry)
- [ ] Logging configured
- [ ] Uptime monitoring setup
- [ ] Alerts configured
- [ ] Backups automated

---

## 📝 CREATING TEST DATA

### Generate Test Users

```sql
-- Run in Supabase SQL Editor
-- Creates 10 test users

INSERT INTO users (id, email, company_name, plan)
SELECT
  gen_random_uuid(),
  'test' || generate_series || '@example.com',
  'Test Clinic ' || generate_series,
  'starter_trial'
FROM generate_series(1, 10);
```

### Generate Test Conversations

```sql
-- Creates 100 test conversations

INSERT INTO conversations (
  conversation_id,
  agent_id,
  duration_secs,
  call_successful,
  summary,
  sentiment,
  intent
)
SELECT
  'conv_' || generate_series,
  'agent_test',
  floor(random() * 600 + 60)::int,  -- 60-660 seconds
  'success',
  'Test conversation ' || generate_series,
  (ARRAY['positive', 'neutral', 'negative'])[floor(random() * 3 + 1)],
  (ARRAY['appointment', 'question', 'complaint'])[floor(random() * 3 + 1)]
FROM generate_series(1, 100);
```

---

## 🐛 BUG TRACKING

When you find a bug:

1. **Capture**:
   - Screenshot/screen recording
   - Browser console errors
   - Backend logs
   - Steps to reproduce

2. **Document**:
   ```
   Title: [Component] Brief description

   Environment: Production/Staging/Local
   Browser: Chrome 119

   Steps to Reproduce:
   1. Go to...
   2. Click...
   3. See error

   Expected: Should work
   Actual: Error message appears

   Logs: [Paste relevant logs]
   ```

3. **Fix & Verify**:
   - Create fix
   - Test locally
   - Deploy to staging
   - Test in staging
   - Deploy to production
   - Verify in production

---

**Testing Complete!** ✅ Your platform is ready for launch.
