from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_permission
from app.core.database import get_db
from app.models.domain import Section, User
from app.schemas.domain import SectionOut

router = APIRouter()


@router.get("/{section_id}", response_model=SectionOut)
async def get_section_by_id(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    section = (await db.execute(select(Section).where(Section.id == section_id))).scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section
