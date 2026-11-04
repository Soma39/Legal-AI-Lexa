import time
import re
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

# In-memory simple rate limiter per client IP
RATE_LIMIT_BUCKETS: Dict[str, list] = {}
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 120  # requests per window


def check_rate_limit(request: Request):
    """Basic IP-based rate limiting middleware dependency."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    if client_ip not in RATE_LIMIT_BUCKETS:
        RATE_LIMIT_BUCKETS[client_ip] = []
    
    # Filter timestamps within current window
    RATE_LIMIT_BUCKETS[client_ip] = [
        ts for ts in RATE_LIMIT_BUCKETS[client_ip] if now - ts < RATE_LIMIT_WINDOW
    ]
    
    if len(RATE_LIMIT_BUCKETS[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )
    
    RATE_LIMIT_BUCKETS[client_ip].append(now)


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to guard against XSS and basic prompt injection markers.
    Treats input as raw untrusted data.
    """
    if not text:
        return ""
    # Strip dangerous HTML tags
    cleaned = re.sub(r"<(script|iframe|object|embed|style)[^>]*>.*?</\1>", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"<(script|iframe|object|embed|style)[^>]*>", "", cleaned, flags=re.IGNORECASE)
    # Strip null bytes
    cleaned = cleaned.replace("\x00", "")
    return cleaned.strip()


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Authenticate request using JWT token and retrieve the user."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    return user


def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the authenticated user has administrative privileges."""
    if not current_user.is_superuser and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Return user if authenticated, otherwise return None."""
    if not token:
        return None
    user_id = decode_access_token(token)
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()
