from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import (
    auth, agents, analytics, billing, webhooks, integrations,
    team, calls, calendar, settings as settings_routes, agent_actions, phone_numbers, templates
)
from app.middleware.security import (
    RateLimitMiddleware,
    RequestValidationMiddleware,
    RequestIDMiddleware,
    SecurityHeadersMiddleware,
    PerformanceMonitoringMiddleware
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Vami Platform API - AI Voice Agents with Team Collaboration, Calendar Integration & Advanced Features",
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add security middleware (order matters - they are executed in reverse order of addition)
app.add_middleware(PerformanceMonitoringMiddleware, slow_request_threshold=2.0)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RequestValidationMiddleware, max_request_size=10 * 1024 * 1024)  # 10MB
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000,
    enabled=not settings.DEBUG  # Disable rate limiting in debug mode
)

# CORS middleware (must be added last to be executed first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-Remaining-Minute"]
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
