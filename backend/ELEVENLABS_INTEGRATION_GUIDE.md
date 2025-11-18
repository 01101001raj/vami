# ElevenLabs Integration Guide
## How Vami AI Agents Access Real-Time Appointment Data

## 🎯 The Problem You Identified

**Scenario**: A customer calls your clinic and asks:
> "Do you have any appointments available on December 15th?"

**The Challenge**: How does the ElevenLabs voice AI know what appointments are booked?

## ✅ The Solution

We've implemented **Agent Actions API** - special endpoints that ElevenLabs AI agents can call during phone conversations to access real-time data.

## 🔧 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CUSTOMER                              │
│                  (On Phone Call)                         │
└────────────────────┬─────────────────────────────────────┘
                     │ Voice
                     ▼
┌──────────────────────────────────────────────────────────┐
│              ELEVENLABS AI AGENT                         │
│  "Let me check our availability for December 15th..."   │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTP API Call
                     ▼
┌──────────────────────────────────────────────────────────┐
│         VAMI AGENT ACTIONS API                           │
│   POST /api/agent-actions/check-availability/{agent_id}  │
│   - Queries Supabase appointments table                  │
│   - Returns available time slots                         │
└────────────────────┬─────────────────────────────────────┘
                     │ Returns JSON
                     ▼
┌──────────────────────────────────────────────────────────┐
│              ELEVENLABS AI AGENT                         │
│  "We have slots available at 9am, 11am, and 2pm"        │
└────────────────────┬─────────────────────────────────────┘
                     │ Voice
                     ▼
┌──────────────────────────────────────────────────────────┐
│                    CUSTOMER                              │
│          "Great! I'll take the 2pm slot"                 │
└──────────────────────────────────────────────────────────┘
```

## 📋 Implemented Endpoints

### 1. Check Availability
**POST** `/api/agent-actions/check-availability/{agent_id}`

Checks what appointment slots are available for a specific date.

**Request**:
```json
{
  "date": "2024-12-15",
  "time": "14:00",  // optional
  "duration_minutes": 30
}
```

**Headers**:
```
X-Agent-Token: {agent_specific_token}
```

**Response**:
```json
{
  "date": "2024-12-15",
  "total_slots": 16,
  "available_slots": 12,
  "slots": [
    {
      "date": "2024-12-15",
      "start_time": "09:00",
      "end_time": "09:30",
      "available": true
    },
    {
      "start_time": "11:00",
      "end_time": "11:30",
      "available": true
    }
  ],
  "message": "Found 12 available slots on 2024-12-15"
}
```

### 2. Book Appointment
**POST** `/api/agent-actions/book-appointment/{agent_id}`

Books an appointment during the conversation.

**Request**:
```json
{
  "date": "2024-12-15",
  "start_time": "14:00",
  "duration_minutes": 30,
  "customer_name": "John Doe",
  "customer_phone": "+1234567890",
  "customer_email": "john@example.com",
  "notes": "First time patient"
}
```

**Response**:
```json
{
  "success": true,
  "appointment_id": "uuid-here",
  "date": "2024-12-15",
  "start_time": "14:00",
  "message": "Appointment booked successfully for John Doe on 2024-12-15 at 14:00"
}
```

### 3. Get Today's Appointments
**GET** `/api/agent-actions/appointments/{agent_id}/today`

Gets all appointments for today (useful for context).

**Response**:
```json
{
  "date": "2024-12-15",
  "total_appointments": 5,
  "appointments": [
    {
      "time": "09:00",
      "customer_name": "Jane Smith",
      "status": "scheduled"
    },
    {
      "time": "10:30",
      "customer_name": "Bob Johnson",
      "status": "confirmed"
    }
  ]
}
```

## 🔐 Authentication

Agent Actions use **agent-specific tokens** instead of user authentication:

1. Each agent gets a unique API token stored in the database
2. ElevenLabs includes this token in the `X-Agent-Token` header
3. The endpoint verifies the token before allowing access

**Security**:
- Tokens are stored in the `agents` table
- Constant-time comparison prevents timing attacks
- Each agent can only access their own clinic's data

## 🔨 Configuring ElevenLabs

### Step 1: Enable Function Calling in ElevenLabs

In your ElevenLabs agent configuration:

```json
{
  "name": "Clinic Receptionist",
  "first_message": "Hello! This is the clinic. How can I help you today?",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "check_availability",
        "description": "Check available appointment slots for a specific date",
        "parameters": {
          "type": "object",
          "properties": {
            "date": {
              "type": "string",
              "description": "Date in YYYY-MM-DD format"
            },
            "duration_minutes": {
              "type": "integer",
              "default": 30
            }
          },
          "required": ["date"]
        }
      },
      "server": {
        "url": "https://your-vami-backend.com/api/agent-actions/check-availability/{agent_id}",
        "method": "POST",
        "headers": {
          "X-Agent-Token": "your_agent_token_here"
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "book_appointment",
        "description": "Book an appointment for a customer",
        "parameters": {
          "type": "object",
          "properties": {
            "date": {"type": "string"},
            "start_time": {"type": "string"},
            "duration_minutes": {"type": "integer"},
            "customer_name": {"type": "string"},
            "customer_phone": {"type": "string"},
            "customer_email": {"type": "string"}
          },
          "required": ["date", "start_time", "customer_name", "customer_phone"]
        }
      },
      "server": {
        "url": "https://your-vami-backend.com/api/agent-actions/book-appointment/{agent_id}",
        "method": "POST",
        "headers": {
          "X-Agent-Token": "your_agent_token_here"
        }
      }
    }
  ]
}
```

### Step 2: Update Agent Prompt

Give the AI agent context about using these tools:

```
You are a friendly receptionist for [Clinic Name]. You can:

