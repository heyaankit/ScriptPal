# ScriptPal - Autism Support Application

Backend API for a communication and progress tracking tool for children with autism and their caregivers.

## Features

- **Authentication**: OTP-based login system
- **Scripts Management**: Create, read, update, delete communication scripts
- **Dashboard**: Personalized dashboard with daily suggestions and insights
- **Progress Tracking**: Weekly, monthly, quarterly progress analytics
- **Reports**: Generate and schedule progress reports
- **Library**: Pre-defined communication resources
- **Activities**: Interactive activities for children
- **Notifications**: Activity and milestone notifications
- **Profile Management**: User profile with child information

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy
- **Authentication**: JWT + OTP
- **Validation**: Pydantic

## Installation

```bash
# Create virtual environment
python -m venv .venv

# Activate
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
# Start the server
uvicorn main:app --reload

# Server runs at http://127.0.0.1:8000
# API Docs at http://127.0.0.1:8000/docs
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/v1/auth/request-otp` | Request OTP for registration |
| POST | `/api/v1/auth/register` | Register with OTP |
| POST | `/api/v1/auth/request-login-otp` | Request OTP for login |
| POST | `/api/v1/auth/login` | Login with OTP |

### Scripts (5 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/v1/scripts` | Create script |
| GET | `/api/v1/scripts` | List scripts |
| GET | `/api/v1/scripts/{id}` | Get script |
| PATCH | `/api/v1/scripts/{id}` | Update script (partial) |
| DELETE | `/api/v1/scripts/{id}` | Delete script |

### Dashboard (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/dashboard` | Dashboard data |
| GET | `/api/v1/dashboard/notification-count` | Unread notifications |

### Progress (6 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/progress/summary` | Progress summary |
| GET | `/api/v1/progress/weekly` | Weekly chart |
| GET | `/api/v1/progress/emotions` | Emotions chart |
| GET | `/api/v1/progress/trends` | Long-term trends |
| POST | `/api/v1/milestones` | Create milestone |
| GET | `/api/v1/milestones` | List milestones |

### Reports (9 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/reports/current` | Current report |
| POST | `/api/v1/reports/generate` | Generate report |
| POST | `/api/v1/reports/{id}/share-email` | Share via email |
| GET | `/api/v1/reports/schedules` | List schedules |
| POST | `/api/v1/reports/schedules` | Create schedule |
| PATCH | `/api/v1/reports/schedules/{id}` | Update schedule |
| DELETE | `/api/v1/reports/schedules/{id}` | Delete schedule |
| GET | `/api/v1/reports/history` | Report history |
| GET | `/api/v1/reports/{id}/download` | Download report |

### Library (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/library` | List resources |
| GET | `/api/v1/library/{id}` | Get resource |

### Activities (4 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/activities` | List activities |
| GET | `/api/v1/activities/{id}` | Get activity |
| POST | `/api/v1/activity-logs` | Log activity |
| GET | `/api/v1/activity-logs` | Activity logs |

### Notifications (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/notifications` | List notifications |
| PATCH | `/api/v1/notifications/{id}/read` | Mark as read |

### Profile (2 endpoints)
| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/api/v1/profile` | Get profile |
| PATCH | `/api/v1/profile` | Update profile |

## Seed Data

To populate the database with initial data:

```bash
python -m app.seed
```

This creates:
- 8 daily suggestions
- 80+ library resources
- 40+ activities

## Response Format

All API responses follow this envelope format:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "error_code": "ERROR_CODE"
}
```

## Pagination

List endpoints support pagination:
```
?page=1&page_size=20
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 45,
    "total_pages": 3
  }
}
```

## Environment Variables

Create a `.env` file or the defaults in `app/config.py` will be used:
- `DATABASE_URL`: SQLite database path
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiry
- `OTP_LENGTH`: OTP digits (default: 6)
- `OTP_EXPIRE_MINUTES`: OTP validity (default: 5)

## License

MIT