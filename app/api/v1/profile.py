"""Profile API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services import jwt_service
from app.utils.responses import success_response

router = APIRouter(prefix="/profile", tags=["Profile"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


def get_current_user_id(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> str:
    """Extract user_id from JWT token."""
    try:
        payload = jwt_service.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")


class ProfileResponse(BaseModel):
    id: str
    username: Optional[str]
    email: Optional[str]
    role: str
    child_name: Optional[str]
    child_age: Optional[int]
    avatar_url: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    child_name: Optional[str] = None
    child_age: Optional[int] = None
    avatar_url: Optional[str] = None


@router.get("")
def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get the current user's profile."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get avatar_url if it exists (may be None if column doesn't exist)
    avatar_url = getattr(user, "avatar_url", None)

    profile = ProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        child_name=user.child_name,
        child_age=user.child_age,
        avatar_url=avatar_url,
        created_at=user.created_at.isoformat(),
    )

    return success_response(
        data=profile.model_dump(),
        message="Profile retrieved successfully",
    )


@router.patch("", response_model=dict)
def update_profile(
    profile_data: ProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only the allowed fields
    if profile_data.child_name is not None:
        user.child_name = profile_data.child_name

    if profile_data.child_age is not None:
        user.child_age = profile_data.child_age

    if profile_data.avatar_url is not None:
        user.avatar_url = profile_data.avatar_url

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Get avatar_url if it exists
    avatar_url = getattr(user, "avatar_url", None)

    profile = ProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        child_name=user.child_name,
        child_age=user.child_age,
        avatar_url=avatar_url,
        created_at=user.created_at.isoformat(),
    )

    return success_response(
        data=profile.model_dump(),
        message="Profile updated successfully",
    )
