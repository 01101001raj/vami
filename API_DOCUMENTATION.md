# Vami Platform API Documentation

Complete API reference for the Vami Platform backend.

**Base URL**: `https://api.vami.app` (production) or `http://localhost:8000` (development)

**API Version**: v1

**Authentication**: Bearer token (JWT)

---

## 📚 Table of Contents

1. [Authentication](#authentication)
2. [Agents](#agents)
3. [Knowledge Base](#knowledge-base)
4. [Analytics](#analytics)
5. [Billing](#billing)
6. [Team](#team)
7. [Calendar](#calendar)
8. [Calls](#calls)
9. [Settings](#settings)
10. [Integrations](#integrations)
11. [Webhooks](#webhooks)

---

## 🔐 Authentication

### Register

Create a new user account.

```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "company_name": "Acme Medical"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "company_name": "Acme Medical",
  "created_at": "2025-11-08T10:00:00Z"
}
```

---

### Login

Authenticate and receive access token.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "company_name": "Acme Medical",
    "plan": "professional"
  },
  "agent": {
    "agent_id": "agent_123",
    "agent_name": "Acme Medical Agent",
    "status": "active"
  },
  "features": {
    "minutes_limit": 4200,
    "concurrent_calls": 10,
    ...
  }
}
```

---

### Get Current User

Get authenticated user's profile.

```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "company_name": "Acme Medical",
  "plan": "professional",
  "subscription_status": "active",
  "features": {...}
}
```

---

### Logout

Invalidate current session.

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

---

## 🤖 Agents

### Get Agent

Get user's agent details.

```http
GET /api/agents
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "agent_id": "agent_clinic_receptionist",
  "agent_name": "Acme Medical Agent",
  "status": "active",
  "elevenlabs_metadata": {...},
  "created_at": "2025-11-08T10:00:00Z"
}
```

---

### Update Agent

Update agent configuration.

```http
PUT /api/agents/{agent_id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "agent_name": "Updated Agent Name"
}
```

**Response:** `200 OK`

---

### Get Agent API Token

Get the API token for agent actions (ElevenLabs integration).

```http
GET /api/agents/{agent_id}/api-token
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "agent_id": "agent_clinic_receptionist",
  "api_token": "vami_agent_xJ8kL9mN3pQ5rS7tU2vW4yZ6aB8cD0eF1gH3iJ5kL7mN9pQ",
  "token_preview": "vami_agent_x...9pQ",
  "message": "Use this token in the X-Agent-Token header when configuring ElevenLabs function calling"
}
```

---

### Regenerate Agent Token

Generate a new API token (invalidates old one).

```http
POST /api/agents/{agent_id}/regenerate-token
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "agent_id": "agent_clinic_receptionist",
  "api_token": "vami_agent_NEW_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "token_preview": "vami_agent_N...xxx",
  "message": "Token regenerated successfully. Update this token in your ElevenLabs agent configuration."
}
```

---

## 📚 Knowledge Base

### Upload File

Upload a document to the knowledge base.

```http
POST /api/agents/knowledge-base/upload?agent_id={agent_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request:**
- `file`: File (PDF, DOCX, TXT, CSV, JSON, XLSX)
- Max size: 10MB

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "filename": "pricing.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "storage_url": "https://...",
  "uploaded_at": "2025-11-08T10:00:00Z",
  "processed": false
}
```

---

### List Files

Get all knowledge base files for an agent.

```http
GET /api/agents/knowledge-base/files?agent_id={agent_id}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "filename": "pricing.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "uploaded_at": "2025-11-08T10:00:00Z",
    "processed": true
  }
]
```

---

### Delete File

Delete a knowledge base file.

```http
DELETE /api/agents/knowledge-base/{file_id}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "File deleted successfully"
}
```

---

## 📊 Analytics

### Get Stats

Get analytics statistics for a time period.

```http
GET /api/analytics/stats?days=7
Authorization: Bearer {token}
```

**Query Parameters:**
- `days`: Number of days to include (default: 7)

**Response:** `200 OK`
```json
{
  "total_calls": 156,
  "total_minutes": 387,
  "average_duration": 149,
  "successful_calls": 142,
  "failed_calls": 14,
  "appointments_booked": 23,
  "sentiment_breakdown": {
    "positive": 89,
    "neutral": 45,
    "negative": 22
  },
  "intent_breakdown": {
    "appointment": 78,
    "question": 56,
    "complaint": 22
  }
}
```

---

### Get Conversations

Get paginated list of conversations.

```http
GET /api/analytics/conversations?page=1&per_page=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "total": 156,
  "page": 1,
  "per_page": 20,
  "conversations": [
    {
      "id": 1,
      "conversation_id": "conv_abc123",
      "duration_secs": 180,
      "call_successful": "success",
      "summary": "Patient called to book an appointment...",
      "title": "Appointment Booking",
      "sentiment": "positive",
      "intent": "appointment",
      "created_at": "2025-11-08T10:00:00Z"
    }
  ]
}
```

---

### Get Conversation Detail

Get detailed information about a specific conversation.

```http
GET /api/analytics/conversation/{conversation_id}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "conversation_id": "conv_abc123",
  "agent_id": "agent_clinic",
  "end_user_id": "+1234567890",
  "duration_secs": 180,
  "call_successful": "success",
  "summary": "Patient called to book an appointment for next Tuesday at 2 PM",
  "title": "Appointment Booking",
  "sentiment": "positive",
  "intent": "appointment",
  "webhook_payload": {...},
  "created_at": "2025-11-08T10:00:00Z"
}
```

---

## 💳 Billing

### Get Subscription

Get current subscription details.

```http
GET /api/billing/subscription
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "plan": "professional",
  "status": "active",
  "current_period_end": "2025-12-08T10:00:00Z",
  "stripe_customer_id": "cus_xxx",
  "stripe_subscription_id": "sub_xxx"
}
```

---

### Get Usage

Get current billing period usage.

```http
GET /api/billing/usage
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "period_start": "2025-11-01",
  "period_end": "2025-11-30",
  "minutes_used": 387.5,
  "minutes_limit": 4200,
  "usage_percentage": 9.2,
  "conversations_count": 156
}
```

---

### Create Checkout Session

Create Stripe checkout session for subscription.

```http
POST /api/billing/create-checkout
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "price_id": "price_professional_monthly"
}
```

**Response:** `200 OK`
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_...",
  "session_id": "cs_..."
}
```

