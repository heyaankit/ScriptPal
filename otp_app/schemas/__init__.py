from pydantic import BaseModel
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    phone: str
    name: str | None = None
    email: str | None = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OTPRequest(BaseModel):
    phone: str


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str


class RegisterRequest(BaseModel):
    phone: str
    code: str
    name: str | None = None
    email: str | None = None


class LoginRequest(BaseModel):
    phone: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
