"""Notifications API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Notification
from app.services import jwt_service
from app.utils.responses import success_response
from app.utils.pagination import paginate

router = APIRouter(prefix="/notifications", tags=["Notifications"])
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


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    read: bool
    created_at: str

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    pagination: dict


@router.get("")
def get_notifications(
    page: int = 1,
    page_size: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get paginated list of notifications for the current user."""
    query = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )

    result = paginate(query, page=page, page_size=page_size)

    notifications = [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            read=n.read,
            created_at=n.created_at.isoformat(),
        )
        for n in result["items"]
    ]

    return success_response(
        data={
            "notifications": notifications,
            "pagination": result["pagination"],
        },
        message="Notifications retrieved successfully",
    )


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()

    return success_response(
        data={
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
        },
        message="Notification marked as read",
    )