---

### Change Plan

Change subscription plan.

```http
POST /api/billing/change-plan
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "new_price_id": "price_premium_monthly"
}
```

**Response:** `200 OK`
```json
{
  "message": "Plan change scheduled",
  "effective_date": "2025-12-08T10:00:00Z"
}
```

---

### Cancel Subscription

Cancel subscription (at period end).

```http
POST /api/billing/cancel
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Subscription will cancel on 2025-12-08",
  "cancellation_date": "2025-12-08T10:00:00Z"
}
```

---

### Get Billing Portal URL

Get URL to Stripe customer portal.

```http
POST /api/billing/portal
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "portal_url": "https://billing.stripe.com/p/session/..."
}
```

---

## 👥 Team

### Get Team Members

Get all team members.

```http
GET /api/team/members
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "member@example.com",
    "role": "editor",
    "status": "active",
    "joined_at": "2025-11-05T10:00:00Z"
  }
]
```

---

### Invite Team Member

Send invitation to new team member.

```http
POST /api/team/invite
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "viewer"
}
```

**Roles:**
- `admin`: Full access
- `editor`: Can manage knowledge base, view analytics
- `viewer`: Read-only access

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "newmember@example.com",
  "role": "viewer",
  "invitation_token": "token_xxx",
  "expires_at": "2025-11-15T10:00:00Z"
}
```

---

### Remove Team Member

Remove a team member.

```http
DELETE /api/team/members/{member_id}
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Team member removed successfully"
}
```

---

## 📅 Calendar

### Get Google OAuth URL

Get URL to start Google Calendar OAuth flow.

```http
GET /api/integrations/google/auth-url
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "state_token_for_csrf"
}
```

---

### OAuth Callback

Handle OAuth callback (called by Google, not directly).

```http
POST /api/integrations/google/callback
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "code": "oauth_code_from_google",
  "state": "state_token"
}
```

**Response:** `200 OK`

---

### Disconnect Calendar

Disconnect Google Calendar integration.

```http
DELETE /api/integrations/google/disconnect
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Calendar disconnected successfully"
}
```

---

## 📞 Calls

### Create Call

Schedule or initiate an outbound call.

```http
POST /api/calls
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "phone_number": "+1234567890",
  "scheduled_at": "2025-11-08T14:00:00Z"  // Optional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "phone_number": "+1234567890",
  "status": "scheduled",
  "scheduled_at": "2025-11-08T14:00:00Z",
  "created_at": "2025-11-08T10:00:00Z"
}
```

---

### Get Calls

Get list of outbound calls.

```http
GET /api/calls?status=completed&page=1&per_page=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `status`: Filter by status (pending/in_progress/completed/failed)
- `page`: Page number
- `per_page`: Items per page

**Response:** `200 OK`

---

## ⚙️ Settings

### Get Notification Preferences

Get user's notification settings.

