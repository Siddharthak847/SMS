from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.domain import (
    AdmissionApplication,
    Class,
    Exam,
    Parent,
    Student,
    Teacher,
    User,
)
from app.schemas.domain import GlobalSearchOut, GlobalSearchResultItem

router = APIRouter()


@router.get("/", response_model=GlobalSearchOut)
async def global_search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    results: List[GlobalSearchResultItem] = []
    term = f"%{q.strip()}%"

    # Search Students
    student_stmt = select(Student).where(
        or_(
            Student.first_name.ilike(term),
            Student.last_name.ilike(term),
            Student.student_id_number.ilike(term),
            Student.admission_number.ilike(term),
        )
    ).limit(5)
    students = (await db.execute(student_stmt)).scalars().all()
    for s in students:
        results.append(
            GlobalSearchResultItem(
                id=s.id,
                title=f"{s.first_name} {s.last_name}",
                subtitle=f"ID: {s.student_id_number} • Admission: {s.admission_number}",
                type="STUDENT",
                url=f"/students/{s.id}",
            )
        )

    # Search Teachers
    teacher_stmt = select(Teacher).where(
        or_(
            Teacher.first_name.ilike(term),
            Teacher.last_name.ilike(term),
            Teacher.employee_id.ilike(term),
            Teacher.email.ilike(term),
        )
    ).limit(5)
    teachers = (await db.execute(teacher_stmt)).scalars().all()
    for t in teachers:
        results.append(
            GlobalSearchResultItem(
                id=t.id,
                title=f"{t.first_name} {t.last_name}",
                subtitle=f"Employee ID: {t.employee_id} • Dept: {t.department}",
                type="TEACHER",
                url=f"/teachers",
            )
        )

    # Search Parents
    parent_stmt = select(Parent).where(
        or_(
            Parent.first_name.ilike(term),
            Parent.last_name.ilike(term),
            Parent.email.ilike(term),
            Parent.phone.ilike(term),
        )
    ).limit(5)
    parents = (await db.execute(parent_stmt)).scalars().all()
    for p in parents:
        results.append(
            GlobalSearchResultItem(
                id=p.id,
                title=f"{p.first_name} {p.last_name}",
                subtitle=f"Phone: {p.phone} • Email: {p.email}",
                type="PARENT",
                url=f"/parents",
            )
        )

    # Search Classes
    class_stmt = select(Class).where(Class.name.ilike(term)).limit(5)
    classes = (await db.execute(class_stmt)).scalars().all()
    for c in classes:
        results.append(
            GlobalSearchResultItem(
                id=c.id,
                title=c.name,
                subtitle=f"Class Code: {c.code}",
                type="CLASS",
                url=f"/academics/classes",
            )
        )

    # Search Admissions
    admission_stmt = select(AdmissionApplication).where(
        or_(
            AdmissionApplication.first_name.ilike(term),
            AdmissionApplication.last_name.ilike(term),
            AdmissionApplication.application_number.ilike(term),
        )
    ).limit(5)
    admissions = (await db.execute(admission_stmt)).scalars().all()
    for a in admissions:
        results.append(
            GlobalSearchResultItem(
                id=a.id,
                title=f"Application: {a.application_number}",
                subtitle=f"Applicant: {a.first_name} {a.last_name} ({a.status})",
                type="ADMISSION",
                url=f"/admissions",
            )
        )

    # Search Examinations
    exam_stmt = select(Exam).where(Exam.name.ilike(term)).limit(5)
    exams = (await db.execute(exam_stmt)).scalars().all()
    for e in exams:
        results.append(
            GlobalSearchResultItem(
                id=e.id,
                title=e.name,
                subtitle=f"Type: {e.exam_type} ({e.start_date} to {e.end_date})",
                type="EXAM",
                url=f"/examinations",
            )
        )

    return GlobalSearchOut(
        query=q,
        total_results=len(results),
        results=results,
    )
