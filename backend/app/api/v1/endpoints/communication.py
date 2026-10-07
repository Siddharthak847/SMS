from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import Announcement, User
from app.schemas.domain import AnnouncementCreate, AnnouncementOut, AnnouncementUpdate

router = APIRouter()


@router.get("/", response_model=List[AnnouncementOut])
async def list_announcements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Announcement).order_by(Announcement.created_at.desc())
    announcements = (await db.execute(stmt)).scalars().all()
    return announcements


@router.post("/", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    ann = Announcement(
        title=data.title,
        content=data.content,
        target_role=data.target_role,
        class_id=data.class_id,
        created_by_id=current_user.id,
        is_important=data.is_important,
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ANNOUNCEMENT_CREATE",
        entity_type="ANNOUNCEMENT",
        entity_id=ann.id,
    )

    return ann


@router.put("/{announcement_id}", response_model=AnnouncementOut)
async def update_announcement(
    announcement_id: str,
    data: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    ann = (await db.execute(select(Announcement).where(Announcement.id == announcement_id))).scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    if data.title is not None:
        ann.title = data.title
    if data.content is not None:
        ann.content = data.content
    if data.target_role is not None:
        ann.target_role = data.target_role
    if data.class_id is not None:
        ann.class_id = data.class_id
    if data.is_important is not None:
        ann.is_important = data.is_important

    await db.commit()
    await db.refresh(ann)
    return ann


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    announcement_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    ann = (await db.execute(select(Announcement).where(Announcement.id == announcement_id))).scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    await db.delete(ann)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

