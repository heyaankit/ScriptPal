"""Progress and Milestones API endpoints."""

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Milestone, Script
from app.services import jwt_service
from app.utils.pagination import paginate
from app.utils.responses import error_response, success_response

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Period type
PERIOD_VALUES = ["week", "month", "quarter"]


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


def get_period_dates(period: str) -> tuple[datetime, datetime]:
    """Get start and end dates for a period - using actual data range."""
    now = datetime.now()

    if period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=90)
    else:
        start = now - timedelta(days=7)

    return start, now


def get_previous_period_dates(period: str) -> tuple[datetime, datetime]:
    """Get start and end dates for the previous period."""
    now = datetime.now()

    if period == "week":
        start = now - timedelta(days=14)
        end = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=60)
        end = now - timedelta(days=30)
    elif period == "quarter":
        start = now - timedelta(days=180)
        end = now - timedelta(days=90)
    else:
        start = now - timedelta(days=14)
        end = now - timedelta(days=7)

    return start, end


def count_scripts_in_period(
    db: Session, user_id: str, start: datetime, end: datetime
) -> int:
    """Count scripts in a date range for a user."""
    return (
        db.query(Script)
        .filter(
            Script.user_id == user_id,
            Script.created_at >= start,
            Script.created_at <= end,
        )
        .count()
    )


def get_emotion_counts(
    db: Session, user_id: str, start: datetime, end: datetime
) -> dict:
    """Get emotion counts for a date range."""
    scripts = (
        db.query(Script)
        .filter(
            Script.user_id == user_id,
            Script.created_at >= start,
            Script.created_at <= end,
        )
        .all()
    )

    emotions = ["happy", "excited", "neutral", "sad", "anxious", "angry"]
    counts = {emotion: 0 for emotion in emotions}

    for script in scripts:
        if script.emotional_state in counts:
            counts[script.emotional_state] += 1

    return counts


def get_recent_milestones(db: Session, user_id: str, limit: int = 3) -> list:
    """Get recent milestones for a user."""
    milestones = (
        db.query(Milestone)
        .filter(Milestone.user_id == user_id)
        .order_by(Milestone.achieved_on.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": m.id,
            "title": m.title,
            "icon": m.icon,
            "achieved_on": m.achieved_on.isoformat(),
        }
        for m in milestones
    ]


# Pydantic models
class MilestoneCreate(BaseModel):
    title: str
    icon: Optional[str] = None
    achieved_on: date


class MilestoneResponse(BaseModel):
    id: str
    title: str
    icon: Optional[str]
    achieved_on: str

    class Config:
        from_attributes = True


