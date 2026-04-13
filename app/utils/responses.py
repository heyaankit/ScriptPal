"""Response envelope utilities for API responses."""


def success_response(data: dict, message: str = "Operation successful") -> dict:
    """
    Create a successful response envelope.

    Args:
        data: The response data
        message: Success message

    Returns:
        dict: Success envelope format
    """
    return {"success": True, "data": data, "message": message}


def error_response(error: str, error_code: str) -> dict:
    """
    Create an error response envelope.

    Args:
        error: Error message
        error_code: Error code identifier

    Returns:
        dict: Error envelope format
    """
    return {"success": False, "data": {}, "error": error, "error_code": error_code}
