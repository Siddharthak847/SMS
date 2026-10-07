from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import Exam, ExamMark, ExamSchedule, GradeScale, Student, StudentEnrollment, User
from app.schemas.domain import (
    ExamCreate,
    ExamMarkBulkCreate,
    ExamMarkOut,
    ExamOut,
    ExamScheduleCreate,
    ExamScheduleOut,
    ExamScheduleUpdate,
    ExamUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[ExamOut])
async def list_exams(
    academic_year_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Exam).order_by(Exam.start_date.desc())
    if academic_year_id:
        stmt = stmt.where(Exam.academic_year_id == academic_year_id)
    exams = (await db.execute(stmt)).scalars().all()
    return exams


@router.post("/", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
async def create_exam(
    data: ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    exam = Exam(
        name=data.name,
        exam_type=data.exam_type,
        academic_year_id=data.academic_year_id,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    return exam


@router.put("/{exam_id}", response_model=ExamOut)
async def update_exam(
    exam_id: str,
    data: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(exam, field, val)

    await db.commit()
    await db.refresh(exam)
    return exam


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    exam = (await db.execute(select(Exam).where(Exam.id == exam_id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    await db.delete(exam)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post("/schedules", response_model=ExamScheduleOut, status_code=status.HTTP_201_CREATED)
async def create_exam_schedule(
    data: ExamScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    schedule = ExamSchedule(
        exam_id=data.exam_id,
        class_id=data.class_id,
        subject_id=data.subject_id,
        exam_date=data.exam_date,
        start_time=data.start_time,
        end_time=data.end_time,
        max_marks=data.max_marks,
        passing_marks=data.passing_marks,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return schedule


@router.post("/marks/bulk", response_model=List[ExamMarkOut])
async def enter_bulk_marks(
    data: ExamMarkBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    schedule = (await db.execute(select(ExamSchedule).where(ExamSchedule.id == data.exam_schedule_id))).scalar_one_or_none()
    if not schedule:
        raise HTTPException(status_code=404, detail="Exam schedule not found")

    saved_marks = []
    for mark in data.marks:
        if mark.marks_obtained > schedule.max_marks:
            raise HTTPException(status_code=400, detail=f"Marks obtained ({mark.marks_obtained}) exceeds max marks ({schedule.max_marks})")

        stmt = select(ExamMark).where(ExamMark.exam_schedule_id == data.exam_schedule_id, ExamMark.student_id == mark.student_id)
        existing = (await db.execute(stmt)).scalar_one_or_none()

        if existing:
            existing.marks_obtained = mark.marks_obtained
            existing.is_absent = mark.is_absent
            existing.remarks = mark.remarks
            saved_marks.append(existing)
        else:
            m = ExamMark(
                exam_schedule_id=data.exam_schedule_id,
                student_id=mark.student_id,
                marks_obtained=mark.marks_obtained,
                is_absent=mark.is_absent,
                remarks=mark.remarks,
            )
            db.add(m)
            saved_marks.append(m)

    await db.commit()
    for sm in saved_marks:
        await db.refresh(sm)

    return saved_marks


@router.get("/report-card/{student_id}/exam/{exam_id}")
async def generate_student_report_card(
    student_id: str,
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    student = (await db.execute(select(Student).where(Student.id == student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    exam = (await db.execute(select(Exam).where(Exam.id == exam_id))).scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Fetch marks for all schedules in this exam
    stmt = (
        select(ExamMark, ExamSchedule)
        .join(ExamSchedule, ExamMark.exam_schedule_id == ExamSchedule.id)
        .where(ExamSchedule.exam_id == exam_id, ExamMark.student_id == student_id)
    )
    records = (await db.execute(stmt)).all()

    subject_results = []
    total_obtained = 0
    total_max = 0

    for mark, sch in records:
        perc = (mark.marks_obtained / sch.max_marks) * 100 if sch.max_marks > 0 else 0
        grade = "A+" if perc >= 90 else "A" if perc >= 80 else "B" if perc >= 70 else "C" if perc >= 50 else "F"
        subject_results.append({
            "schedule_id": sch.id,
            "subject_id": sch.subject_id,
            "marks_obtained": mark.marks_obtained,
            "max_marks": sch.max_marks,
            "passing_marks": sch.passing_marks,
            "percentage": round(perc, 2),
            "grade": grade,
            "is_absent": mark.is_absent,
            "status": "FAIL" if (mark.marks_obtained < sch.passing_marks or mark.is_absent) else "PASS",
        })
        if not mark.is_absent:
            total_obtained += mark.marks_obtained
            total_max += sch.max_marks

    overall_perc = round((total_obtained / total_max) * 100, 2) if total_max > 0 else 0
    overall_grade = "A+" if overall_perc >= 90 else "A" if overall_perc >= 80 else "B" if overall_perc >= 70 else "C" if overall_perc >= 50 else "F"

    return {
        "student": f"{student.first_name} {student.last_name}",
        "student_id_number": student.student_id_number,
        "exam_name": exam.name,
        "total_obtained": total_obtained,
        "total_max": total_max,
        "overall_percentage": overall_perc,
        "overall_grade": overall_grade,
        "subject_results": subject_results,
    }
