from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import Permission, Role, User
from app.schemas.domain import PermissionOut, RoleOut

router = APIRouter()


@router.get("/", response_model=List[RoleOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Role)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/permissions", response_model=List[PermissionOut])
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Permission)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.put("/{role_id}/permissions", response_model=RoleOut)
async def update_role_permissions(
    role_id: str,
    permission_codes: List[str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("roles:manage")),
) -> Any:
    stmt = select(Role).where(Role.id == role_id)
    res = await db.execute(stmt)
    role = res.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    stmt_p = select(Permission).where(Permission.code.in_(permission_codes))
    res_p = await db.execute(stmt_p)
    new_perms = res_p.scalars().all()

    role.permissions = new_perms
    await db.commit()
    await db.refresh(role)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ROLE_PERMISSIONS_UPDATE",
        entity_type="ROLE",
        entity_id=role.id,
        details={"role_name": role.name, "permission_codes": permission_codes},
    )

    return role
