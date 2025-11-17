from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.services.supabase_service import supabase_service
from app.services.stripe_service import stripe_service
from app.services.elevenlabs_service import elevenlabs_service
from app.services.email_service import email_service
from app.database import get_supabase
from app.config import settings
from app.api.deps import get_current_user
from app.models.user import User
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
@limiter.limit("5/minute")
async def register(http_request: Request, request: RegisterRequest):
    """
    Register a new user
    1. Create Supabase auth user
    2. Create user profile
    3. Create Stripe customer
    4. Return checkout URL
    """
    try:
        supabase = get_supabase()

        # Create auth user in Supabase
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )

        user_id = auth_response.user.id

        # Create user profile
        user = await supabase_service.create_user_profile(
            user_id=user_id,
            email=request.email,
            company_name=request.company_name,
            plan=request.plan
        )

        # Create Stripe customer
        stripe_customer_id = await stripe_service.create_customer(
            email=request.email,
            name=request.company_name or request.email
        )

        # Update user with Stripe customer ID
        await supabase_service.update_user(user_id, {
            "stripe_customer_id": stripe_customer_id
        })

        # Create Stripe checkout session
        trial_days = 14 if request.plan.value == "starter_trial" else 0
        checkout_url = await stripe_service.create_checkout_session(
            customer_id=stripe_customer_id,
            plan=request.plan,
            success_url=f"{settings.FRONTEND_URL}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            trial_days=trial_days
        )

        # Get access token
        access_token = auth_response.session.access_token if auth_response.session else None

        return AuthResponse(
            access_token=access_token,
            user=user,
            checkout_url=checkout_url
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(http_request: Request, request: LoginRequest):
    """
    Login existing user
    """
    try:
        supabase = get_supabase()

        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Get user profile
        user = await supabase_service.get_user(auth_response.user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )

        # Check subscription status
        if user.subscription_status not in ["active", "trialing"]:
            # User needs to complete payment or subscription expired
            pass  # We'll still let them login to access billing

        access_token = auth_response.session.access_token if auth_response.session else None

        return AuthResponse(
            access_token=access_token,
            user=user
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    """
    Logout current user
    """
    try:
        supabase = get_supabase()
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return user


@router.post("/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(http_request: Request, email: str):
    """
    Send password reset email
    """
    try:
        supabase = get_supabase()
        supabase.auth.reset_password_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("5/hour")
async def reset_password(http_request: Request, token: str, new_password: str):
    """
    Reset password with token
    """
    try:
        supabase = get_supabase()

        # Verify and use the reset token
        # The token should be set as the auth token before updating password
        try:
            # Attempt to verify token by getting user with it
            verify_response = supabase.auth.get_user(token)
            if not verify_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset token"
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        # Set the session with the reset token and update password
        supabase.auth.set_session(token, token)
        supabase.auth.update_user({"password": new_password})

        return {"message": "Password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password"
        )
