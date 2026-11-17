from datetime import datetime, timedelta, timezone

from fastapi import Depends
from sqlalchemy import case, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.responses import success
from app.api.openapi import create_api_router
from app.core.database import get_db
from app.core.errors import APIError
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models import User
from app.schemas import LoginRequest, RegisterRequest

router = create_api_router("/api/auth", ["authentication"])
LOGIN_FAILURE_LIMIT = 10
LOGIN_FAILURE_WINDOW = timedelta(minutes=15)
LOGIN_LOCKOUT_DURATION = timedelta(minutes=15)


@router.post("/register", status_code=201, summary="Register a user account")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise APIError(409, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists") from None
    return success({"id": str(user.id), "email": user.email})


@router.post("/login", summary="Exchange credentials for an access token")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    now = datetime.now(timezone.utc)
    if user is not None and user.login_locked_until is not None:
        locked_until = user.login_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > now:
            raise APIError(429, "LOGIN_RATE_LIMITED", "Too many failed sign-in attempts; try again later")

    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        if user is not None:
            expired_window = (
                User.login_window_started_at.is_(None)
                | (User.login_window_started_at <= now - LOGIN_FAILURE_WINDOW)
            )
            failures = case(
                (expired_window, 1),
                else_=User.login_failed_attempts + 1,
            )
            db.execute(
                update(User)
                .where(User.id == user.id)
                .values(
                    login_failed_attempts=failures,
                    login_window_started_at=case(
                        (expired_window, now),
                        else_=User.login_window_started_at,
                    ),
                    login_locked_until=case(
                        (expired_window, None),
                        (User.login_failed_attempts + 1 >= LOGIN_FAILURE_LIMIT, now + LOGIN_LOCKOUT_DURATION),
                        else_=User.login_locked_until,
                    ),
                )
            )
            db.commit()
        raise APIError(401, "INVALID_CREDENTIALS", "Email or password is incorrect")
    db.execute(
        update(User)
        .where(User.id == user.id)
        .values(
            login_failed_attempts=0,
            login_window_started_at=None,
            login_locked_until=None,
        )
    )
    db.commit()
    return success({"access_token": create_access_token(user.id), "token_type": "bearer"})


@router.get("/me", summary="Get the authenticated user")
def me(user: User = Depends(get_current_user)):
    return success({"id": str(user.id), "email": user.email})
