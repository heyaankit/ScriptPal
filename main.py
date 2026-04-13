from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.config import settings
from app.database import get_db, init_db
from app.models import User, OTP
from app.schemas import (
    UserResponse,
    OTPRequest,
    RegisterRequest,
    LoginRequest,
    TokenResponse,
)
from app.services import otp_service, jwt_service
from app.api.v1.scripts import router as scripts_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.progress import router as progress_router
from app.api.v1.reports import router as reports_router
from app.api.v1.activities import router as activities_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.profile import router as profile_router
from app.api.v1.library import router as library_router


app = FastAPI(title="ScriptPal - Autism Support Application", version="1.0.0")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

app.include_router(scripts_router, prefix="/api/v1", tags=["Scripts"])
app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(progress_router, prefix="/api/v1", tags=["Progress"])
app.include_router(reports_router, prefix="/api/v1", tags=["Reports"])
app.include_router(activities_router, prefix="/api/v1", tags=["Activities"])
app.include_router(notifications_router, prefix="/api/v1", tags=["Notifications"])
app.include_router(profile_router, prefix="/api/v1", tags=["Profile"])
app.include_router(library_router, prefix="/api/v1", tags=["Library"])

init_db()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title="ScriptPal - Autism Support Application",
        version="1.0.0",
        description="Communication and progress tracking tool for children with autism",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "description": "Enter your access token",
        }
    }
    protected_paths = [
        "/profile",
        "/dashboard",
        "/scripts",
        "/progress",
        "/milestones",
        "/reports",
        "/activities",
        "/activity-logs",
        "/notifications",
        "/users/me",
    ]
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if method in ["get", "post", "put", "patch", "delete"]:
                for protected in protected_paths:
                    if protected in path:
                        openapi_schema["paths"][path][method]["security"] = [
                            {"Bearer": []}
                        ]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "scriptpal"}


@app.get("/")
def root():
    return {"message": "ScriptPal - Autism Support Application"}


@app.post(
    "/api/v1/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    success, message = otp_service.verify_otp(
        db, request.country_code, request.phone, request.code
    )

    if not success:
        raise HTTPException(status_code=401, detail=message)

    existing = db.query(User).filter(User.phone == request.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        country_code=request.country_code,
        phone=request.phone,
        is_verified=True,
        name=request.name,
        email=request.email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/v1/auth/request-otp", tags=["Authentication"])
def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.phone == request.phone).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=400, detail="User already registered, use login"
        )

    otp_service.create_otp(db, request.country_code, request.phone, purpose="register")
    return {"message": "OTP sent successfully"}


@app.post("/api/v1/auth/request-login-otp", tags=["Authentication"])
def request_login_otp(request: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="User not verified")

    otp_service.create_otp(db, request.country_code, request.phone, purpose="login")
    return {"message": "OTP sent successfully"}


@app.post("/api/v1/auth/login", response_model=TokenResponse, tags=["Authentication"])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="User not verified")

    success, message = otp_service.verify_otp(
        db, request.country_code, request.phone, request.code
    )

    if not success:
        raise HTTPException(status_code=401, detail=message)

    token = jwt_service.create_access_token(
        data={"sub": user.id, "phone": user.phone, "country_code": user.country_code}
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/v1/users/me", response_model=UserResponse, tags=["Authentication"])
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        payload = jwt_service.decode_token(token)
        user_id = payload.get("sub")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
