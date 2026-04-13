"""Library API endpoints for public resource access."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import LibraryResource
from app.utils.pagination import paginate
from app.utils.responses import success_response

router = APIRouter(prefix="/library", tags=["Library"])


class LibraryResourceResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    age_group: Optional[str]
    avatar_url: Optional[str]

    class Config:
        from_attributes = True


class LibraryResourceDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    age_group: Optional[str]
    avatar_url: Optional[str]
    full_content: Optional[str] = None
    tips: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("")
def list_library_resources(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    age_group: Optional[str] = Query(None),
):
    """List library resources with pagination and filters (public endpoint)."""
    query = db.query(LibraryResource)

    # Apply filters
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (LibraryResource.title.ilike(search_term))
            | (LibraryResource.description.ilike(search_term))
        )
    if category:
        query = query.filter(LibraryResource.category == category)
    if age_group:
        query = query.filter(LibraryResource.age_group == age_group)

    # Get available categories and age groups for filter options
    available_categories = (
        db.query(LibraryResource.category)
        .distinct()
        .filter(LibraryResource.category.isnot(None))
        .all()
    )
    available_categories = [c[0] for c in available_categories]

    available_age_groups = (
        db.query(LibraryResource.age_group)
        .distinct()
        .filter(LibraryResource.age_group.isnot(None))
        .all()
    )
    available_age_groups = [ag[0] for ag in available_age_groups if ag[0]]

    # Order by title
    query = query.order_by(LibraryResource.title.asc())

    # Paginate
    result = paginate(query, page=page, page_size=page_size)

    resources = [
        LibraryResourceResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            category=r.category,
            age_group=r.age_group,
            avatar_url=r.avatar_url,
        ).model_dump()
        for r in result["items"]
    ]

    return success_response(
        data={
            "items": resources,
            "pagination": result["pagination"],
            "filters": {
                "available_categories": available_categories,
                "available_age_groups": available_age_groups,
            },
        },
        message="Library resources retrieved successfully",
    )


@router.get("/{resource_id}")
def get_library_resource(
    resource_id: str,
    db: Session = Depends(get_db),
):
    """Get a single library resource by ID (public endpoint)."""
    resource = (
        db.query(LibraryResource).filter(LibraryResource.id == resource_id).first()
    )

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    response = LibraryResourceDetailResponse(
        id=resource.id,
        title=resource.title,
        description=resource.description,
        category=resource.category,
        age_group=resource.age_group,
        avatar_url=resource.avatar_url,
    )

    return success_response(
        data=response.model_dump(), message="Resource retrieved successfully"
    )
