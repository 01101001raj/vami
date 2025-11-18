# Vami Platform - Centralized Multi-Tenant System

## Architecture Overview

### Core Concept
**One Master Account System** where:
- ✅ **One ElevenLabs Enterprise Account** → Creates agents for all customers
- ✅ **One Twilio Account** → Pool of phone numbers shared across customers
- ✅ **Centralized Management** → Admin buys numbers in bulk, customers pick from pool
- ✅ **Per-Customer Agents** → Each customer gets their own ElevenLabs agent with custom prompts

---

## System Flow

### 1. **Admin Setup** (One-time)
```
Admin → Twilio → Buy 100 phone numbers → Pool created
```
- Admin purchases phone numbers in bulk from Twilio
- Numbers stored in Twilio account
- Database tracks which numbers are "available" vs "assigned"

### 2. **Customer Onboarding** (4 Simple Steps)
```
Customer Sign Up
    ↓
Step 1: Business Info (name, industry)
    ↓
Step 2: Choose Phone Number (from available pool)
    ↓
Step 3: Configure Agent (name, greeting, personality)
    ↓
Step 4: Upload Knowledge Base (optional documents/FAQs)
    ↓
DONE! → Agent is live and receiving calls
```

### 3. **Call Flow** (Automatic)
```
Patient calls phone number
    ↓
Twilio receives call
    ↓
Twilio webhook → ElevenLabs Agent (via agent_id)
    ↓
ElevenLabs Agent answers with:
    - Custom voice
    - Custom prompt
    - Customer's knowledge base
    ↓
Conversation happens
    ↓
Conversation saved to database
```

---

## Database Schema

### `agents` table
```sql
- id (primary key)
- user_id (foreign key → users)
- agent_id (ElevenLabs agent ID)
- agent_name
- prompt (custom instructions)
- first_message (greeting)
- voice_id
- phone_number
- phone_number_sid
- status (active/inactive)
- knowledge_base_files (JSON array)
- created_at
```

### `phone_numbers` table
```sql
- id (primary key)
- phone_number (+1234567890)
- phone_number_sid (Twilio SID)
- user_id (foreign key → users, NULL if unassigned)
- agent_id (foreign key → agents, NULL if unassigned)
- status (available/assigned/suspended)
- assigned_at
- provider (always "twilio")
```

---

## API Endpoints

### Phone Number Management

**List Available Numbers** (for customer selection)
```
GET /api/phone-numbers/available
Response: [
  {
    "phone_number": "+12125551234",
    "phone_number_sid": "PNxxx",
    "locality": "New York",
    "region": "NY",
    "is_assigned": false
  }
]
```

**Assign Number to Agent**
```
POST /api/phone-numbers/assign
Body: {
  "phone_number": "+12125551234",
  "phone_number_sid": "PNxxx",
  "agent_id": "agent_xyz123"
}
```

**List Owned Numbers** (admin view)
```
GET /api/phone-numbers/owned
Shows ALL numbers with assignment status
```

### Agent Management

**Create Agent**
```
POST /api/agents
Body: {
  "agent_name": "Dr. Smith's Assistant",
  "prompt": "You are a helpful medical receptionist...",
  "first_message": "Hello! Thank you for calling Dr. Smith's office...",
  "voice_id": "21m00Tcm4TlvDq8ikWAM"
}
Response: {
  "agent_id": "agent_xyz123",
  "status": "active"
}
```

---

## 4-Step Onboarding Implementation

### Step 1: Business Information
**What customer enters:**
- Company/Practice name
- Industry (Healthcare, Legal, Real Estate, etc.)
- Primary contact

**What happens:**
- Data saved to user profile
- Used to customize agent personality

### Step 2: Pick Phone Number
**What customer sees:**
- List of available phone numbers
- Filter by area code
- See location (city, state)

**What happens:**
- Customer selects desired number
- Number reserved (not yet assigned)
- Moves to next step

### Step 3: Configure Agent
**What customer enters:**
- Agent name (e.g., "Sarah")
- Greeting message
- Voice selection (preview available voices)
- Basic personality (friendly, professional, casual)

**What happens:**
- ElevenLabs agent created in YOUR account
- Agent configured with customer's preferences
- Agent ID returned

