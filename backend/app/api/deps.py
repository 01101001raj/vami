from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from jose import JWTError, jwt
from app.config import settings
from app.database import get_supabase
from app.models.user import User
from app.services.supabase_service import supabase_service


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """Dependency to get current authenticated user"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )

        # Verify JWT token with Supabase
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        # Get user profile from database
        user = await supabase_service.get_user(user_response.user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        return user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


async def require_feature(feature_name: str):
    """Dependency factory to require specific feature access"""
    async def feature_checker(user: User = Depends(get_current_user)) -> User:
        features_dict = user.features.dict() if hasattr(user.features, 'dict') else user.features

        if not features_dict.get(feature_name, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires a plan upgrade. Feature: {feature_name}",
            )
        return user

    return feature_checker


async def check_usage_limit(user: User = Depends(get_current_user)):
    """Check if user has exceeded usage limits"""
    from datetime import date
    from dateutil.relativedelta import relativedelta

    # Get current billing period
    today = date.today()
    period_start = today.replace(day=1)
    period_end = (period_start + relativedelta(months=1)) - relativedelta(days=1)

    # Get usage for current period
    usage = await supabase_service.get_usage_for_period(user.id, period_start, period_end)

    features_dict = user.features.dict() if hasattr(user.features, 'dict') else user.features
    limit = features_dict.get("minutes_limit", 0)

    if usage >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Monthly minute limit exceeded. Please upgrade your plan.",
        )

    return user
