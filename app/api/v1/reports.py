"""Reports API endpoints."""

from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, ReportSchedule
from app.services import jwt_service
from app.utils.pagination import paginate
from app.utils.responses import error_response, success_response

router = APIRouter(prefix="/reports", tags=["Reports"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Enum values
PERIOD_TYPE_VALUES = ["week", "month", "quarter"]
FREQUENCY_VALUES = ["daily", "weekly", "monthly"]


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


def calculate_period_dates(period_type: str) -> tuple[date, date]:
    """Calculate start and end dates for the given period type."""
    today = date.today()

    if period_type == "week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif period_type == "month":
        start = today.replace(day=1)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
    elif period_type == "quarter":
        quarter = (today.month - 1) // 3
        start = date(today.year, quarter * 3 + 1, 1)
        if start.month >= 10:
            end = date(today.year + 1, 1, 1) - timedelta(days=1)
        elif start.month >= 7:
            end = date(today.year, start.month + 3, 1) - timedelta(days=1)
        else:
            end = date(today.year, start.month + 3, 1) - timedelta(days=1)
    else:
        raise HTTPException(status_code=400, detail="Invalid period_type")

    return start, end


# Pydantic models
class ReportResponse(BaseModel):
    id: str
    title: str
    period_type: str
    start_date: date
    end_date: date
    total_scripts: int
    positive_pct: Optional[float]
    growth_rate: Optional[float]
    new_milestones: int
    generated_at: datetime

    class Config:
        from_attributes = True


class ReportGenerateRequest(BaseModel):
    period_type: str
    title: Optional[str] = None


class ReportShareEmailRequest(BaseModel):
    email: str


class ScheduleCreateRequest(BaseModel):
    frequency: str
    email: str


class ScheduleUpdateRequest(BaseModel):
    frequency: Optional[str] = None
    email: Optional[str] = None
    active: Optional[bool] = None


class ScheduleResponse(BaseModel):
    id: str
    frequency: str
    email: str
    active: bool
    created_at: datetime

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


@router.get("/current")
def get_current_report(
    period_type: str = Query(..., pattern="^(week|month|quarter)$"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get current period report."""
    validate_enum(period_type, PERIOD_TYPE_VALUES, "period_type")

    start_date, end_date = calculate_period_dates(period_type)

    # Try to find existing report for this period
    report = (
        db.query(Report)
        .filter(
            Report.user_id == user_id,
            Report.period_type == period_type,
            Report.start_date == start_date,
            Report.end_date == end_date,
        )
        .first()
    )

    if not report:
        # Create a stub report with default values
        report = Report(
            user_id=user_id,
            title=f"Report {period_type.capitalize()} {start_date} - {end_date}",
            period_type=period_type,
            start_date=start_date,
            end_date=end_date,
            total_scripts=0,
            positive_pct=None,
            growth_rate=None,
            new_milestones=0,
            generated_at=datetime.utcnow(),
        )
        db.add(report)
        db.commit()
        db.refresh(report)

    response = ReportResponse(
        id=report.id,
        title=report.title,
        period_type=report.period_type,
        start_date=report.start_date,
        end_date=report.end_date,
        total_scripts=report.total_scripts,
        positive_pct=report.positive_pct,
        growth_rate=report.growth_rate,
        new_milestones=report.new_milestones,
        generated_at=report.generated_at,
    )

    return success_response(
        data=response.model_dump(), message="Current report retrieved successfully"
    )


@router.post("/generate")
def generate_report(
    request: ReportGenerateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Generate a new report for the specified period (stub - just creates record)."""
    validate_enum(request.period_type, PERIOD_TYPE_VALUES, "period_type")

    start_date, end_date = calculate_period_dates(request.period_type)

    # Create a new report (stub - uses default/placeholder values)
    title = (
        request.title
        or f"Report {request.period_type.capitalize()} {start_date} - {end_date}"
    )

    report = Report(
        user_id=user_id,
        title=title,
        period_type=request.period_type,
        start_date=start_date,
        end_date=end_date,
        total_scripts=0,
        positive_pct=None,
        growth_rate=None,
        new_milestones=0,
        generated_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    response = ReportResponse(
        id=report.id,
        title=report.title,
        period_type=report.period_type,
        start_date=report.start_date,
        end_date=report.end_date,
        total_scripts=report.total_scripts,
        positive_pct=report.positive_pct,
        growth_rate=report.growth_rate,
        new_milestones=report.new_milestones,
        generated_at=report.generated_at,
    )

    return success_response(
        data=response.model_dump(), message="Report generated successfully"
    )


@router.post("/{report_id}/share-email")
def share_report_email(
    report_id: str,
    request: ReportShareEmailRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Share report via email (stub - logs to console)."""
    # Verify the report exists and belongs to the user
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == user_id)
        .first()
    )

    if not report:
        return error_response(error="Report not found", error_code="NOT_FOUND")

    # Stub: log to console instead of sending email
    print(f"[STUB] Sending report '{report.title}' to email: {request.email}")

    return success_response(
        data={"report_id": report_id, "email": request.email},
        message="Report shared via email (stub)",
    )


@router.get("/schedules")
def list_schedules(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """List all report schedules for the user."""
    schedules = db.query(ReportSchedule).filter(ReportSchedule.user_id == user_id).all()

    items = [
        ScheduleResponse(
            id=s.id,
            frequency=s.frequency,
            email=s.email,
            active=s.active,
            created_at=s.created_at,
        ).model_dump()
        for s in schedules
    ]

    return success_response(
        data={"items": items}, message="Schedules retrieved successfully"
    )


@router.post("/schedules")
def create_schedule(
    request: ScheduleCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new report schedule."""
    validate_enum(request.frequency, FREQUENCY_VALUES, "frequency")

    schedule = ReportSchedule(
        user_id=user_id,
        frequency=request.frequency,
        email=request.email,
        active=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    response = ScheduleResponse(
        id=schedule.id,
        frequency=schedule.frequency,
        email=schedule.email,
        active=schedule.active,
        created_at=schedule.created_at,
    )

    return success_response(
        data=response.model_dump(), message="Schedule created successfully"
    )


@router.patch("/schedules/{schedule_id}", response_model=dict)
def update_schedule(
    schedule_id: str,
    request: ScheduleUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Update a report schedule."""
    schedule = (
        db.query(ReportSchedule)
        .filter(ReportSchedule.id == schedule_id, ReportSchedule.user_id == user_id)
        .first()
    )

    if not schedule:
        return error_response(error="Schedule not found", error_code="NOT_FOUND")

    # Validate and update fields
    if request.frequency is not None:
        validate_enum(request.frequency, FREQUENCY_VALUES, "frequency")
        schedule.frequency = request.frequency

    if request.email is not None:
        schedule.email = request.email

    if request.active is not None:
        schedule.active = request.active

    db.commit()
    db.refresh(schedule)

    response = ScheduleResponse(
        id=schedule.id,
        frequency=schedule.frequency,
        email=schedule.email,
        active=schedule.active,
        created_at=schedule.created_at,
    )

    return success_response(
        data=response.model_dump(), message="Schedule updated successfully"
    )


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Delete a report schedule."""
    schedule = (
        db.query(ReportSchedule)
        .filter(ReportSchedule.id == schedule_id, ReportSchedule.user_id == user_id)
        .first()
    )

    if not schedule:
        return error_response(error="Schedule not found", error_code="NOT_FOUND")

    db.delete(schedule)
    db.commit()

    return success_response(data={}, message="Schedule deleted successfully")


@router.get("/history")
def list_report_history(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    period_type: Optional[str] = Query(None, pattern="^(week|month|quarter)$"),
):
    """List previous reports with pagination and optional period filter."""
    query = db.query(Report).filter(Report.user_id == user_id)

    if period_type:
        validate_enum(period_type, PERIOD_TYPE_VALUES, "period_type")
        query = query.filter(Report.period_type == period_type)

    # Order by generated_at descending (most recent first)
    query = query.order_by(Report.generated_at.desc())

    result = paginate(query, page=page, page_size=page_size)

    items = [
        ReportResponse(
            id=r.id,
            title=r.title,
            period_type=r.period_type,
            start_date=r.start_date,
            end_date=r.end_date,
            total_scripts=r.total_scripts,
            positive_pct=r.positive_pct,
            growth_rate=r.growth_rate,
            new_milestones=r.new_milestones,
            generated_at=r.generated_at,
        ).model_dump()
        for r in result["items"]
    ]

    return success_response(
        data={"items": items, "pagination": result["pagination"]},
        message="Report history retrieved successfully",
    )


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get download URL for a report (stub)."""
    # Verify the report exists and belongs to the user
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == user_id)
        .first()
    )

    if not report:
        return error_response(error="Report not found", error_code="NOT_FOUND")

    # Stub: return a placeholder download URL
    download_url = f"https://api.example.com/reports/{report_id}/download/stub"

    return success_response(
        data={"report_id": report_id, "download_url": download_url},
        message="Download URL retrieved (stub)",
    )
