import secrets
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models import OTP, User
from app.config import settings


def generate_otp() -> str:
    return "".join([str(secrets.randbelow(10)) for _ in range(settings.OTP_LENGTH)])


def create_otp(
    db: Session, country_code: str, phone: str, purpose: str = "login"
) -> OTP:
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTP(
        country_code=country_code,
        phone=phone,
        code=otp_code,
        expires_at=expires_at,
        purpose=purpose,
    )
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp


def verify_otp(
    db: Session, country_code: str, phone: str, code: str
) -> tuple[bool, str]:
    otp = (
        db.query(OTP)
        .filter(OTP.country_code == country_code, OTP.phone == phone, OTP.used == False)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp:
        return False, "No OTP found"

    if otp.expires_at < datetime.utcnow():
        return False, "OTP expired"

    if otp.code != code:
        return False, "Invalid OTP"

    otp.used = True
    db.commit()

    user = db.query(User).filter(User.phone == phone).first()
    if user and not user.is_verified:
        user.is_verified = True
        db.commit()

    return True, "OTP verified"


def get_valid_otp(db: Session, country_code: str, phone: str) -> OTP | None:
    return (
        db.query(OTP)
        .filter(
            OTP.country_code == country_code,
            OTP.phone == phone,
            OTP.used == False,
            OTP.expires_at > datetime.utcnow(),
        )
        .first()
    )
