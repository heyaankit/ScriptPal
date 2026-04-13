"""Pagination utilities for API responses."""

import math
from typing import Any, List


def paginate(query: Any, page: int = 1, page_size: int = 10) -> dict:
    """
    Paginate a database query result.

    Args:
        query: SQLAlchemy query object
        page: Current page number (1-indexed)
        page_size: Number of items per page

    Returns:
        dict: Paginated results with pagination metadata
    """
    # Ensure valid page and page_size
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    # Get total count
    total_items = query.count()
    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 0

    # Calculate offset
    offset = (page - 1) * page_size

    # Get items for current page
    items = query.offset(offset).limit(page_size).all()

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
        },
    }
