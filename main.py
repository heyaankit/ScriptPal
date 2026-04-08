from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from otp_app.config import settings
from otp_app.database import get_db, init_db
from otp_app.models import User, OTP
from otp_app.schemas import (
    UserResponse,
    OTPRequest,
    OTPVerifyRequest,
    RegisterRequest,
    LoginRequest,
    TokenResponse,
)
from otp_app.services import otp_service, jwt_service


app = FastAPI(title="OTP Authentication System", version="1.0.0")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

init_db()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title="OTP Authentication System",
        version="1.0.0",
        description="OTP-based authentication system",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "description": "Enter your access token",
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if method in ["get", "post", "put", "delete"]:
                if "/users/me" in path:
                    openapi_schema["paths"][path][method]["security"] = [{"Bearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "otp-auth-system"}


@app.get("/")
def root():
    return {"message": "OTP Authentication System"}


@app.post(
    "/api/v1/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    success, message = otp_service.verify_otp(db, request.phone, request.code)

    if not success:
        raise HTTPException(status_code=401, detail=message)

    existing = db.query(User).filter(User.phone == request.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user = User(
        phone=request.phone, is_verified=True, name=request.name, email=request.email
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/v1/auth/request-otp")
def request_otp(request: OTPRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.phone == request.phone).first()
    if existing_user and existing_user.is_verified:
        raise HTTPException(
            status_code=400, detail="User already registered, use login"
        )

    otp_service.create_otp(db, request.phone)
    return {"message": "OTP sent successfully"}


@app.post("/api/v1/auth/verify-otp", response_model=TokenResponse)
def verify_otp(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    success, message = otp_service.verify_otp(db, request.phone, request.code)

    if not success:
        raise HTTPException(status_code=401, detail=message)

    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = jwt_service.create_access_token(data={"sub": user.id, "phone": user.phone})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == request.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="User not verified")

    success, message = otp_service.verify_otp(db, request.phone, request.code)

    if not success:
        raise HTTPException(status_code=401, detail=message)

    token = jwt_service.create_access_token(data={"sub": user.id, "phone": user.phone})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/v1/users/me", response_model=UserResponse)
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
