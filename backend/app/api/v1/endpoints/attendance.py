from datetime import date
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import Attendance, AttendanceStatusEnum, Section, Student, StudentEnrollment, Teacher, TeacherAttendance, User
from app.schemas.domain import AttendanceBulkCreate, AttendanceOut

router = APIRouter()


@router.post("/bulk", response_model=List[AttendanceOut], status_code=status.HTTP_201_CREATED)
async def mark_bulk_attendance(
    data: AttendanceBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    # Check section exists
    section = (await db.execute(select(Section).where(Section.id == data.section_id))).scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    saved_records = []
    for entry in data.entries:
        # Check existing
        stmt = select(Attendance).where(Attendance.student_id == entry.student_id, Attendance.date == data.date)
        existing = (await db.execute(stmt)).scalar_one_or_none()

        if existing:
            if existing.is_locked and not current_user.is_superuser:
                raise HTTPException(status_code=400, detail="Attendance records for this date are locked")
            existing.status = entry.status
            existing.reason = entry.reason
            existing.marked_by_id = current_user.id
            saved_records.append(existing)
        else:
            rec = Attendance(
                student_id=entry.student_id,
                section_id=data.section_id,
                date=data.date,
                status=entry.status,
                reason=entry.reason,
                marked_by_id=current_user.id,
                is_locked=False,
            )
            db.add(rec)
            saved_records.append(rec)

    await db.commit()
    for r in saved_records:
        await db.refresh(r)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ATTENDANCE_MARK_BULK",
        entity_type="ATTENDANCE",
        entity_id=data.section_id,
        details={"date": str(data.date), "count": len(saved_records)},
    )

    return saved_records


@router.get("/section/{section_id}", response_model=List[AttendanceOut])
async def get_section_attendance(
    section_id: str,
    att_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Attendance).where(Attendance.section_id == section_id, Attendance.date == att_date)
    records = (await db.execute(stmt)).scalars().all()
    return records


@router.get("/student/{student_id}/summary")
async def get_student_attendance_summary(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Attendance.status, func.count(Attendance.id)).where(Attendance.student_id == student_id).group_by(Attendance.status)
    res = await db.execute(stmt)
    counts = dict(res.all())

    total_days = sum(counts.values())
    present_days = counts.get(AttendanceStatusEnum.PRESENT.value, 0) + counts.get(AttendanceStatusEnum.HALF_DAY.value, 0) * 0.5
    percentage = round((present_days / total_days) * 100, 2) if total_days > 0 else 100.0

    return {
        "student_id": student_id,
        "total_days": total_days,
        "present_days": counts.get(AttendanceStatusEnum.PRESENT.value, 0),
        "absent_days": counts.get(AttendanceStatusEnum.ABSENT.value, 0),
        "late_days": counts.get(AttendanceStatusEnum.LATE.value, 0),
        "half_days": counts.get(AttendanceStatusEnum.HALF_DAY.value, 0),
        "excused_days": counts.get(AttendanceStatusEnum.EXCUSED.value, 0),
        "attendance_percentage": percentage,
        "low_attendance_warning": percentage < 75.0,
    }
