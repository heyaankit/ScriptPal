"""Activities API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, ActivityLog
from app.services import jwt_service
from app.utils.pagination import paginate
from app.utils.responses import error_response, success_response

router = APIRouter(tags=["Activities"])
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


# Pydantic models
class ActivityResponse(BaseModel):
    id: str
    title: str
    description: str
    image_url: Optional[str]
    age_range: Optional[str]
    stage: Optional[str]
    play_duration: Optional[str]
    category: Optional[str]

    class Config:
        from_attributes = True


class ActivityLogCreate(BaseModel):
    activity_id: str
    status: str


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    activity_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# Valid status values
ACTIVITY_LOG_STATUSES = ["started", "completed"]
AVAILABLE_AGE_RANGES = ["0-2", "3-5", "6-8", "9-12", "13+"]
AVAILABLE_STAGES = ["early", "middle", "late"]
AVAILABLE_CATEGORIES = [
    "social",
    "communication",
    "sensory",
    "motor",
    "cognitive",
    "emotional",
]


def validate_enum(value: str, allowed: list, field_name: str) -> str:
    """Validate enum value."""
    if value not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}. Allowed: {', '.join(allowed)}",
        )
    return value


@router.get("/activities")
def list_activities(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    age_range: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
):
    """List activities with pagination and filters."""
    query = db.query(Activity)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Activity.title.ilike(search_term))
            | (Activity.description.ilike(search_term))
        )
    if age_range:
        query = query.filter(Activity.age_range == age_range)
    if stage:
        query = query.filter(Activity.stage == stage)
    if category:
        query = query.filter(Activity.category == category)

    # Order by created_at desc by default
    query = query.order_by(Activity.id.desc())

    # Paginate
    result = paginate(query, page=page, page_size=page_size)

    items = [
        ActivityResponse(
            id=a.id,
            title=a.title,
            description=a.description,
            image_url=a.image_url,
            age_range=a.age_range,
            stage=a.stage,
            play_duration=a.play_duration,
            category=a.category,
        ).model_dump()
        for a in result["items"]
    ]

    # Get available filter options
    available_age_ranges = (
        db.query(Activity.age_range)
        .filter(Activity.age_range.isnot(None))
        .distinct()
        .all()
    )
    available_age_ranges = [r[0] for r in available_age_ranges if r[0]]

    available_stages = (
        db.query(Activity.stage).filter(Activity.stage.isnot(None)).distinct().all()
    )
    available_stages = [r[0] for r in available_stages if r[0]]

    available_categories = (
        db.query(Activity.category)
        .filter(Activity.category.isnot(None))
        .distinct()
        .all()
    )
    available_categories = [r[0] for r in available_categories if r[0]]

    return success_response(
        data={
            "items": items,
            "pagination": result["pagination"],
            "filters": {
                "available_age_ranges": available_age_ranges,
                "available_stages": available_stages,
                "available_categories": available_categories,
            },
        },
        message="Activities retrieved successfully",
    )


@router.get("/activities/{activity_id}")
def get_activity(
    activity_id: str,
    db: Session = Depends(get_db),
):
    """Get a single activity by ID."""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if not activity:
        return error_response(error="Activity not found", error_code="NOT_FOUND")

    response = ActivityResponse(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        image_url=activity.image_url,
        age_range=activity.age_range,
        stage=activity.stage,
        play_duration=activity.play_duration,
        category=activity.category,
    )

    return success_response(
        data=response.model_dump(), message="Activity retrieved successfully"
    )


@router.post("/activity-logs")
def create_activity_log(
    log_data: ActivityLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create an activity log (start or complete)."""
    # Validate status
    validate_enum(log_data.status, ACTIVITY_LOG_STATUSES, "status")

    # Check if activity exists
    activity = db.query(Activity).filter(Activity.id == log_data.activity_id).first()
    if not activity:
        return error_response(error="Activity not found", error_code="NOT_FOUND")

    # If status is completed, check for existing started log
    if log_data.status == "completed":
        existing_log = (
            db.query(ActivityLog)
            .filter(
                ActivityLog.user_id == user_id,
                ActivityLog.activity_id == log_data.activity_id,
                ActivityLog.status == "started",
            )
            .first()
        )
        if existing_log:
            # Update existing log to completed
            existing_log.status = "completed"
            existing_log.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_log)

            response = ActivityLogResponse(
                id=existing_log.id,
                user_id=existing_log.user_id,
                activity_id=existing_log.activity_id,
                status=existing_log.status,
                started_at=existing_log.started_at,
                completed_at=existing_log.completed_at,
            )
            return success_response(
                data=response.model_dump(),
                message="Activity completed successfully",
            )

    # Create new log
    log = ActivityLog(
        user_id=user_id,
        activity_id=log_data.activity_id,
        status=log_data.status,
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow() if log_data.status == "completed" else None,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    response = ActivityLogResponse(
        id=log.id,
        user_id=log.user_id,
        activity_id=log.activity_id,
        status=log.status,
        started_at=log.started_at,
        completed_at=log.completed_at,
    )

    status_msg = "started" if log.status == "started" else "completed"
    return success_response(
        data=response.model_dump(),
        message=f"Activity {status_msg} successfully",
    )


@router.get("/activity-logs")
def list_activity_logs(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
):
    """List activity logs for the current user."""
    query = db.query(ActivityLog).filter(ActivityLog.user_id == user_id)

    # Apply filters
    if status:
        query = query.filter(ActivityLog.status == status)

    # Order by started_at desc
    query = query.order_by(ActivityLog.started_at.desc())

    # Paginate
    result = paginate(query, page=page, page_size=page_size)

    items = [
        ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            activity_id=log.activity_id,
            status=log.status,
            started_at=log.started_at,
            completed_at=log.completed_at,
        ).model_dump()
        for log in result["items"]
    ]

    return success_response(
        data={"items": items, "pagination": result["pagination"]},
        message="Activity logs retrieved successfully",
    )
