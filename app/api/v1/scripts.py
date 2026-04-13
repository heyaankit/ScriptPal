"""Scripts CRUD API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Script
from app.services import jwt_service
from app.utils.pagination import paginate
from app.utils.responses import error_response, success_response

router = APIRouter(prefix="/scripts", tags=["Scripts"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Enum values
CONTEXT_VALUES = ["home", "school", "car", "bedtime"]
EMOTIONAL_STATE_VALUES = ["happy", "sad", "angry", "anxious", "excited", "neutral"]
SOURCE_VALUES = ["tv", "song", "parent", "school", "unknown"]
FREQUENCY_VALUES = ["new", "repeated", "variation"]


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
class ScriptCreate(BaseModel):
    script_text: str
    context: str
    emotional_state: str
    source: str
    frequency: str
    meaning: Optional[str] = None
    notes: Optional[str] = None


class ScriptUpdate(BaseModel):
    script_text: Optional[str] = None
    context: Optional[str] = None
    emotional_state: Optional[str] = None
    source: Optional[str] = None
    frequency: Optional[str] = None
    meaning: Optional[str] = None
    notes: Optional[str] = None


class ScriptResponse(BaseModel):
    id: str
    script_text: str
    context: str
    emotional_state: str
    source: str
    frequency: str
    meaning: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    time_ago: str

    class Config:
        from_attributes = True


def validate_enum(value: str, allowed: list, field_name: str) -> str:
    """Validate enum value."""
    if value not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}. Allowed: {', '.join(allowed)}",
        )
    return value


@router.post("")
def create_script(
    script_data: ScriptCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new script."""
    # Validate enums
    validate_enum(script_data.context, CONTEXT_VALUES, "context")
    validate_enum(
        script_data.emotional_state, EMOTIONAL_STATE_VALUES, "emotional_state"
    )
    validate_enum(script_data.source, SOURCE_VALUES, "source")
    validate_enum(script_data.frequency, FREQUENCY_VALUES, "frequency")

    script = Script(
        user_id=user_id,
        script_text=script_data.script_text,
        context=script_data.context,
        emotional_state=script_data.emotional_state,
        source=script_data.source,
        frequency=script_data.frequency,
        meaning=script_data.meaning,
        notes=script_data.notes,
    )
    db.add(script)
    db.commit()
    db.refresh(script)

    response = ScriptResponse(
        id=script.id,
        script_text=script.script_text,
        context=script.context,
        emotional_state=script.emotional_state,
        source=script.source,
        frequency=script.frequency,
        meaning=script.meaning,
        notes=script.notes,
        created_at=script.created_at,
        updated_at=script.updated_at,
        time_ago=time_ago(script.created_at),
    )

    return success_response(
        data=response.model_dump(), message="Script created successfully"
    )


@router.get("")
def list_scripts(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    context: Optional[str] = None,
    emotional_state: Optional[str] = None,
    frequency: Optional[str] = None,
    sort_by: str = Query(
        "created_at", pattern="^(created_at|updated_at|context|emotional_state)$"
    ),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
):
    """List scripts with pagination and filters."""
    query = db.query(Script).filter(Script.user_id == user_id)

    # Apply filters
    if context:
        query = query.filter(Script.context == context)
    if emotional_state:
        query = query.filter(Script.emotional_state == emotional_state)
    if frequency:
        query = query.filter(Script.frequency == frequency)

    # Apply sorting
    sort_column = getattr(Script, sort_by, Script.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Paginate
    result = paginate(query, page=page, page_size=page_size)

    items = [
        ScriptResponse(
            id=s.id,
            script_text=s.script_text,
            context=s.context,
            emotional_state=s.emotional_state,
            source=s.source,
            frequency=s.frequency,
            meaning=s.meaning,
            notes=s.notes,
            created_at=s.created_at,
            updated_at=s.updated_at,
            time_ago=time_ago(s.created_at),
        ).model_dump()
        for s in result["items"]
    ]

    return success_response(
        data={"items": items, "pagination": result["pagination"]},
        message="Scripts retrieved successfully",
    )


@router.get("/{script_id}")
def get_script(
    script_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get a single script by ID."""
    script = (
        db.query(Script)
        .filter(Script.id == script_id, Script.user_id == user_id)
        .first()
    )

    if not script:
        return error_response(error="Script not found", error_code="NOT_FOUND")

    response = ScriptResponse(
        id=script.id,
        script_text=script.script_text,
        context=script.context,
        emotional_state=script.emotional_state,
        source=script.source,
        frequency=script.frequency,
        meaning=script.meaning,
        notes=script.notes,
        created_at=script.created_at,
        updated_at=script.updated_at,
        time_ago=time_ago(script.created_at),
    )

    return success_response(
        data=response.model_dump(), message="Script retrieved successfully"
    )


@router.patch("/{script_id}", response_model=dict)
def update_script(
    script_id: str,
    script_data: ScriptUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a script (partial update)."""
    script = (
        db.query(Script)
        .filter(Script.id == script_id, Script.user_id == user_id)
        .first()
    )

    if not script:
        return error_response(error="Script not found", error_code="NOT_FOUND")

    # Validate and update fields
    update_data = script_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            if field in ["context", "emotional_state", "source", "frequency"]:
                validate_enum(
                    value,
                    CONTEXT_VALUES
                    if field == "context"
                    else EMOTIONAL_STATE_VALUES
                    if field == "emotional_state"
                    else SOURCE_VALUES
                    if field == "source"
                    else FREQUENCY_VALUES,
                    field,
                )
            setattr(script, field, value)

    script.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(script)

    response = ScriptResponse(
        id=script.id,
        script_text=script.script_text,
        context=script.context,
        emotional_state=script.emotional_state,
        source=script.source,
        frequency=script.frequency,
        meaning=script.meaning,
        notes=script.notes,
        created_at=script.created_at,
        updated_at=script.updated_at,
        time_ago=time_ago(script.created_at),
    )

    return success_response(
        data=response.model_dump(), message="Script updated successfully"
    )


@router.delete("/{script_id}")
def delete_script(
    script_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a script."""
    script = (
        db.query(Script)
        .filter(Script.id == script_id, Script.user_id == user_id)
        .first()
    )

    if not script:
        return error_response(error="Script not found", error_code="NOT_FOUND")

    db.delete(script)
    db.commit()

    return success_response(data={}, message="Script deleted successfully")
