# Vami Platform - Complete API Specification

## Overview
Comprehensive API documentation for the Vami AI Voice Agent platform with complete security, validation, and workflow implementation.

## Architecture

### Tech Stack
- **Framework**: FastAPI 0.104+
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with HTTPOnly cookies
- **Payment**: Stripe
- **Voice AI**: ElevenLabs
- **Calendar**: Google Calendar API, Outlook API
- **Email**: SendGrid / AWS SES
- **SMS**: Twilio

### Security Features
- JWT authentication with refresh tokens
- Rate limiting (per IP and per user)
- Input validation with Pydantic
- SQL injection protection
- XSS protection
- CORS configuration
- Password hashing with bcrypt
- API key encryption
- Webhook signature verification

---

## API Endpoints

### 1. Authentication (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.
- **Body**: `{ email, password, company_name, plan }`
- **Returns**: `{ user, access_token, refresh_token }`
- **Rate Limit**: 5 per hour per IP

#### POST `/api/auth/login`
User login.
- **Body**: `{ email, password }`
- **Returns**: `{ user, access_token, refresh_token }`
- **Rate Limit**: 10 per 15 minutes per IP

#### POST `/api/auth/logout`
Logout user (invalidate tokens).
- **Auth Required**: Yes
- **Returns**: `{ message }`

#### GET `/api/auth/me`
Get current user profile.
- **Auth Required**: Yes
- **Returns**: `{ user_data }`

#### POST `/api/auth/forgot-password`
Request password reset.
- **Body**: `{ email }`
- **Returns**: `{ message }`
- **Rate Limit**: 3 per hour per IP

#### POST `/api/auth/reset-password`
Reset password with token.
- **Body**: `{ token, new_password }`
- **Returns**: `{ message }`

#### POST `/api/auth/refresh`
Refresh access token.
- **Body**: `{ refresh_token }`
- **Returns**: `{ access_token }`

---

### 2. Agent Management (`/api/agents`)

#### GET `/api/agents`
Get user's AI agent configuration.
- **Auth Required**: Yes
- **Returns**: `{ agent_data }`

#### POST `/api/agents`
Create/Update agent configuration.
- **Auth Required**: Yes
- **Body**: `{ agent_name, voice_id, personality, knowledge_base }`
- **Returns**: `{ agent }`

#### PUT `/api/agents/{agent_id}`
Update agent settings.
- **Auth Required**: Yes
- **Body**: `{ settings }`
- **Returns**: `{ agent }`

#### POST `/api/agents/knowledge-base/upload`
Upload knowledge base files.
- **Auth Required**: Yes
- **Body**: Multipart form data with files
- **Returns**: `{ uploaded_files, processed_count }`
- **Max File Size**: 10MB per file
- **Allowed Types**: PDF, DOCX, TXT

#### DELETE `/api/agents/knowledge-base/{file_id}`
Delete knowledge base file.
- **Auth Required**: Yes
- **Returns**: `{ message }`

---

### 3. Calls/Conversations (`/api/calls`)

#### GET `/api/calls`
Get list of calls with pagination.
- **Auth Required**: Yes
- **Query Params**: `page, per_page, status, sentiment, date_from, date_to`
- **Returns**: `{ calls[], total, page, per_page }`

#### GET `/api/calls/{call_id}`
Get detailed call information.
- **Auth Required**: Yes
- **Returns**: `{ call_data, transcript, recording_url }`

#### POST `/api/calls`
Initiate a new call.
- **Auth Required**: Yes
- **Body**: `{ phone_number, agent_id, context }`
- **Returns**: `{ call_id, status }`

#### POST `/api/calls/{call_id}/end`
End an active call.
- **Auth Required**: Yes
- **Returns**: `{ call_summary }`

#### GET `/api/calls/{call_id}/recording`
Get call recording URL.
- **Auth Required**: Yes
- **Returns**: `{ recording_url, expires_at }`

#### POST `/api/calls/{call_id}/feedback`
Submit call feedback.
- **Auth Required**: Yes
- **Body**: `{ rating, feedback_text }`
- **Returns**: `{ message }`

---

### 4. Analytics (`/api/analytics`)

#### GET `/api/analytics/stats`
Get overall statistics.
- **Auth Required**: Yes
- **Query Params**: `days` (default: 30)
- **Returns**: `{ total_conversations, successful_calls, avg_duration, appointments_booked }`

#### GET `/api/analytics/conversations`
Get conversation history with filters.
- **Auth Required**: Yes
- **Query Params**: `page, per_page, status, sentiment`
- **Returns**: `{ conversations[], pagination }`

