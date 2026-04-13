from pydantic import BaseModel
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    country_code: str
    phone: str
    name: str | None = None
    email: str | None = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class OTPRequest(BaseModel):
    country_code: str
    phone: str


class RegisterRequest(BaseModel):
    country_code: str
    phone: str
    code: str
    name: str | None = None
    email: str | None = None


class LoginRequest(BaseModel):
    country_code: str
    phone: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
