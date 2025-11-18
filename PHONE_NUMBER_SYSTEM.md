# Multi-Tenant Phone Number System

## Overview

The Vami Platform now supports **automatic phone number provisioning** where each client (healthcare practice) gets their own dedicated phone number. No two clients share the same number.

## How It Works

### 1. **Dedicated Numbers Per Client**
```
Client A → Phone Number: +1-212-555-0001 → Agent A
Client B → Phone Number: +1-415-555-0002 → Agent B
Client C → Phone Number: +1-305-555-0003 → Agent C
```

Each number is:
- ✅ Unique to one client
- ✅ Stored in the database
- ✅ Automatically provisioned via Twilio
- ✅ Linked to their specific AI agent

### 2. **Automatic Provisioning**

When a user creates an agent, the system automatically:
1. Creates the AI agent in ElevenLabs
2. Provisions a phone number from Twilio
3. Configures webhooks to route calls
4. Stores everything in the database

### 3. **Intelligent Call Routing**

When someone calls:
```
Incoming call to +1-212-555-0001
  ↓
Twilio webhook: /api/webhooks/call/incoming
  ↓
System looks up: Which agent owns +1-212-555-0001?
  ↓
Routes call to Agent A (Client A's agent)
```

---

## Database Schema

###New Tables & Columns Added:

#### **agents table** (updated)
```sql
ALTER TABLE agents ADD COLUMN:
- phone_number VARCHAR(20)              -- E.164 format: +12125551234
- phone_number_sid VARCHAR(100)         -- Twilio SID: PNxxxx
- phone_number_provider VARCHAR(50)     -- 'twilio' or 'elevenlabs'
- phone_number_status VARCHAR(50)       -- 'active', 'inactive', 'pending'
```

#### **phone_numbers table** (new)
```sql
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100),
    user_id UUID,
    phone_number VARCHAR(20) UNIQUE,    -- The actual number
    phone_number_sid VARCHAR(100),       -- Twilio SID
    provider VARCHAR(50),                -- 'twilio' or 'elevenlabs'
    status VARCHAR(50),                  -- 'active', 'inactive', 'released'
    capabilities JSONB,                  -- voice, sms, mms
    country_code VARCHAR(5),
    monthly_cost DECIMAL(10, 2),
    provisioned_at TIMESTAMP,
    released_at TIMESTAMP
);
```

---

## API Endpoints

### **1. Create Agent with Phone Number** (Automatic)

```http
POST /api/agents
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "agent_name": "Dr. Smith's Office Assistant",
  "language": "en",
  "area_code": "212",           // Optional: Preferred area code
  "provision_phone": true        // Default: true
}
```

**Response:**
```json
{
  "agent_id": "agent_xxx",
  "agent_name": "Dr. Smith's Office Assistant",
  "phone_number": "+12125551234",
  "phone_number_status": "active",
  "api_token": "vami_agent_xxxx",
  "created_at": "2025-11-10T12:00:00Z"
}
```

---

### **2. Provision Phone Number Manually**

If you created an agent without a phone number, add one later:

```http
POST /api/agents/{agent_id}/phone-number
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "area_code": "415",    // Optional
  "country": "US"        // Default: US
}
```

**Response:**
```json
{
  "message": "Phone number +14155551234 provisioned successfully",
  "phone_number": "+14155551234",
  "phone_number_sid": "PNxxxxxxxxxxxxx",
  "friendly_name": "(415) 555-1234",
  "capabilities": {
    "voice": true,
    "sms": false,
    "mms": false
  },
  "status": "active"
}
```

---

### **3. List All Your Phone Numbers**

```http
GET /api/agents/phone-numbers
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "phone_numbers": [
    {
      "phone_number": "+12125551234",
      "agent_id": "agent_xxx",
      "status": "active",
      "provisioned_at": "2025-11-10T12:00:00Z"
    },
    {
      "phone_number": "+14155555678",
      "agent_id": "agent_yyy",
      "status": "active",
      "provisioned_at": "2025-11-10T13:00:00Z"
    }
  ],
  "total": 2
}
```

---

### **4. Release a Phone Number**

Return a number back to Twilio (stop paying for it):

```http
DELETE /api/agents/{agent_id}/phone-number
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Phone number +12125551234 released successfully"
}
```

---

## Setup Instructions

### Step 1: Run Database Migration

Execute the new migration to add phone number fields:

```sql
-- In Supabase SQL Editor:
-- Run: backend/migrations/001_add_phone_numbers.sql
```

### Step 2: Configure Twilio Credentials

