from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, oauth2_scheme
from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_client
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.models.domain import User
from app.schemas.domain import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    TokenSchema,
    UserOut,
)

router = APIRouter()


@router.post("/login", response_model=TokenSchema)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Generic error message to prevent account enumeration
    invalid_cred_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )

    stmt = select(User).where(User.username == login_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise invalid_cred_exception

    if not verify_password(login_data.password, user.password_hash):
        raise invalid_cred_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an administrator.",
        )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    await log_audit_action(
        db=db,
        actor_id=user.id,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        ip_address=request.client.host if request.client else None,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await redis_client.blacklist_token(token)
    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="USER_LOGOUT",
        entity_type="USER",
        entity_id=current_user.id,
        ip_address=request.client.host if request.client else None,
    )
    return {"detail": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # Do not leak account existence
    if user:
        reset_token = create_access_token(
            subject=user.id,
            expires_delta=timedelta(minutes=15),
            extra_claims={"type": "password_reset"},
        )
        await redis_client.set(f"reset:{reset_token}", user.id, expire_seconds=900)

    return {"detail": "If an account with that email exists, password reset instructions have been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_id = await redis_client.get(f"reset:{data.token}")
    if not user_id:
        payload = decode_token(data.token)
        if not payload or payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid or expired password reset token")
        user_id = payload.get("sub")

    if not validate_password_strength(data.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters, contain uppercase, lowercase, digit, and special character.",
        )

    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    await redis_client.delete(f"reset:{data.token}")

    return {"detail": "Password has been successfully reset."}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if not validate_password_strength(data.new_password):
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters, contain uppercase, lowercase, digit, and special character.",
        )

    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()

    return {"detail": "Password updated successfully"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
