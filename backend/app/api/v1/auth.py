from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models import User, UserRole, UserPrivacyPreference, AuditLog
from app.schemas import Token, UserCreate, UserLogin, UserResponse, UserChangePassword, UserUpdate
from app.api.deps import get_current_user, check_rate_limit, sanitize_input

router = APIRouter(prefix="/auth", tags=["Authentication"], dependencies=[Depends(check_rate_limit)])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with secure password hashing."""
    email_clean = sanitize_input(user_in.email.lower())
    full_name_clean = sanitize_input(user_in.full_name)

    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Check if first user; if so, make admin
    user_count = db.query(User).count()
    role = UserRole.ADMIN.value if user_count == 0 else UserRole.USER.value
    is_superuser = True if user_count == 0 else False

    user = User(
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        full_name=full_name_clean,
        role=role,
        is_superuser=is_superuser,
        last_login_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.flush()

    # Create default privacy preferences for user
    privacy_pref = UserPrivacyPreference(
        user_id=user.id,
        consent_data_retention=True,
        consent_personalization=True,
        analytics_opt_in=False,
        retention_days=90
    )
    db.add(privacy_pref)

    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action="USER_REGISTER",
        resource_type="User",
        resource_id=user.id,
        details_json={"email": user.email, "role": user.role}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate existing user and return access token."""
    email_clean = sanitize_input(login_in.email.lower())
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)

    audit = AuditLog(
        user_id=user.id,
        action="USER_LOGIN",
        resource_type="User",
        resource_id=user.id,
        details_json={"email": user.email}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of current authenticated user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information of current authenticated user."""
    if user_update.full_name:
        current_user.full_name = sanitize_input(user_update.full_name)
    if user_update.email:
        clean_email = sanitize_input(user_update.email.lower())
        existing = db.query(User).filter(User.email == clean_email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account.")
        current_user.email = clean_email
    
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    pwd_in: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user."""
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match.")
    
    if pwd_in.new_password == pwd_in.current_password:
        raise HTTPException(status_code=400, detail="New password cannot be identical to current password.")

    current_user.hashed_password = get_password_hash(pwd_in.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)

    audit = AuditLog(
        user_id=current_user.id,
        action="PASSWORD_CHANGE",
        resource_type="User",
        resource_id=current_user.id,
        details_json={"info": "Password successfully updated"}
    )
    db.add(audit)
    db.commit()

    return {"message": "Password changed successfully."}