#### GET `/api/analytics/export`
Export analytics data as CSV.
- **Auth Required**: Yes
- **Query Params**: `format, date_from, date_to`
- **Returns**: CSV file download

#### GET `/api/analytics/metrics/daily`
Get daily metrics for charts.
- **Auth Required**: Yes
- **Query Params**: `days`
- **Returns**: `{ dates[], call_counts[], success_rates[] }`

#### GET `/api/analytics/sentiment-analysis`
Get sentiment analysis breakdown.
- **Auth Required**: Yes
- **Returns**: `{ positive, neutral, negative, trends }`

---

### 5. Calendar Integration (`/api/calendar`)

#### GET `/api/calendar/appointments`
Get scheduled appointments.
- **Auth Required**: Yes
- **Query Params**: `date_from, date_to, status`
- **Returns**: `{ appointments[] }`

#### POST `/api/calendar/appointments`
Create new appointment.
- **Auth Required**: Yes
- **Body**: `{ title, date, time, duration, attendees, location }`
- **Returns**: `{ appointment }`

#### PUT `/api/calendar/appointments/{appointment_id}`
Update appointment.
- **Auth Required**: Yes
- **Body**: `{ appointment_data }`
- **Returns**: `{ appointment }`

#### DELETE `/api/calendar/appointments/{appointment_id}`
Cancel appointment.
- **Auth Required**: Yes
- **Returns**: `{ message }`

#### POST `/api/calendar/connect/google`
Connect Google Calendar.
- **Auth Required**: Yes
- **Body**: `{ authorization_code }`
- **Returns**: `{ connected: true }`

#### POST `/api/calendar/connect/outlook`
Connect Outlook Calendar.
- **Auth Required**: Yes
- **Body**: `{ authorization_code }`
- **Returns**: `{ connected: true }`

#### GET `/api/calendar/availability`
Get user's availability.
- **Auth Required**: Yes
- **Query Params**: `date`
- **Returns**: `{ available_slots[] }`

---

### 6. Team Management (`/api/team`)

#### GET `/api/team/members`
Get team members list.
- **Auth Required**: Yes
- **Returns**: `{ members[] }`

#### POST `/api/team/invite`
Invite team member.
- **Auth Required**: Yes (Admin/Owner only)
- **Body**: `{ email, role }`
- **Returns**: `{ invitation }`
- **Roles**: owner, admin, member

#### DELETE `/api/team/members/{user_id}`
Remove team member.
- **Auth Required**: Yes (Admin/Owner only)
- **Returns**: `{ message }`

#### PUT `/api/team/members/{user_id}/role`
Update member role.
- **Auth Required**: Yes (Owner only)
- **Body**: `{ role }`
- **Returns**: `{ member }`

#### POST `/api/team/invitations/{token}/accept`
Accept team invitation.
- **Auth Required**: No
- **Body**: `{ token }`
- **Returns**: `{ message }`

#### GET `/api/team/permissions`
Get role permissions matrix.
- **Auth Required**: Yes
- **Returns**: `{ permissions_by_role }`

---

### 7. Billing & Subscription (`/api/billing`)

#### GET `/api/billing/usage`
Get current usage stats.
- **Auth Required**: Yes
- **Returns**: `{ minutes_used, minutes_limit, percentage_used, resets_at }`

#### GET `/api/billing/subscription`
Get subscription details.
- **Auth Required**: Yes
- **Returns**: `{ plan, status, current_period_end, cancel_at }`

#### POST `/api/billing/subscription/checkout`
Create Stripe checkout session.
- **Auth Required**: Yes
- **Body**: `{ plan, interval }`
- **Returns**: `{ checkout_url }`

#### POST `/api/billing/subscription/upgrade`
Upgrade subscription plan.
- **Auth Required**: Yes
- **Body**: `{ new_plan }`
- **Returns**: `{ subscription }`

#### POST `/api/billing/subscription/cancel`
Cancel subscription.
- **Auth Required**: Yes
- **Body**: `{ reason }`
- **Returns**: `{ message, ends_at }`

#### GET `/api/billing/invoices`
Get billing history.
- **Auth Required**: Yes
- **Returns**: `{ invoices[] }`

#### POST `/api/billing/payment-method`
Update payment method.
- **Auth Required**: Yes
- **Body**: `{ payment_method_id }`
- **Returns**: `{ message }`

---

### 8. Settings (`/api/settings`)

#### GET `/api/settings`
Get user settings.
- **Auth Required**: Yes
- **Returns**: `{ settings }`

