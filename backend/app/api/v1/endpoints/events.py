from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.domain import SchoolEvent, User
from app.schemas.domain import SchoolEventCreate, SchoolEventOut, SchoolEventUpdate

router = APIRouter()


@router.get("/", response_model=List[SchoolEventOut])
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(SchoolEvent).order_by(SchoolEvent.event_date.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/", response_model=SchoolEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: SchoolEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    event = SchoolEvent(
        title=event_in.title,
        description=event_in.description,
        event_date=event_in.event_date,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location=event_in.location,
        event_type=event_in.event_type,
        organizer_user_id=current_user.id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/{event_id}", response_model=SchoolEventOut)
async def update_event(
    event_id: str,
    event_in: SchoolEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    event = (await db.execute(select(SchoolEvent).where(SchoolEvent.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, val in event_in.model_dump(exclude_unset=True).items():
        setattr(event, field, val)

    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = (await db.execute(select(SchoolEvent).where(SchoolEvent.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

