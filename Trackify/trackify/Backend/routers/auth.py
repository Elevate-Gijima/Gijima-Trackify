# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from jose import jwt

from database import get_db
from schemas import (
    LoginRequest, TokenResponse, LogoutResponse, AuthResponse,
    ForgotPasswordRequest, ForgotPasswordResponse
)
from crud import authenticate_user, get_user_by_email
from config import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES,
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
)
from email_utils import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(data={"sub": str(user.employee_id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
    }


@router.post("/logout", response_model=LogoutResponse)
def logout():
    return {"message": "Logged out successfully"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Check if email exists and send password reset email.
    Only manager and employee roles can use this endpoint.
    Always returns success message for security (don't reveal if email exists).
    """
    user = get_user_by_email(db, request.email)
    
    if user:
        # Check if user role is manager or employee only
        role_value = user.role.value if hasattr(user.role, 'value') else str(user.role)
        normalized_role = role_value.lower().replace('roleenum.', '').strip()
        
        if normalized_role not in ['manager', 'employee']:
            # Always return success message for security (don't reveal if email exists or role restriction)
            return {
                "message": "If an account with that email exists, a password reset link has been sent."
            }
        
        # Generate reset token (valid for 5 minutes)
        reset_data = {
            "sub": str(user.employee_id),
            "email": user.email,
            "type": "password_reset"
        }
        reset_token = create_access_token(
            data=reset_data,
            expires_delta=timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        )
        
        # Send email with reset token
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        email_sent = send_password_reset_email(user.email, reset_token, reset_url)
        
        if not email_sent:
            # Log error but still return success message for security
            print(f"WARNING: Failed to send password reset email to {user.email}")
    
    # Always return success message (security best practice - don't reveal if email exists)
    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }
