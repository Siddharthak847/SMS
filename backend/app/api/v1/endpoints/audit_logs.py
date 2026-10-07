from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.domain import AuditLog, User
from app.schemas.domain import PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users:manage")),
) -> Any:
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.offset((page - 1) * size).limit(size)
    logs = (await db.execute(stmt)).scalars().all()

    items = [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]

    return {"total": total, "page": page, "size": size, "items": items}
