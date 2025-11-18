# Vami Backend - Complete Implementation Roadmap

## Current Status

### ✅ Already Implemented
1. **Authentication System** (`/api/auth`)
   - User registration
   - Login/logout
   - JWT tokens
   - Password reset

2. **Agent Management** (`/api/agents`)
   - Basic agent CRUD operations
   - Agent configuration

3. **Analytics** (`/api/analytics`)
   - Stats endpoint
   - Conversations endpoint
   - Basic metrics

4. **Billing** (`/api/billing`)
   - Usage tracking
   - Stripe integration basics
   - Subscription management

5. **Webhooks** (`/api/webhooks`)
   - Stripe webhook handler
   - Basic webhook structure

6. **Integrations** (`/api/integrations`)
   - Integration structure

### 🔄 Needs Implementation

#### HIGH PRIORITY

1. **Team Management Routes** (`/api/team`)
   ```
   /api/team/members (GET, POST, DELETE)
   /api/team/invite (POST)
   /api/team/invitations/{token}/accept (POST)
   /api/team/members/{user_id}/role (PUT)
   /api/team/permissions (GET)
   ```

2. **Calls/Conversations Management** (`/api/calls`)
   ```
   /api/calls (GET, POST)
   /api/calls/{call_id} (GET)
   /api/calls/{call_id}/end (POST)
   /api/calls/{call_id}/recording (GET)
   /api/calls/{call_id}/feedback (POST)
   ```

3. **Calendar Integration** (`/api/calendar`)
   ```
   /api/calendar/appointments (GET, POST, PUT, DELETE)
   /api/calendar/connect/google (POST)
   /api/calendar/connect/outlook (POST)
   /api/calendar/availability (GET)
   ```

4. **Settings Management** (`/api/settings`)
   ```
   /api/settings (GET, PUT)
   /api/settings/profile (PUT)
   /api/settings/password (PUT)
   /api/settings/api-keys (GET, POST, DELETE)
   ```

5. **File Upload System**
   ```
   /api/agents/knowledge-base/upload (POST)
   /api/agents/knowledge-base/{file_id} (DELETE)
   ```

#### MEDIUM PRIORITY

6. **Security Middleware**
   - Rate limiting (per IP and per user)
   - Request validation
   - CORS hardening
   - API key authentication

7. **Enhanced Analytics**
   - Export functionality (CSV, PDF)
   - Daily metrics endpoint
   - Sentiment analysis endpoint
   - Custom date ranges

8. **Webhook Enhancements**
   - Twilio webhook handler
   - ElevenLabs webhook handler
   - Webhook retry logic
   - Webhook logging

#### LOW PRIORITY

9. **Admin Dashboard API**
   - System metrics
   - User management
   - Platform statistics

10. **Notification System**
    - Email notifications
    - SMS notifications
    - In-app notifications

---

## Implementation Details

### 1. Team Management Implementation

**File**: `backend/app/api/routes/team.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_user
from app.models.user import User
from app.models.team import TeamMember, TeamInvitation
from app.schemas.team import (
    TeamMemberResponse,
    InviteTeamMemberRequest,
    UpdateRoleRequest,
    TeamInvitationResponse
)
from app.services.email_service import send_team_invitation

router = APIRouter(prefix="/team", tags=["team"])

@router.get("/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    current_user: User = Depends(get_current_user)
):
    """Get all team members"""
    # Implementation here
    pass

@router.post("/invite")
async def invite_team_member(
    request: InviteTeamMemberRequest,
    current_user: User = Depends(get_current_user)
):
    """Invite a new team member"""
    # Check if user is admin/owner
    # Create invitation
    # Send email
    # Return invitation details
    pass

@router.delete("/members/{user_id}")
async def remove_team_member(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a team member"""
    # Check permissions
    # Remove member
    pass

@router.put("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    request: UpdateRoleRequest,
    current_user: User = Depends(get_current_user)
):
    """Update team member role"""
    # Check if owner
    # Update role
    pass

@router.post("/invitations/{token}/accept")
async def accept_invitation(token: str):
    """Accept team invitation"""
    # Verify token
    # Add user to team
    pass
```

**Schemas needed**: `backend/app/schemas/team.py`

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Literal

class TeamMemberResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal["owner", "admin", "member"]
    status: Literal["active", "pending", "inactive"]
    joined_date: datetime
    last_active: datetime

class InviteTeamMemberRequest(BaseModel):
    email: EmailStr
    role: Literal["admin", "member"]

class UpdateRoleRequest(BaseModel):
    role: Literal["owner", "admin", "member"]

class TeamInvitationResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    invited_by: str
    created_at: datetime
    expires_at: datetime