### Step 4: Knowledge Base (Optional)
**What customer can do:**
- Upload documents (PDF, DOCX, TXT)
- Add FAQs manually
- Provide website URL for scraping

**What happens:**
- Files uploaded to storage
- Content indexed for RAG
- Agent can now answer specific questions

### Final Step: Assignment
**What happens automatically:**
- Phone number assigned to agent
- Twilio webhook updated to point to agent
- Database records created
- Customer redirected to dashboard

**Customer sees:**
- "Your agent is live!"
- Phone number displayed
- "Call now to test" button
- Dashboard with analytics

---

## Technical Details

### Twilio → ElevenLabs Connection

When a call comes in:
1. Twilio receives call on assigned number
2. Twilio looks up webhook URL (set during assignment)
3. Webhook URL: `https://api.elevenlabs.io/v1/convai/conversation/phone/{agent_id}`
4. ElevenLabs agent answers with configured voice/prompt
5. Conversation handled by ElevenLabs
6. Webhook callbacks sent to Vami for logging

### Phone Number Assignment Process

```python
# When customer picks a number
await phone_service.assign_phone_number(
    user_id=current_user.id,
    agent_id=created_agent.agent_id,
    phone_number="+12125551234",
    phone_number_sid="PNxxx"
)

# This does:
1. Check if number is available
2. Update Twilio webhook: number → agent
3. Create database record: phone_numbers table
4. Update agents table with phone number
5. Return success
```

### Knowledge Base Integration

```python
# Upload files
files = await upload_knowledge_base_files(agent_id, files)

# Process files
for file in files:
    content = extract_text(file)
    chunks = chunk_text(content)
    embeddings = create_embeddings(chunks)
    store_in_vector_db(agent_id, embeddings)

# ElevenLabs RAG
# When agent receives question:
# 1. Find relevant chunks in knowledge base
# 2. Include in prompt context
# 3. Generate answer using retrieved info
```

---

## Cost Management

### Phone Numbers
- **Cost per number**: ~$1/month (Twilio)
- **Strategy**: Buy 100 numbers = $100/month
- **Customer pricing**: $5-10/month per number
- **Profit margin**: 5-10x

### ElevenLabs
- **One enterprise account**: ~$99-299/month
- **Unlimited agents**: No per-agent cost
- **Usage-based**: Pay per minute of conversation
- **Customer pricing**: Charge per minute + markup

---

## Security & Isolation

### Per-Customer Isolation
- ✅ Each customer has unique `agent_id`
- ✅ Phone number tied to specific agent
- ✅ Calls routed only to customer's agent
- ✅ Knowledge base scoped to agent_id
- ✅ No cross-customer data leakage

### Database RLS
```sql
-- Users can only see their own agents
CREATE POLICY users_own_agents ON agents
FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their assigned phone numbers
CREATE POLICY users_own_numbers ON phone_numbers
FOR SELECT USING (auth.uid() = user_id);
```

---

## Admin Features

### Bulk Number Purchase
```
Admin Dashboard → Buy Numbers Tab
- Search Twilio marketplace
- Filter by area code/state
- Buy in bulk (10, 50, 100)
- Numbers automatically added to pool
```

### Number Pool Management
```
Admin Dashboard → Number Pool Tab
- View all owned numbers
- See assignment status
- Reassign numbers if needed
- Release/delete unused numbers
```

### Agent Monitoring
```
Admin Dashboard → All Agents Tab
- See all customer agents
- View usage statistics
- Monitor call volume
- Identify issues
```

---

## Customer Experience

### Simple Interface
- No technical knowledge required
- 4 steps, ~5 minutes to complete
- Visual number selection
- Voice previews
- Instant activation

### Self-Service
- Choose own phone number
- Customize agent personality
- Upload knowledge base
- Test immediately
- Manage from dashboard

### Support
- Live chat during onboarding
- Video tutorials
- Help center
- "Test call" feature

---

## Next Steps

1. ✅ Backend API complete
2. 🔄 Build 4-step onboarding UI (in progress)
3. ⏳ Add knowledge base upload
4. ⏳ Admin dashboard for number management
5. ⏳ Voice preview feature
6. ⏳ Test call functionality