# Progress endpoints
@router.get("/progress/summary")
def get_progress_summary(
    period: str = Query(..., pattern="^(week|month|quarter)$"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get progress summary for a period."""
    # Get current period dates
    start, end = get_period_dates(period)

    # Get previous period dates
    prev_start, prev_end = get_previous_period_dates(period)

    # Count scripts in current period
    current_count = count_scripts_in_period(db, user_id, start, end)

    # Count scripts in previous period
    prev_count = count_scripts_in_period(db, user_id, prev_start, prev_end)

    # Calculate growth rate
    if prev_count > 0:
        growth_rate = ((current_count - prev_count) / prev_count) * 100
    else:
        growth_rate = 100.0 if current_count > 0 else 0.0

    # Get emotion counts for positive emotions percentage
    emotion_counts = get_emotion_counts(db, user_id, start, end)
    total_emotions = sum(emotion_counts.values())
    positive_emotions = emotion_counts.get("happy", 0) + emotion_counts.get(
        "excited", 0
    )

    if total_emotions > 0:
        positive_emotions_pct = (positive_emotions / total_emotions) * 100
    else:
        positive_emotions_pct = 0.0

    return success_response(
        data={
            "total_scripts": current_count,
            "growth_rate": round(growth_rate, 1),
            "positive_emotions_pct": round(positive_emotions_pct, 1),
        },
        message="Progress summary retrieved successfully",
    )


@router.get("/progress/weekly")
def get_weekly_progress(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get weekly progress with daily breakdown for last 7 days."""
    from datetime import datetime, timedelta

    today = datetime.now()
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    values = []

    # Get last 7 days (today + 6 days back)
    for i in range(7):
        days_ago = 6 - i
        day = today - timedelta(days=days_ago)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1) - timedelta(seconds=1)

        count = count_scripts_in_period(db, user_id, day_start, day_end)
        values.append(count)

    # Get recent milestones
    recent_milestones = get_recent_milestones(db, user_id, limit=3)

    return success_response(
        data={
            "chart": {
                "title": "Weekly Scripts",
                "labels": labels,
                "values": values,
            },
            "recent_milestones": recent_milestones,
        },
        message="Weekly progress retrieved successfully",
    )


@router.get("/progress/emotions")
def get_emotions_progress(
    period: str = Query(..., pattern="^(week|month|quarter)$"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get emotion distribution for a period."""
    start, end = get_period_dates(period)

    # Get emotion counts
    emotion_counts = get_emotion_counts(db, user_id, start, end)

    labels = ["Happy", "Excited", "Neutral", "Sad", "Anxious", "Angry"]
    emotion_keys = ["happy", "excited", "neutral", "sad", "anxious", "angry"]
    values = [emotion_counts[key] for key in emotion_keys]

    # Get recent milestones
    recent_milestones = get_recent_milestones(db, user_id, limit=3)

    return success_response(
        data={
            "chart": {
                "title": "Emotion Distribution",
                "labels": labels,
                "values": values,
            },
            "recent_milestones": recent_milestones,
        },
        message="Emotions progress retrieved successfully",
    )


@router.get("/progress/trends")
def get_progress_trends(
    period: str = Query(..., pattern="^(month|quarter)$"),
    periods: int = Query(6, ge=1, le=12),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get progress trends over multiple periods."""
    today = date.today()

    labels = []
    scripts_values = []
    positive_pct_values = []
    growth_rate_values = []

    # Generate period dates going backwards
    current_period = period

    for i in range(periods):
        # Calculate period index going backwards
        period_index = i

        # Get start and end for this period
        if period == "month":
            # Calculate month going backwards
            month_offset = period_index
            target_month = today.month - month_offset
            target_year = today.year

            while target_month <= 0:
                target_month += 12
                target_year -= 1

            start = datetime(target_year, target_month, 1)
            if target_month == 12:
                end = datetime(target_year + 1, 1, 1) - timedelta(seconds=1)
            else:
                end = datetime(target_year, target_month + 1, 1) - timedelta(seconds=1)

            label = f"Month {target_month}/{target_year % 100}"
        else:  # quarter
            quarter = (today.month - 1) // 3
            quarter_offset = period_index
            target_quarter = quarter - quarter_offset

            while target_quarter < 0:
                target_quarter += 4

            q_year = today.year - (quarter_offset // 4)
            q_start_month = target_quarter * 3 + 1

            start = datetime(q_year, q_start_month, 1)
            if q_start_month == 10:
                end = datetime(q_year + 1, 1, 1) - timedelta(seconds=1)
            else:
                end = datetime(q_year, q_start_month + 3, 1) - timedelta(seconds=1)

            label = f"Q{target_quarter + 1} {q_year}"
            if target_quarter == 3:
                label = f"Q1 {q_year + 1}"

        # Count scripts in this period
        script_count = count_scripts_in_period(db, user_id, start, end)

        # Get emotion percentage
        emotion_counts = get_emotion_counts(db, user_id, start, end)
        total_emotions = sum(emotion_counts.values())
        positive_emotions = emotion_counts.get("happy", 0) + emotion_counts.get(
            "excited", 0
        )

        if total_emotions > 0:
            positive_pct = (positive_emotions / total_emotions) * 100
        else:
            positive_pct = 0.0

        # Calculate growth rate (vs previous period in the loop)
        if i > 0:
            prev_count = scripts_values[-1]
            if prev_count > 0:
                growth_rate = ((script_count - prev_count) / prev_count) * 100
            else:
                growth_rate = 100.0 if script_count > 0 else 0.0
        else:
            growth_rate = 0.0

        labels.insert(0, label)
        scripts_values.insert(0, script_count)
        positive_pct_values.insert(0, round(positive_pct, 1))
        growth_rate_values.insert(0, round(growth_rate, 1))

    return success_response(
        data={
            "chart": {
                "title": f"{period.capitalize()} Trends",
                "labels": labels,
                "scripts": scripts_values,
                "positive_pct": positive_pct_values,
                "growth_rate": growth_rate_values,
            },
        },
        message="Progress trends retrieved successfully",
    )


# Milestones endpoints
@router.post("/milestones")
def create_milestone(
    milestone_data: MilestoneCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new milestone."""
    milestone = Milestone(
        user_id=user_id,
        title=milestone_data.title,
        icon=milestone_data.icon,
        achieved_on=milestone_data.achieved_on,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    return success_response(
        data={
            "id": milestone.id,
            "title": milestone.title,
            "icon": milestone.icon,
            "achieved_on": milestone.achieved_on.isoformat(),
        },
        message="Milestone created successfully",
    )


@router.get("/milestones")
def list_milestones(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List milestones with pagination."""
    query = db.query(Milestone).filter(Milestone.user_id == user_id)
    result = paginate(query, page=page, page_size=page_size)

    items = [
        {
            "id": m.id,
            "title": m.title,
            "icon": m.icon,
            "achieved_on": m.achieved_on.isoformat(),
        }
        for m in result["items"]
    ]

    return success_response(
        data={"items": items, "pagination": result["pagination"]},
        message="Milestones retrieved successfully",
    )