```

### 2. Calls Management Implementation

**File**: `backend/app/api/routes/calls.py`

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.api.deps import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.schemas.calls import (
    CallListResponse,
    CallDetailResponse,
    InitiateCallRequest,
    CallFeedbackRequest
)

router = APIRouter(prefix="/calls", tags=["calls"])

@router.get("/", response_model=CallListResponse)
async def get_calls(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    sentiment: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get paginated list of calls"""
    # Query conversations with filters
    # Apply pagination
    # Return results
    pass

@router.get("/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(
    call_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed call information"""
    # Fetch call
    # Include transcript
    # Include recording URL
    pass

@router.post("/")
async def initiate_call(
    request: InitiateCallRequest,
    current_user: User = Depends(get_current_user)
):
    """Initiate a new call"""
    # Validate phone number
    # Check usage limits
    # Initiate call via Twilio/ElevenLabs
    # Create conversation record
    pass

@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    current_user: User = Depends(get_current_user)
):
    """End an active call"""
    # End call
    # Generate summary
    # Update database
    pass

@router.get("/{call_id}/recording")
async def get_call_recording(
    call_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get call recording URL"""
    # Generate signed URL
    # Set expiration
    pass

@router.post("/{call_id}/feedback")
async def submit_feedback(
    call_id: str,
    request: CallFeedbackRequest,
    current_user: User = Depends(get_current_user)
):
    """Submit call feedback"""
    # Save feedback
    # Update call record
    pass
```

### 3. Calendar Integration Implementation

**File**: `backend/app/api/routes/calendar.py`

```python
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import date
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.calendar import (
    AppointmentResponse,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    ConnectCalendarRequest
)
from app.services.calendar_service import (
    GoogleCalendarService,
    OutlookCalendarService
)

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get scheduled appointments"""
    # Query appointments
    # Apply filters
    # Return results
    pass

@router.post("/appointments")
async def create_appointment(
    request: CreateAppointmentRequest,
    current_user: User = Depends(get_current_user)
):
    """Create new appointment"""
    # Create appointment
    # Sync with connected calendars
    # Send notifications
    pass

@router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    request: UpdateAppointmentRequest,
    current_user: User = Depends(get_current_user)
):
    """Update appointment"""
    # Update appointment
    # Sync changes
    pass

@router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel appointment"""
    # Cancel appointment
    # Send cancellation emails
    pass

@router.post("/connect/google")
async def connect_google_calendar(
    request: ConnectCalendarRequest,
    current_user: User = Depends(get_current_user)
):
    """Connect Google Calendar"""
    # Exchange authorization code for tokens
    # Store encrypted tokens
    # Test connection
    pass

@router.post("/connect/outlook")
async def connect_outlook_calendar(
    request: ConnectCalendarRequest,
    current_user: User = Depends(get_current_user)
):
    """Connect Outlook Calendar"""
    # Exchange authorization code for tokens
    # Store encrypted tokens
    # Test connection
    pass

@router.get("/availability")
async def get_availability(
    date: date = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Get user availability for a date"""
    # Check user calendar
    # Return available time slots
    pass
```

### 4. Settings Management Implementation

**File**: `backend/app/api/routes/settings.py`

```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.settings import (
    SettingsResponse,
    UpdateSettingsRequest,
    UpdateProfileRequest,
    ChangePasswordRequest,
    CreateAPIKeyRequest,
    APIKeyResponse
)
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user)
):
    """Get user settings"""
    pass

@router.put("/")
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user settings"""
    pass

@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    pass

@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    # Verify current password
    # Hash new password
    # Update database
    pass

@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate new API key"""
    # Generate secure key
    # Store hashed version
    # Return key (only shown once)
    pass

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user)
):
    """Revoke API key"""
    pass
```

### 5. File Upload Implementation

**File**: `backend/app/api/routes/knowledge_base.py`

```python
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from app.api.deps import get_current_user
from app.models.user import User
from app.utils.file_processor import process_document
from app.models.knowledge_base import KnowledgeBaseFile

router = APIRouter(prefix="/agents/knowledge-base", tags=["knowledge-base"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload")
async def upload_knowledge_base_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload knowledge base files"""
    uploaded_files = []

    for file in files:
        # Validate file extension
        if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed: {file.filename}"
            )

        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file.filename}"
            )

        # Process and store file
        processed_file = await process_document(
            content=content,
            filename=file.filename,
            user_id=current_user.id
        )

        uploaded_files.append(processed_file)

    return {
        "uploaded_files": uploaded_files,
        "processed_count": len(uploaded_files)
    }

@router.delete("/{file_id}")
async def delete_knowledge_base_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete knowledge base file"""
    # Find file
    # Check ownership
    # Delete from storage
    # Remove from database
    pass
```

