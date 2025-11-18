from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Callable
from collections import defaultdict
from datetime import datetime, timedelta
import time
import uuid


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse
    Implements sliding window rate limiting
    """

    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        enabled: bool = True
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.enabled = enabled

        # Store request timestamps per IP
        self.request_history: Dict[str, list] = defaultdict(list)

    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for client (IP + User ID if authenticated)"""
        # Get IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        # Add user ID if authenticated
        user_id = request.state.user.id if hasattr(request.state, "user") else None
        identifier = f"{ip}:{user_id}" if user_id else ip

        return identifier

    def _clean_old_requests(self, timestamps: list, time_window: timedelta):
        """Remove timestamps older than the time window"""
        cutoff = datetime.utcnow() - time_window
        return [ts for ts in timestamps if ts > cutoff]

    async def dispatch(self, request: Request, call_next: Callable):
        """Process request with rate limiting"""
        if not self.enabled:
            return await call_next(request)

        # Skip rate limiting for certain paths
        skip_paths = ["/docs", "/redoc", "/openapi.json", "/health"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)

        client_id = self._get_client_identifier(request)
        now = datetime.utcnow()

        # Get and clean request history
        timestamps = self.request_history[client_id]
        timestamps = self._clean_old_requests(timestamps, timedelta(hours=1))

        # Check per-minute limit
        minute_timestamps = [ts for ts in timestamps if ts > now - timedelta(minutes=1)]
        if len(minute_timestamps) >= self.requests_per_minute:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: {self.requests_per_minute} requests per minute",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )

        # Check per-hour limit
        if len(timestamps) >= self.requests_per_hour:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: {self.requests_per_hour} requests per hour",
                    "retry_after": 3600
                },
                headers={"Retry-After": "3600"}
            )

        # Add current request timestamp
        timestamps.append(now)
        self.request_history[client_id] = timestamps

        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)
        response.headers["X-RateLimit-Remaining-Minute"] = str(
            max(0, self.requests_per_minute - len(minute_timestamps))
        )
        response.headers["X-RateLimit-Remaining-Hour"] = str(
            max(0, self.requests_per_hour - len(timestamps))
        )

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware for request validation and sanitization
    """

    def __init__(self, app, max_request_size: int = 10 * 1024 * 1024):  # 10MB
        super().__init__(app)
        self.max_request_size = max_request_size

    async def dispatch(self, request: Request, call_next: Callable):
        """Validate and sanitize incoming requests"""

        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_request_size:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": f"Request body too large. Maximum size: {self.max_request_size} bytes"}
            )

        # Validate Content-Type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")

            # Skip file uploads
            if "multipart/form-data" not in content_type:
                allowed_content_types = [
                    "application/json",
                    "application/x-www-form-urlencoded",
                    "multipart/form-data"
                ]

                if not any(ct in content_type for ct in allowed_content_types):
                    return JSONResponse(
                        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                        content={"detail": "Unsupported media type"}
                    )

        response = await call_next(request)
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add unique request ID to each request for tracing
    """

    async def dispatch(self, request: Request, call_next: Callable):
        """Add request ID to request and response"""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses
    """

    async def dispatch(self, request: Request, call_next: Callable):
        """Add security headers"""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """
    Enhanced CORS middleware with security checks
    """

    def __init__(
        self,
        app,
        allowed_origins: list,
        allowed_methods: list = None,
        allowed_headers: list = None,
        allow_credentials: bool = True
    ):
        super().__init__(app)
        self.allowed_origins = allowed_origins
        self.allowed_methods = allowed_methods or ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        self.allowed_headers = allowed_headers or ["*"]
        self.allow_credentials = allow_credentials

    def _is_allowed_origin(self, origin: str) -> bool:
        """Check if origin is in allowed list"""
        if "*" in self.allowed_origins:
            return True

        for allowed in self.allowed_origins:
            if allowed == origin:
                return True
            # Support wildcard subdomains
            if allowed.startswith("*."):
                domain = allowed[2:]
                if origin.endswith(domain):
                    return True

        return False

    async def dispatch(self, request: Request, call_next: Callable):
        """Handle CORS with security"""
        origin = request.headers.get("origin")

        # Handle preflight requests
        if request.method == "OPTIONS":
            if origin and self._is_allowed_origin(origin):
                return JSONResponse(
                    content={},
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Methods": ", ".join(self.allowed_methods),
                        "Access-Control-Allow-Headers": ", ".join(self.allowed_headers),
                        "Access-Control-Allow-Credentials": str(self.allow_credentials).lower(),
                        "Access-Control-Max-Age": "86400",
                    }
                )
            else:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "Origin not allowed"}
                )

        response = await call_next(request)

        # Add CORS headers to response
        if origin and self._is_allowed_origin(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = str(self.allow_credentials).lower()
            response.headers["Access-Control-Expose-Headers"] = "X-Request-ID, X-RateLimit-Remaining-Minute"

        return response


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor request performance
    """

    def __init__(self, app, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold

    async def dispatch(self, request: Request, call_next: Callable):
        """Monitor request performance"""
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        # Log slow requests
        if process_time > self.slow_request_threshold:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")

        return response


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Middleware to restrict access to whitelisted IPs (optional)
    """

    def __init__(self, app, whitelist: list = None, enabled: bool = False):
        super().__init__(app)
        self.whitelist = whitelist or []
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next: Callable):
        """Check IP whitelist"""
        if not self.enabled or not self.whitelist:
            return await call_next(request)

        # Get client IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Check whitelist
        if client_ip not in self.whitelist:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access denied: IP not whitelisted"}
            )

        return await call_next(request)
