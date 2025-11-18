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
    version="2.0.0",
    description="Vami Platform API - AI Voice Agents with Team Collaboration, Calendar Integration & Advanced Features",
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
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

# New routers
app.include_router(team.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(settings_routes.router, prefix="/api")
app.include_router(agent_actions.router, prefix="/api")
app.include_router(phone_numbers.router, prefix="/api")
app.include_router(templates.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Vami Platform API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "AI Voice Agents",
            "Team Collaboration",
            "Calendar Integration",
            "Call Management",
            "Analytics & Reporting",
            "Knowledge Base",
            "Webhook Support",
            "Advanced Settings"
        ],
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": "now"
    }


@app.get("/api/routes")
async def list_routes():
    """List all available API routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return {
        "total": len(routes),
        "routes": sorted(routes, key=lambda x: x["path"])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
