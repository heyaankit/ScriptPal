"""Dashboard API endpoints."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DailySuggestion, Notification, Script, User
from app.services import jwt_service
from app.utils.responses import success_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
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


def get_greeting() -> str:
    """Return greeting based on time of day."""
    hour = datetime.now().hour
    if hour < 12:
        return "Good Morning"
    elif hour < 17:
        return "Good Afternoon"
    else:
        return "Good Evening"


def time_ago(dt: datetime) -> str:
    """Calculate time ago string from datetime."""
    now = datetime.utcnow()
    diff = now - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    elif seconds < 31536000:
        months = int(seconds / 2592000)
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = int(seconds / 31536000)
        return f"{years} year{'s' if years != 1 else ''} ago"


class DailySuggestionResponse(BaseModel):
    text: str
    activity_name: str
    icon_url: Optional[str]


class RecentScriptResponse(BaseModel):
    id: str
    script_text: str
    emotional_state: str
    created_at: datetime
    time_ago: str

    class Config:
        from_attributes = True


class WeeklyInsightResponse(BaseModel):
    scripts_this_week: int
    most_repeated: Optional[str]
    pattern_found: str


class DashboardResponse(BaseModel):
    greeting: str
    sub_message: str
    daily_suggestion: Optional[DailySuggestionResponse]
    recent_scripts: list[RecentScriptResponse]
    weekly_insight: WeeklyInsightResponse
    unread_notifications: int


@router.get("")
def get_dashboard(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get dashboard with greeting, daily suggestion, recent scripts, and weekly insight."""
    # Get user for child_name
    user = db.query(User).filter(User.id == user_id).first()
    child_name = user.child_name if user and user.child_name else "your child"

    # Greeting
    greeting = get_greeting()
    sub_message = f"Let's support {child_name} today"

    # Daily suggestion - random active one
    daily_suggestion = (
        db.query(DailySuggestion)
        .filter(DailySuggestion.active == True)
        .order_by(func.random())
        .first()
    )

    daily_suggestion_data = None
    if daily_suggestion:
        daily_suggestion_data = DailySuggestionResponse(
            text=daily_suggestion.text,
            activity_name=daily_suggestion.activity_name,
            icon_url=daily_suggestion.icon_url,
        )

    # Recent scripts - last 5 for user
    recent_scripts = (
        db.query(Script)
        .filter(Script.user_id == user_id)
        .order_by(Script.created_at.desc())
        .limit(5)
        .all()
    )

    recent_scripts_data = [
        RecentScriptResponse(
            id=s.id,
            script_text=s.script_text,
            emotional_state=s.emotional_state,
            created_at=s.created_at,
            time_ago=time_ago(s.created_at),
        )
        for s in recent_scripts
    ]

    # Weekly insight
    week_ago = datetime.utcnow() - timedelta(days=7)
    scripts_this_week = (
        db.query(Script)
        .filter(Script.user_id == user_id, Script.created_at >= week_ago)
        .count()
    )

    # Most repeated script_text this week
    most_repeated_query = (
        db.query(Script.script_text, func.count(Script.id).label("count"))
        .filter(Script.user_id == user_id, Script.created_at >= week_ago)
        .group_by(Script.script_text)
        .order_by(func.count(Script.id).desc())
        .first()
    )

    most_repeated = most_repeated_query[0] if most_repeated_query else None
    most_repeated_count = most_repeated_query[1] if most_repeated_query else 0

    # Pattern analysis
    if scripts_this_week == 0:
        pattern_found = (
            "No scripts recorded this week. Start adding scripts to track patterns!"
        )
    elif scripts_this_week < 3:
        pattern_found = "You're getting started. Keep adding scripts to see patterns."
    elif most_repeated:
        pattern_found = f"You've used '{most_repeated[:30]}...' {most_repeated_count} times this week. Consistency helps build familiarity."
    else:
        pattern_found = "Great variety this week! Keep exploring different scripts."

    weekly_insight = WeeklyInsightResponse(
        scripts_this_week=scripts_this_week,
        most_repeated=most_repeated,
        pattern_found=pattern_found,
    )

    # Unread notifications count
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.read == False)
        .count()
    )

    dashboard_data = DashboardResponse(
        greeting=greeting,
        sub_message=sub_message,
        daily_suggestion=daily_suggestion_data,
        recent_scripts=recent_scripts_data,
        weekly_insight=weekly_insight,
        unread_notifications=unread_count,
    )

    return success_response(
        data=dashboard_data.model_dump(), message="Dashboard retrieved successfully"
    )


@router.get("/notification-count")
def get_notification_count(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get unread notification count."""
    unread_count = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.read == False)
        .count()
    )

    return success_response(
        data={"unread_count": unread_count}, message="Notification count retrieved"
    )
