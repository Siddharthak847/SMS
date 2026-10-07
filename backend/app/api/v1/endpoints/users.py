from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.core.security import get_password_hash, validate_password_strength
from app.models.domain import Role, User
from app.schemas.domain import PaginatedResponse, UserCreate, UserOut, UserUpdate

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
) -> Any:
    stmt = select(User)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.username.ilike(pattern))
            | (User.email.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )

    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    if role:
        stmt = stmt.join(User.roles).where(Role.name == role)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Paginate
    stmt = stmt.offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)
    users = result.scalars().all()

    items = [UserOut.model_validate(u).model_dump(mode="json") for u in users]

    return {"total": total, "page": page, "size": size, "items": items}


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
) -> Any:
    # Check duplicate username
    stmt_user = select(User).where(User.username == data.username)
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check duplicate email
    stmt_email = select(User).where(User.email == data.email)
    res_email = await db.execute(stmt_email)
    if res_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if not validate_password_strength(data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters, contain uppercase, lowercase, digit, and special character.",
        )

    # Find requested roles
    stmt_roles = select(Role).where(Role.name.in_(data.role_names))
    res_roles = await db.execute(stmt_roles)
    assigned_roles = res_roles.scalars().all()

    new_user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        roles=assigned_roles,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="USER_CREATE",
        entity_type="USER",
        entity_id=new_user.id,
        details={"username": new_user.username, "roles": [r.name for r in assigned_roles]},
    )

    return new_user


@router.get("/{user_id}", response_model=UserOut)
async def get_user_by_id(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
) -> Any:
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
) -> Any:
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.first_name is not None:
        user.first_name = data.first_name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.email is not None:
        # Check duplicate
        stmt_e = select(User).where(User.email == data.email, User.id != user_id)
        res_e = await db.execute(stmt_e)
        if res_e.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already taken")
        user.email = data.email
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role_names is not None:
        stmt_r = select(Role).where(Role.name.in_(data.role_names))
        res_r = await db.execute(stmt_r)
        user.roles = res_r.scalars().all()

    await db.commit()
    await db.refresh(user)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="USER_UPDATE",
        entity_type="USER",
        entity_id=user.id,
    )

    return user
