from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import Section, Subject, Teacher, TimetableSlot, User
from app.schemas.domain import TimetableSlotCreate, TimetableSlotOut, TimetableSlotUpdate

router = APIRouter()


@router.get("/section/{section_id}", response_model=List[TimetableSlotOut])
async def get_section_timetable(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(TimetableSlot).where(TimetableSlot.section_id == section_id).order_by(TimetableSlot.period_number.asc())
    slots = (await db.execute(stmt)).scalars().all()
    res = []
    for s in slots:
        sub = (await db.execute(select(Subject).where(Subject.id == s.subject_id))).scalar_one_or_none()
        teacher = (await db.execute(select(Teacher).where(Teacher.id == s.teacher_id))).scalar_one_or_none()
        data = TimetableSlotOut.model_validate(s).model_dump()
        data["subject_name"] = sub.name if sub else "Unknown Subject"
        data["teacher_name"] = f"{teacher.first_name} {teacher.last_name}" if teacher else "Unknown Teacher"
        res.append(data)
    return res


@router.get("/teacher/{teacher_id}", response_model=List[TimetableSlotOut])
async def get_teacher_timetable(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(TimetableSlot).where(TimetableSlot.teacher_id == teacher_id).order_by(TimetableSlot.period_number.asc())
    slots = (await db.execute(stmt)).scalars().all()
    res = []
    for s in slots:
        sub = (await db.execute(select(Subject).where(Subject.id == s.subject_id))).scalar_one_or_none()
        teacher = (await db.execute(select(Teacher).where(Teacher.id == s.teacher_id))).scalar_one_or_none()
        data = TimetableSlotOut.model_validate(s).model_dump()
        data["subject_name"] = sub.name if sub else "Unknown Subject"
        data["teacher_name"] = f"{teacher.first_name} {teacher.last_name}" if teacher else "Unknown Teacher"
        res.append(data)
    return res


@router.post("/slots", response_model=TimetableSlotOut, status_code=status.HTTP_201_CREATED)
async def create_timetable_slot(
    data: TimetableSlotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    # 1. Check section clash
    sec_clash = (
        await db.execute(
            select(TimetableSlot).where(
                TimetableSlot.section_id == data.section_id,
                TimetableSlot.day_of_week == data.day_of_week,
                TimetableSlot.period_number == data.period_number,
            )
        )
    ).scalar_one_or_none()
    if sec_clash:
        raise HTTPException(status_code=400, detail="Section already has a class scheduled for this period")

    # 2. Check teacher clash (clash validation rule)
    t_clash = (
        await db.execute(
            select(TimetableSlot).where(
                TimetableSlot.teacher_id == data.teacher_id,
                TimetableSlot.day_of_week == data.day_of_week,
                TimetableSlot.period_number == data.period_number,
            )
        )
    ).scalar_one_or_none()
    if t_clash:
        raise HTTPException(status_code=400, detail="Teacher is already booked for another section during this period")

    slot = TimetableSlot(
        section_id=data.section_id,
        subject_id=data.subject_id,
        teacher_id=data.teacher_id,
        day_of_week=data.day_of_week,
        period_number=data.period_number,
        start_time=data.start_time,
        end_time=data.end_time,
        room_number=data.room_number,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)

    sub = (await db.execute(select(Subject).where(Subject.id == slot.subject_id))).scalar_one_or_none()
    teacher = (await db.execute(select(Teacher).where(Teacher.id == slot.teacher_id))).scalar_one_or_none()
    out = TimetableSlotOut.model_validate(slot).model_dump()
    out["subject_name"] = sub.name if sub else "Unknown Subject"
    out["teacher_name"] = f"{teacher.first_name} {teacher.last_name}" if teacher else "Unknown Teacher"
    return out


@router.put("/slots/{slot_id}", response_model=TimetableSlotOut)
async def update_timetable_slot(
    slot_id: str,
    data: TimetableSlotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    slot = (await db.execute(select(TimetableSlot).where(TimetableSlot.id == slot_id))).scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")

    sec_id = slot.section_id
    sub_id = data.subject_id if data.subject_id is not None else slot.subject_id
    t_id = data.teacher_id if data.teacher_id is not None else slot.teacher_id
    day = data.day_of_week if data.day_of_week is not None else slot.day_of_week
    period = data.period_number if data.period_number is not None else slot.period_number

    # Check section clash excluding self
    sec_clash = (
        await db.execute(
            select(TimetableSlot).where(
                TimetableSlot.section_id == sec_id,
                TimetableSlot.day_of_week == day,
                TimetableSlot.period_number == period,
                TimetableSlot.id != slot_id,
            )
        )
    ).scalar_one_or_none()
    if sec_clash:
        raise HTTPException(status_code=400, detail="Section already has a class scheduled for this period")

    # Check teacher clash excluding self
    t_clash = (
        await db.execute(
            select(TimetableSlot).where(
                TimetableSlot.teacher_id == t_id,
                TimetableSlot.day_of_week == day,
                TimetableSlot.period_number == period,
                TimetableSlot.id != slot_id,
            )
        )
    ).scalar_one_or_none()
    if t_clash:
        raise HTTPException(status_code=400, detail="Teacher is already booked for another section during this period")

    slot.subject_id = sub_id
    slot.teacher_id = t_id
    slot.day_of_week = day
    slot.period_number = period
    if data.start_time is not None:
        slot.start_time = data.start_time
    if data.end_time is not None:
        slot.end_time = data.end_time
    if data.room_number is not None:
        slot.room_number = data.room_number

    await db.commit()
    await db.refresh(slot)

    sub = (await db.execute(select(Subject).where(Subject.id == slot.subject_id))).scalar_one_or_none()
    teacher = (await db.execute(select(Teacher).where(Teacher.id == slot.teacher_id))).scalar_one_or_none()
    out = TimetableSlotOut.model_validate(slot).model_dump()
    out["subject_name"] = sub.name if sub else "Unknown Subject"
    out["teacher_name"] = f"{teacher.first_name} {teacher.last_name}" if teacher else "Unknown Teacher"
    return out


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_slot(
    slot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    slot = (await db.execute(select(TimetableSlot).where(TimetableSlot.id == slot_id))).scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Timetable slot not found")

    await db.delete(slot)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