Add your Twilio credentials to `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Webhook base URL (your deployed backend URL)
WEBHOOK_BASE_URL=https://your-backend.com
```

### Step 3: Test Phone Number Provisioning

```bash
# 1. Create an agent (will auto-provision number)
curl -X POST http://localhost:8000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "Test Agent",
    "area_code": "212"
  }'

# 2. Check your phone numbers
curl http://localhost:8000/api/agents/phone-numbers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Cost Structure

### Per Client Costs

| Item | Provider | Cost |
|------|----------|------|
| Phone Number | Twilio | ~$1/month |
| Incoming Calls | Twilio | $0.0085/min |
| AI Voice Processing | ElevenLabs | Per plan |

**Example:**
- 10 clients × $1/month = $10/month for numbers
- 1,000 minutes × $0.0085 = $8.50 for calls
- **Total**: ~$18.50/month base + ElevenLabs fees

---

## Call Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Incoming Phone Call                      │
│                  +1-212-555-0001 is called                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Twilio Receives Call                      │
│          Sends webhook to: /api/webhooks/call/incoming       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Vami Backend Webhook Handler                   │
│    Looks up: agents table WHERE phone_number = +12125550001  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Found: Agent A (Client A)                   │
│         Routes call to Agent A's ElevenLabs agent_id         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 ElevenLabs AI Agent Responds                 │
│        "Thank you for calling Dr. Smith's office..."         │
└─────────────────────────────────────────────────────────────┘
```

---

## Security & Privacy

### Number Isolation
- ✅ Each client's calls are completely isolated
- ✅ No cross-client data leakage
- ✅ Row Level Security (RLS) enforced in database

### Data Protection
```sql
-- Users can only see their own phone numbers
CREATE POLICY "Users can view own phone numbers"
    ON phone_numbers FOR SELECT
    USING (auth.uid() = user_id);
```

---

## Scalability

### Current Limits
- **Twilio**: Unlimited phone numbers (purchase as needed)
- **Database**: Can handle millions of phone number records
- **Concurrent Calls**: Limited by plan (1-50 concurrent)

### Auto-Scaling Strategy
```python
# System automatically provisions numbers as needed
new_client_signup()
  → create_agent()
    → provision_phone_number()
      → twilio.buy_number()
      → store_in_database()
```

---

## Testing

### Test Provisioning Locally

```bash
# 1. Start backend
cd backend && uvicorn app.main:app --reload

# 2. Create test agent with phone
POST http://localhost:8000/api/agents
{
  "agent_name": "Test Agent",
  "provision_phone": true,
  "area_code": "212"
}

# 3. Check database
SELECT * FROM agents WHERE user_id = 'your_user_id';
SELECT * FROM phone_numbers WHERE user_id = 'your_user_id';
```

### Test Call Routing

```bash
# Simulate incoming call webhook
POST http://localhost:8000/api/webhooks/call/incoming
{
  "To": "+12125551234",
  "From": "+19175551234",
  "CallSid": "CAxxxxx"
}
```

---

## Migration Guide

### For Existing Users

If you already have users/agents, migrate them:

```sql
-- Option 1: Provision numbers via API for each user
-- (Recommended - automatic with proper webhooks)

-- Option 2: Bulk provision via script
-- See: scripts/provision_numbers.py
```

---

## Troubleshooting

### Issue: "No available phone numbers"
**Solution**: Change area code or country
```python
provision_phone_number(area_code="415")  # Try different area
```

### Issue: "Phone number already exists"
**Solution**: Agent already has a number
```bash
# Check existing numbers
GET /api/agents/{agent_id}
```

### Issue: "Webhook not receiving calls"
**Solution**: Update Twilio webhook URL
```bash
# In Twilio Console → Phone Numbers → Your Number
Voice URL: https://your-backend.com/api/webhooks/call/incoming
Method: POST
```

---

## Future Enhancements

### Planned Features
- [ ] Multiple numbers per agent
- [ ] Number porting (bring your own number)
- [ ] SMS/MMS support
- [ ] International numbers
- [ ] Number pooling for high-volume clients
- [ ] Call forwarding and routing rules

---

## Support

For issues with phone number provisioning:
- Check Twilio logs: https://console.twilio.com/logs
- Check backend logs: `docker logs backend`
- Verify database: `SELECT * FROM phone_numbers`

---

## Summary

✅ **Each client gets their own phone number**
✅ **Numbers are automatically provisioned**
✅ **Stored in database for quick routing**
✅ **Calls route to correct agent**
✅ **Fully isolated and secure**

Your platform now supports true multi-tenant phone infrastructure!
