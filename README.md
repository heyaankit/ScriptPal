# OTP-Based Authentication System

A FastAPI-based OTP authentication system for mobile-first applications.

## Features

- User registration with phone number
- OTP generation and verification (6 digits, 5 min expiry)
- Login via phone + OTP (no password)
- JWT token-based authentication
- Protected routes
- Health check endpoint

## Tech Stack

- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **python-jose** - JWT tokens
- **pydantic** - Data validation

## Setup

1. **Create virtual environment:**
```bash
python -m venv otp_venv
source otp_venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install fastapi uvicorn[standard] sqlalchemy python-jose pydantic pydantic-settings
```

3. **Run the server:**
```bash
uvicorn main:app --reload
```

The API runs on `http://localhost:8000`
API docs: `http://localhost:8000/docs`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register with phone number |
| `/api/v1/auth/request-otp` | POST | Request OTP for phone |
| `/api/v1/auth/verify-otp` | POST | Verify OTP, returns JWT |
| `/api/v1/auth/login` | POST | Login with phone + OTP |
| `/api/v1/users/me` | GET | Get current user (protected) |
| `/health` | GET | Health check |

## Usage Example

### 1. Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "name": "John"}'
```

### 2. Request OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### 3. Verify OTP (get JWT)
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

### 4. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

### 5. Get Current User
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
.
├── main.py              # FastAPI app and routes
├── otp_app/
│   ├── config.py        # Settings
│   ├── database.py     # Database config
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   └── services/        # Business logic
├── data/                # SQLite database
└── otp_venv/           # Virtual environment
```

## Notes

- OTP is mock (generated and stored, not sent via SMS)
- OTP expires after 5 minutes
- JWT token expires after 30 minutes
- SQLite database at `./data/app.db`