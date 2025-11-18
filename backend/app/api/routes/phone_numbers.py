"""
Phone Number Management API

Endpoints for listing and assigning phone numbers from the Twilio pool
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.api.deps import get_current_user
from app.models.user import User
from app.services.phone_service import phone_service

router = APIRouter(prefix="/phone-numbers", tags=["Phone Numbers"])


class PhoneNumberResponse(BaseModel):
    phone_number: str
    phone_number_sid: str
    friendly_name: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    is_assigned: bool = False
    assigned_to_user: Optional[str] = None
    assigned_to_agent: Optional[str] = None
    status: str = "available"


class AssignNumberRequest(BaseModel):
    phone_number: str
    phone_number_sid: str
    agent_id: str


class PurchaseNumberRequest(BaseModel):
    phone_number: str
    agent_id: str


@router.get("/available")
async def list_available_numbers(
    area_code: Optional[str] = None,
    country: str = "US",
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    """
    Search Twilio marketplace for available phone numbers to purchase

    This endpoint shows numbers that can be bought for the customer.
    When customer selects a number, it will be purchased and assigned to them.

    Query params:
    - area_code: Optional filter by area code (e.g., "212", "310", "415")
    - country: Country code (default: "US")
    - limit: Max numbers to return (default: 20)
    """
    try:
        # Search Twilio marketplace for available numbers
        numbers = await phone_service.list_available_numbers(
            area_code=area_code,
            country=country,
            limit=limit
        )

        # Format for frontend
        formatted_numbers = []
        for num in numbers:
            formatted_numbers.append({
                "phone_number": num["phone_number"],
                "friendly_name": num.get("friendly_name", num["phone_number"]),
                "locality": num.get("locality"),
                "region": num.get("region"),
                "postal_code": num.get("postal_code"),
                "capabilities": num.get("capabilities", {}),
                "is_assigned": False,
                "status": "available_for_purchase"
            })

        return formatted_numbers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search available numbers: {str(e)}"
        )


@router.get("/owned", response_model=List[PhoneNumberResponse])
async def list_owned_numbers(user: User = Depends(get_current_user)):
    """
    List ALL phone numbers owned in Twilio account
    Shows both assigned and available numbers (admin view)
    """
    try:
        numbers = await phone_service.list_owned_numbers()
        return numbers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list owned numbers: {str(e)}"
        )


@router.post("/purchase-and-assign", status_code=status.HTTP_200_OK)
async def purchase_and_assign_number(
    request: PurchaseNumberRequest,
    user: User = Depends(get_current_user)
):
    """
    Purchase a phone number from Twilio and assign it to user's agent

    This is the main endpoint used during onboarding:
    1. Customer selects a number from available list
    2. We purchase that number from Twilio
    3. We assign it to their agent
    4. Number is now exclusively theirs
    """
    try:
        # Purchase and provision the number for this user/agent
        result = await phone_service.provision_phone_number(
            user_id=user.id,
            agent_id=request.agent_id,
            phone_number=request.phone_number,
            country="US"
        )

        return {
            "message": "Phone number purchased and assigned successfully",
            "phone_number": result["phone_number"],
            "phone_number_sid": result["phone_number_sid"],
            "agent_id": request.agent_id,
            "status": "active"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to purchase phone number: {str(e)}"
        )


@router.post("/assign", status_code=status.HTTP_200_OK)
async def assign_phone_number(
    request: AssignNumberRequest,
    user: User = Depends(get_current_user)
):
    """
    Assign an ALREADY OWNED phone number to user's agent

    NOTE: For onboarding, use /purchase-and-assign instead.
    This endpoint is for reassigning existing numbers.
    """
    try:
        # Assign the number to the user's agent
        result = await phone_service.assign_phone_number(
            user_id=user.id,
            agent_id=request.agent_id,
            phone_number=request.phone_number,
            phone_number_sid=request.phone_number_sid
        )

        return {
            "message": "Phone number assigned successfully",
            "phone_number": result["phone_number"],
            "agent_id": request.agent_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to assign phone number: {str(e)}"
        )


@router.get("/search-twilio", response_model=List[PhoneNumberResponse])
async def search_twilio_numbers(
    area_code: Optional[str] = None,
    country: str = "US",
    limit: int = 20,
    user: User = Depends(get_current_user)
):
    """
    Search Twilio marketplace for numbers to purchase (admin only)

    This is for buying NEW numbers to add to the pool
    """
    try:
        numbers = await phone_service.list_available_numbers(
            area_code=area_code,
            country=country,
            limit=limit
        )
        return numbers

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search Twilio numbers: {str(e)}"
        )