---

## Security Implementation

### 1. Rate Limiting Middleware

**File**: `backend/app/middleware/rate_limit.py`

```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict
import time
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host

        # Current timestamp
        now = time.time()

        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 60
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded",
                    "error_code": "RATE_LIMIT_EXCEEDED"
                }
            )

        # Add current request
        self.requests[client_ip].append(now)

        response = await call_next(request)
        return response
```

### 2. Request Validation

**File**: `backend/app/utils/validators.py`

```python
import re
from typing import Optional
from fastapi import HTTPException

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    pattern = r'^\+?1?\d{9,15}$'
    if not re.match(pattern, phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number format"
        )
    return True

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format"
        )
    return True

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS"""
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&']
    for char in dangerous_chars:
        text = text.replace(char, '')
    return text.strip()
```

### 3. Error Handler

**File**: `backend/app/utils/error_handler.py`

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    """Handle validation errors"""
    request_id = str(uuid.uuid4())

    logger.error(f"Validation error [{request_id}]: {exc.errors()}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "error_code": "VALIDATION_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id
        }
    )

async def general_exception_handler(
    request: Request,
    exc: Exception
):
    """Handle general exceptions"""
    request_id = str(uuid.uuid4())

    logger.error(f"Unhandled exception [{request_id}]: {str(exc)}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id
        }
    )
```

---

## Database Migrations Needed

### 1. Team Tables

```sql
-- Team members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Team invitations table
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'member')),
    token VARCHAR(255) NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'))
);
```

### 2. Calendar Tables

```sql
-- Calendar integrations table
CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    attendees JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 3. Knowledge Base Tables

```sql
-- Knowledge base files table
CREATE TABLE knowledge_base_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    storage_path TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    embedding_status VARCHAR(50) DEFAULT 'pending',
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

### 4. API Keys Table

```sql
-- API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    permissions JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE
);
```

---

## Integration with Main App

### Update `main.py` to include new routes:

```python
from app.api.routes import (
    auth, agents, analytics, billing,
    webhooks, integrations,
    team, calls, calendar, settings  # Add these
)

# Add routers
app.include_router(team.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

# Add middleware
from app.middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)

# Add exception handlers
from app.utils.error_handler import (
    validation_exception_handler,
    general_exception_handler
)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
```

---

## Testing Strategy

### 1. Unit Tests
- Test each endpoint independently
- Mock external services
- Test validation logic
- Test error handling

### 2. Integration Tests
- Test complete user workflows
- Test authentication flow
- Test payment flow
- Test calendar sync

### 3. Load Tests
- Stress test rate limiting
- Test concurrent requests
- Test database performance
- Test file upload limits

### 4. Security Tests
- Test SQL injection protection
- Test XSS prevention
- Test authentication bypass attempts
- Test rate limit effectiveness

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error tracking setup (Sentry)
- [ ] Backup strategy in place
- [ ] Monitoring setup (DataDog/NewRelic)
- [ ] Load balancer configured
- [ ] CDN configured for static files
- [ ] Webhook endpoints secured
- [ ] API documentation generated

---

## Performance Optimization

1. **Database Indexing**
   - Add indexes on frequently queried columns
   - Use composite indexes where needed
   - Optimize slow queries

2. **Caching Strategy**
   - Redis for session storage
   - Cache frequently accessed data
   - Implement cache invalidation

3. **Async Operations**
   - Use async/await throughout
   - Queue long-running tasks (Celery/RQ)
   - Implement webhook retries

4. **CDN Usage**
   - Serve static files via CDN
   - Cache API responses where appropriate
   - Optimize file uploads/downloads

---

## Monitoring & Logging

### Key Metrics to Track
- Request rate per endpoint
- Response times
- Error rates
- Database query times
- Cache hit rates
- Authentication failures
- Rate limit hits
- Webhook delivery success

### Logging Strategy
- Structured JSON logging
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Include request IDs for tracing
- Log all authentication attempts
- Log all data modifications
- Rotate logs daily

---

## Next Steps

1. ✅ Review API specification
2. ⏳ Implement team management routes
3. ⏳ Implement calls management routes
4. ⏳ Implement calendar integration routes
5. ⏳ Implement settings routes
6. ⏳ Add rate limiting middleware
7. ⏳ Create database migrations
8. ⏳ Write comprehensive tests
9. ⏳ Setup monitoring & logging
10. ⏳ Deploy to production

---

**Estimated Implementation Time**: 2-3 weeks for complete production-ready backend
**Priority**: High-priority items first (team, calls, calendar)
**Approach**: Iterative development with continuous testing