```http
GET /api/settings/notifications
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "email_notifications": {
    "new_conversation": true,
    "appointment_booked": true,
    "usage_limit_warning": true,
    "payment_failed": true,
    "weekly_summary": true
  },
  "sms_notifications": {
    "critical_alerts": true
  }
}
```

---

### Update Notification Preferences

Update notification settings.

```http
PUT /api/settings/notifications
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "email_notifications": {
    "new_conversation": false,
    "appointment_booked": true
  }
}
```

**Response:** `200 OK`

---

### Create API Key

Create a new API key for external integrations.

```http
POST /api/settings/api-keys
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "My Integration",
  "permissions": ["read", "write"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "My Integration",
  "full_key": "vami_sk_xxxxxxxxx",  // Only shown once!
  "key_preview": "vami_sk_xxx...xxx",
  "created_at": "2025-11-08T10:00:00Z"
}
```

---

## 🔗 Agent Actions API

**These endpoints are called by ElevenLabs agents (not users)**

**Authentication**: `X-Agent-Token` header with agent's API token

### Check Availability

Check appointment availability.

```http
POST /api/agent-actions/check-availability/{agent_id}
X-Agent-Token: vami_agent_xxx
```

**Request Body:**
```json
{
  "date": "2025-11-15",
  "duration_minutes": 30
}
```

**Response:** `200 OK`
```json
{
  "date": "2025-11-15",
  "available_slots": 8,
  "slots": [
    {
      "start_time": "09:00",
      "end_time": "09:30",
      "available": true
    },
    {
      "start_time": "10:00",
      "end_time": "10:30",
      "available": true
    }
  ]
}
```

---

### Book Appointment

Book an appointment during a call.

```http
POST /api/agent-actions/book-appointment/{agent_id}
X-Agent-Token: vami_agent_xxx
```

**Request Body:**
```json
{
  "patient_name": "John Doe",
  "patient_phone": "+1234567890",
  "patient_email": "john@example.com",
  "date": "2025-11-15",
  "time": "14:00",
  "duration_minutes": 30,
  "reason": "Annual checkup"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "appointment_id": "uuid",
  "confirmation": "Appointment booked for November 15th at 2:00 PM"
}
```

---

### Get Today's Appointments

Get today's appointment schedule.

```http
GET /api/agent-actions/appointments/{agent_id}/today
X-Agent-Token: vami_agent_xxx
```

**Response:** `200 OK`
```json
{
  "date": "2025-11-08",
  "total_appointments": 5,
  "appointments": [
    {
      "time": "09:00",
      "patient_name": "John Doe",
      "reason": "Annual checkup"
    }
  ]
}
```

---

## 🪝 Webhooks (External)

### Stripe Webhook

Receives Stripe events (subscription changes, payments).

```http
POST /api/webhooks/stripe
Stripe-Signature: {signature}
```

**Events Processed:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

### ElevenLabs Webhook

Receives post-call data from ElevenLabs.

```http
POST /api/webhooks/elevenlabs
```

**Request Body:**
```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_xxx",
    "agent_id": "agent_xxx",
    "duration_secs": 180,
    "call_successful": "success",
    "summary": "Patient booked appointment...",
    "transcript": [...],
    "sentiment": "positive",
    "intent": "appointment"
  }
}
```

**Response:** `200 OK`

---

## 🔴 Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid email format"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Agent not found"
}
```

### 429 Too Many Requests
```json
{
  "detail": "Rate limit exceeded: 60 requests per minute"
}
```

### 500 Internal Server Error
```json
{
  "detail": "An unexpected error occurred"
}
```

---

## 📊 Rate Limits

- **Per User**: 60 requests/minute, 1000 requests/hour
- **Per IP**: 100 requests/minute
- **Webhook Endpoints**: No rate limit

---

## 🔐 Authentication Details

### JWT Token

- **Algorithm**: HS256
- **Expiration**: 30 minutes
- **Header**: `Authorization: Bearer {token}`

### Refresh Token

- **Expiration**: 7 days
- Use to get new access token when expired

---

## 📝 API Versioning

Current version: **v1**

Future versions will use URL versioning:
- v1: `/api/...`
- v2: `/api/v2/...`

---

## 🧪 Testing

Interactive API docs available at:
- **Local**: http://localhost:8000/docs
- **Production**: https://api.vami.app/docs

---

## 📚 SDKs & Libraries

Coming soon:
- Python SDK
- JavaScript/TypeScript SDK
- PHP SDK

---

## 💬 Support

- **Documentation**: https://docs.vami.app
- **API Status**: https://status.vami.app
- **Email**: api@vami.app
- **Discord**: https://discord.gg/vami

---

**Last Updated**: November 2025
**API Version**: 1.0.0
