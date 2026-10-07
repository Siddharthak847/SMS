from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import ClassSubject, ExamSchedule, Subject, TimetableSlot, User
from app.schemas.domain import ClassSubjectCreate, SubjectCreate, SubjectOut, SubjectUpdate

router = APIRouter()


@router.get("/", response_model=List[SubjectOut])
async def list_subjects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Subject).order_by(Subject.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
async def create_subject(
    data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    if (await db.execute(select(Subject).where(Subject.code == data.code))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject = Subject(
        name=data.name,
        code=data.code,
        subject_type=data.subject_type,
    )
    db.add(subject)
    await db.commit()
    await db.refresh(subject)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="SUBJECT_CREATE",
        entity_type="SUBJECT",
        entity_id=subject.id,
    )

    return subject


@router.put("/{subject_id}", response_model=SubjectOut)
async def update_subject(
    subject_id: str,
    data: SubjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    sub = (await db.execute(select(Subject).where(Subject.id == subject_id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    if data.name is not None:
        sub.name = data.name
    if data.code is not None:
        sub.code = data.code
    if data.subject_type is not None:
        sub.subject_type = data.subject_type

    await db.commit()
    await db.refresh(sub)
    return sub


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    sub = (await db.execute(select(Subject).where(Subject.id == subject_id))).scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    await db.execute(delete(ClassSubject).where(ClassSubject.subject_id == subject_id))
    await db.execute(delete(TimetableSlot).where(TimetableSlot.subject_id == subject_id))
    await db.execute(delete(ExamSchedule).where(ExamSchedule.subject_id == subject_id))

    await db.delete(sub)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/assign-class")
async def assign_subject_to_class(
    data: ClassSubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    stmt = select(ClassSubject).where(
        ClassSubject.class_id == data.class_id, ClassSubject.subject_id == data.subject_id
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subject already assigned to this class")

    cs = ClassSubject(class_id=data.class_id, subject_id=data.subject_id)
    db.add(cs)
    await db.commit()

    return {"detail": "Subject assigned to class successfully"}