#### PUT `/api/settings`
Update user settings.
- **Auth Required**: Yes
- **Body**: `{ settings_object }`
- **Returns**: `{ settings }`

#### PUT `/api/settings/profile`
Update user profile.
- **Auth Required**: Yes
- **Body**: `{ company_name, phone, timezone }`
- **Returns**: `{ user }`

#### PUT `/api/settings/password`
Change password.
- **Auth Required**: Yes
- **Body**: `{ current_password, new_password }`
- **Returns**: `{ message }`

#### POST `/api/settings/api-keys`
Generate API key.
- **Auth Required**: Yes
- **Body**: `{ name, permissions[] }`
- **Returns**: `{ api_key, secret }`

#### DELETE `/api/settings/api-keys/{key_id}`
Revoke API key.
- **Auth Required**: Yes
- **Returns**: `{ message }`

---

### 9. Webhooks (`/api/webhooks`)

#### POST `/api/webhooks/stripe`
Stripe webhook handler.
- **Auth Required**: No (Webhook signature verified)
- **Events**:
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

#### POST `/api/webhooks/twilio`
Twilio call status webhook.
- **Auth Required**: No (Twilio signature verified)

#### POST `/api/webhooks/elevenlabs`
ElevenLabs webhook handler.
- **Auth Required**: No (Signature verified)

---

### 10. Integrations (`/api/integrations`)

#### GET `/api/integrations`
Get connected integrations.
- **Auth Required**: Yes
- **Returns**: `{ integrations[] }`

#### POST `/api/integrations/{provider}/connect`
Connect integration.
- **Auth Required**: Yes
- **Providers**: google, outlook, salesforce, hubspot
- **Body**: `{ credentials }`
- **Returns**: `{ integration }`

#### DELETE `/api/integrations/{provider}`
Disconnect integration.
- **Auth Required**: Yes
- **Returns**: `{ message }`

#### POST `/api/integrations/test`
Test integration connection.
- **Auth Required**: Yes
- **Body**: `{ provider }`
- **Returns**: `{ status, message }`

---

## Security Implementation

### Rate Limiting
- Global: 1000 requests per hour per IP
- Auth endpoints: Stricter limits (see endpoint specs)
- Per-user limits based on plan:
  - Free: 100 req/hour
  - Pro: 1000 req/hour
  - Enterprise: Unlimited

### Input Validation
- All inputs validated with Pydantic schemas
- SQL injection protection via ORM
- XSS protection via sanitization
- File upload validation (type, size, content)

### Authentication Flow
1. User logs in → receives JWT access + refresh token
2. Access token (15 min expiry) in HTTPOnly cookie
3. Refresh token (7 days expiry) in secure HTTPOnly cookie
4. All protected endpoints verify JWT
5. Refresh endpoint issues new access token

### Error Responses
Standard error format:
```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "ISO8601",
  "request_id": "uuid"
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Validation Error
- 429: Rate Limit Exceeded
- 500: Internal Server Error

---

## Database Schema Requirements

### Tables
1. users
2. agents
3. conversations
4. subscriptions
5. team_members
6. team_invitations
7. calendar_integrations
8. appointments
9. api_keys
10. webhooks_log
11. knowledge_base_files

---

## Environment Variables Required

```
# App
APP_NAME=Vami Platform
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
SECRET_KEY=<strong-secret-key>
CORS_ORIGINS=http://localhost:5174

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_KEY=...

# JWT
JWT_SECRET_KEY=<jwt-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...

# ElevenLabs
ELEVENLABS_API_KEY=...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Email (SendGrid)
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@vami.ai

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...

# Outlook
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
OUTLOOK_REDIRECT_URI=...

# Redis (for rate limiting & caching)
REDIS_URL=redis://localhost:6379
```

---

## Implementation Priority

1. ✅ Core authentication & JWT
2. ✅ Agent management basics
3. ✅ Analytics & conversations
4. ✅ Billing & Stripe integration
5. 🔄 Team management (TO IMPLEMENT)
6. 🔄 Calendar integration (TO IMPLEMENT)
7. 🔄 Calls management (TO IMPLEMENT)
8. 🔄 File uploads for knowledge base (TO IMPLEMENT)
9. 🔄 Rate limiting middleware (TO IMPLEMENT)
10. 🔄 Settings management (TO IMPLEMENT)

---

## Next Steps

1. Implement missing endpoints
2. Add comprehensive input validation
3. Implement rate limiting
4. Add webhook handlers
5. Create database migrations
6. Write integration tests
7. Add API documentation UI (Swagger/ReDoc)
8. Performance optimization
9. Security audit
10. Load testing