1. Check appointment availability - Use the check_availability function when customers ask about available times
2. Book appointments - Use the book_appointment function when customers want to schedule
3. Provide information about the clinic

When checking availability:
- Always ask for the customer's preferred date
- Offer multiple available slots if possible
- Be flexible and suggest alternative times if their preferred slot is taken

When booking appointments:
- Collect: name, phone number, preferred date and time
- Confirm all details before booking
- Provide a confirmation once booked

Example conversation:
Customer: "Do you have any appointments available on December 15th?"
You: *calls check_availability* "Yes! We have several slots available. We have 9am, 11am, 2pm, and 4pm open. Which time works best for you?"
Customer: "2pm works great"
You: "Perfect! Can I get your name and phone number to book that for you?"
Customer: "John Doe, 555-1234"
You: *calls book_appointment* "Great! I've booked you for 2pm on December 15th. You'll receive a confirmation shortly. Is there anything else I can help you with?"
```

## 💾 Database Schema

The appointment data is stored in Supabase:

```sql
-- Appointments table (already created in migrations)
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),  -- The clinic owner
    title VARCHAR(500),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),  -- 'scheduled', 'confirmed', 'cancelled'
    attendee_name VARCHAR(255),
    attendee_phone VARCHAR(50),
    attendee_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);

-- Agent tokens stored in agents table
ALTER TABLE agents ADD COLUMN api_token VARCHAR(255);
```

## 🚀 Testing the Integration

### Test Availability Check

```bash
curl -X POST http://localhost:8000/api/agent-actions/check-availability/your_agent_id \
  -H "X-Agent-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-15",
    "duration_minutes": 30
  }'
```

### Test Booking

```bash
curl -X POST http://localhost:8000/api/agent-actions/book-appointment/your_agent_id \
  -H "X-Agent-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-15",
    "start_time": "14:00",
    "duration_minutes": 30,
    "customer_name": "Test Customer",
    "customer_phone": "+1234567890",
    "customer_email": "test@example.com"
  }'
```

## 📊 How It Works End-to-End

1. **Customer Calls**: Customer calls the clinic number
2. **ElevenLabs Answers**: AI agent picks up and greets the customer
3. **Customer Asks**: "Do you have appointments on December 15th?"
4. **AI Processes**: Natural language understanding detects appointment query
5. **Function Call**: AI calls `check_availability` with date="2024-12-15"
6. **Vami Queries DB**: API checks appointments table in Supabase
7. **Returns Slots**: API returns available time slots
8. **AI Responds**: "Yes! We have 9am, 11am, and 2pm available"
9. **Customer Books**: "I'll take 2pm"
10. **AI Books**: Calls `book_appointment` with details
11. **Vami Saves**: Creates appointment record in database
12. **Confirmation**: AI confirms "Booked! You're all set for 2pm on December 15th"

## 🔄 Real-Time Sync

The system ensures real-time accuracy:

- ✅ Each API call queries the live database
- ✅ Double-booking is prevented with conflict checking
- ✅ Appointments made through the web UI are immediately available to the AI
- ✅ AI-booked appointments appear instantly in the dashboard

## 🔑 Agent Token Management

### Get Agent API Token

**GET** `/api/agents/{agent_id}/api-token`

Get the API token for your agent to use in ElevenLabs configuration.

**Headers**:
```
Authorization: Bearer {your_jwt_token}
```

**Response**:
```json
{
  "agent_id": "agent_clinic_receptionist",
  "api_token": "vami_agent_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "token_preview": "vami_agent_x...xxxxxx",
  "message": "Use this token in the X-Agent-Token header when configuring ElevenLabs function calling"
}
```

### Regenerate Agent Token

**POST** `/api/agents/{agent_id}/regenerate-token`

Regenerate the API token if it's been compromised.

⚠️ **WARNING**: This invalidates the old token immediately. You must update the token in your ElevenLabs configuration.

**Headers**:
```
Authorization: Bearer {your_jwt_token}
```

**Response**:
```json
{
  "agent_id": "agent_clinic_receptionist",
  "api_token": "vami_agent_new_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "token_preview": "vami_agent_n...xxxxxx",
  "message": "Token regenerated successfully. Update this token in your ElevenLabs agent configuration."
}
```

### Token Auto-Generation

✅ **Automatic**: Agent tokens are automatically generated when an agent is created during subscription setup.

The token is stored securely in the database and used for authenticating agent action API calls.

## 📝 Next Steps

1. **Get Your Agent Token** ✅ READY:
   - Call `GET /api/agents/{agent_id}/api-token`
   - Copy the full `api_token` value
   - Store it securely

2. **Configure ElevenLabs**:
   - Add function definitions to your ElevenLabs agent
   - Include the agent token in the `X-Agent-Token` header
   - Update agent prompt with tool usage instructions

3. **Test**:
   - Make a test call
   - Ask about availability
   - Book an appointment
   - Verify it appears in the dashboard

4. **Enhance**:
   - Add cancellation function
   - Add rescheduling function
   - Add customer lookup by phone
   - Add SMS confirmations

## 🎉 Result

Your ElevenLabs AI agent now has **full access to real-time appointment data** and can:
- ✅ Check availability
- ✅ Book appointments
- ✅ Provide accurate information
- ✅ Handle the entire booking flow autonomously

All while the data stays synchronized with your Vami dashboard! 🚀
