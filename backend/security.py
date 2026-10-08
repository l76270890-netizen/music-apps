import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User


JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-this-secret-before-deploying")
if os.getenv("APP_ENV", "development").lower() == "production" and (
    JWT_SECRET == "development-only-change-this-secret-before-deploying"
    or JWT_SECRET.startswith("replace-with-")
    or len(JWT_SECRET) < 32
):
    raise RuntimeError("Production requires a JWT_SECRET of at least 32 characters")
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "10080"))
ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def make_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expires}, JWT_SECRET, algorithm=ALGORITHM)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue", headers={"WWW-Authenticate": "Bearer"})
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise unauthorized
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise unauthorized
    return user
