from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import (
    AdmissionApplication,
    Announcement,
    Attendance,
    Class,
    ClassSubject,
    ExamSchedule,
    FeeStructure,
    Section,
    StudentEnrollment,
    Teacher,
    TeacherSubjectAssignment,
    TimetableSlot,
    User,
)
from app.schemas.domain import ClassCreate, ClassOut, ClassUpdate, SectionCreate, SectionOut, SectionUpdate

router = APIRouter()


@router.get("/", response_model=List[ClassOut])
async def list_classes(
    academic_year_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Class).order_by(Class.code.asc())
    if academic_year_id:
        stmt = stmt.where(Class.academic_year_id == academic_year_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/", response_model=ClassOut, status_code=status.HTTP_201_CREATED)
async def create_class(
    data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    stmt_check = select(Class).where(
        Class.academic_year_id == data.academic_year_id, Class.name == data.name
    )
    if (await db.execute(stmt_check)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Class name already exists in this academic year")

    cls = Class(
        academic_year_id=data.academic_year_id,
        name=data.name,
        code=data.code,
    )
    db.add(cls)
    await db.commit()
    await db.refresh(cls)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="CLASS_CREATE",
        entity_type="CLASS",
        entity_id=cls.id,
    )

    return cls


@router.put("/{class_id}", response_model=ClassOut)
async def update_class(
    class_id: str,
    data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    cls = (await db.execute(select(Class).where(Class.id == class_id))).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    if data.name is not None:
        cls.name = data.name
    if data.code is not None:
        cls.code = data.code
    if data.academic_year_id is not None:
        cls.academic_year_id = data.academic_year_id

    await db.commit()
    await db.refresh(cls)
    return cls


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    cls = (await db.execute(select(Class).where(Class.id == class_id))).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    sec_stmt = select(Section).where(Section.class_id == class_id)
    sections = (await db.execute(sec_stmt)).scalars().all()
    sec_ids = [s.id for s in sections]

    if sec_ids:
        await db.execute(delete(TeacherSubjectAssignment).where(TeacherSubjectAssignment.section_id.in_(sec_ids)))
        await db.execute(delete(TimetableSlot).where(TimetableSlot.section_id.in_(sec_ids)))
        await db.execute(delete(Attendance).where(Attendance.section_id.in_(sec_ids)))
        await db.execute(delete(StudentEnrollment).where(StudentEnrollment.section_id.in_(sec_ids)))
        for s in sections:
            await db.delete(s)

    await db.execute(delete(ClassSubject).where(ClassSubject.class_id == class_id))
    await db.execute(delete(ExamSchedule).where(ExamSchedule.class_id == class_id))
    await db.execute(delete(FeeStructure).where(FeeStructure.class_id == class_id))
    await db.execute(delete(AdmissionApplication).where(AdmissionApplication.target_class_id == class_id))
    await db.execute(delete(Announcement).where(Announcement.class_id == class_id))

    await db.delete(cls)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{class_id}/sections", response_model=List[SectionOut])
async def list_class_sections(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Section).where(Section.class_id == class_id).order_by(Section.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{class_id}/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED)
async def create_section(
    class_id: str,
    data: SectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    cls = (await db.execute(select(Class).where(Class.id == class_id))).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    sec_check = select(Section).where(Section.class_id == class_id, Section.name == data.name)
    if (await db.execute(sec_check)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Section name already exists in this class")

    section = Section(
        class_id=class_id,
        name=data.name,
        capacity=data.capacity,
        class_teacher_id=data.class_teacher_id,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)

    return section


@router.put("/sections/{section_id}", response_model=SectionOut)
async def update_section(
    section_id: str,
    data: SectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    sec = (await db.execute(select(Section).where(Section.id == section_id))).scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")

    if data.name is not None:
        sec.name = data.name
    if data.capacity is not None:
        sec.capacity = data.capacity
    if data.class_teacher_id is not None:
        sec.class_teacher_id = data.class_teacher_id

    await db.commit()
    await db.refresh(sec)
    return sec


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    sec = (await db.execute(select(Section).where(Section.id == section_id))).scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")

    await db.execute(delete(TeacherSubjectAssignment).where(TeacherSubjectAssignment.section_id == section_id))
    await db.execute(delete(TimetableSlot).where(TimetableSlot.section_id == section_id))
    await db.execute(delete(Attendance).where(Attendance.section_id == section_id))
    await db.execute(delete(StudentEnrollment).where(StudentEnrollment.section_id == section_id))

    await db.delete(sec)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

