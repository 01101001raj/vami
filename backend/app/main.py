from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import auth, agents, analytics, billing, webhooks, integrations
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Vami Platform API - AI Voice Agents for Healthcare",
    debug=settings.DEBUG
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # CSP that allows external integrations (Stripe, Google OAuth, SendGrid)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "connect-src 'self' https://api.stripe.com https://accounts.google.com https://oauth2.googleapis.com; "
        "frame-src https://checkout.stripe.com https://js.stripe.com https://accounts.google.com; "
        "script-src 'self' 'unsafe-inline' https://js.stripe.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:;"
    )
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Explicit methods instead of wildcard
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],  # Explicit headers
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Vami Platform API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
