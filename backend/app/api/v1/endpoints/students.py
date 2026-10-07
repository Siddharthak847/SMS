from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.domain import (
    AcademicYear,
    Class,
    Parent,
    Role,
    Section,
    Student,
    StudentEnrollment,
    StudentParent,
    StudentStatusEnum,
    User,
)
from app.schemas.domain import PaginatedResponse, StudentCreate, StudentOut, StudentUpdate

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_students(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    section_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    user_roles = [r.name for r in current_user.roles]

    # Base query
    stmt = select(Student)

    # Permission restrictions
    if "Student" in user_roles and not current_user.is_superuser:
        stmt = stmt.where(Student.user_id == current_user.id)
    elif "Parent/Guardian" in user_roles and not current_user.is_superuser:
        # Get linked children
        parent_stmt = select(Parent).where(Parent.user_id == current_user.id)
        parent_res = await db.execute(parent_stmt)
        parent = parent_res.scalar_one_or_none()
        if not parent:
            return {"total": 0, "page": page, "size": size, "items": []}
        stmt = stmt.join(StudentParent).where(StudentParent.parent_id == parent.id)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (Student.first_name.ilike(pattern))
            | (Student.last_name.ilike(pattern))
            | (Student.student_id_number.ilike(pattern))
            | (Student.admission_number.ilike(pattern))
        )

    if status_filter:
        stmt = stmt.where(Student.status == status_filter)

    if section_id:
        stmt = stmt.join(StudentEnrollment).where(StudentEnrollment.section_id == section_id)

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Paginate
    stmt = stmt.offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)
    students = result.scalars().all()

    items = []
    for s in students:
        s_dict = StudentOut.model_validate(s).model_dump(mode="json")
        enr_stmt = (
            select(StudentEnrollment, Section, Class)
            .join(Section, StudentEnrollment.section_id == Section.id)
            .join(Class, Section.class_id == Class.id)
            .where(StudentEnrollment.student_id == s.id)
            .order_by(StudentEnrollment.date_enrolled.desc())
        )
        enr_res = (await db.execute(enr_stmt)).first()
        if enr_res:
            _, sec, cls = enr_res
            s_dict["section_id"] = sec.id
            s_dict["section_name"] = sec.name
            s_dict["class_name"] = cls.name
        items.append(s_dict)

    return {"total": total, "page": page, "size": size, "items": items}


@router.post("/", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("student:create")),
) -> Any:
    # Check student_id_number unique
    s_stmt = select(Student).where(Student.student_id_number == data.student_id_number)
    if (await db.execute(s_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student ID number already exists")

    # Check admission_number unique
    a_stmt = select(Student).where(Student.admission_number == data.admission_number)
    if (await db.execute(a_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Admission number already exists")

    # Check section exists
    sec_stmt = select(Section).where(Section.id == data.section_id)
    section = (await db.execute(sec_stmt)).scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    # Get Student Role
    r_stmt = select(Role).where(Role.name == "Student")
    student_role = (await db.execute(r_stmt)).scalar_one_or_none()

    # Create User account
    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        roles=[student_role] if student_role else [],
    )
    db.add(user)
    await db.flush()

    # Create Student profile
    student = Student(
        user_id=user.id,
        student_id_number=data.student_id_number,
        admission_number=data.admission_number,
        first_name=data.first_name,
        last_name=data.last_name,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        address=data.address,
        contact_number=data.contact_number,
        status=StudentStatusEnum.ACTIVE.value,
    )
    db.add(student)
    await db.flush()

    # Create Student Enrollment
    enrollment = StudentEnrollment(
        student_id=student.id,
        section_id=data.section_id,
        academic_year_id=data.academic_year_id,
        status="ACTIVE",
    )
    db.add(enrollment)

    if data.parent_id:
        link = StudentParent(
            student_id=student.id,
            parent_id=data.parent_id,
            relationship_type="GUARDIAN",
            is_primary_contact=True,
        )
        db.add(link)

    await db.commit()
    await db.refresh(student)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="STUDENT_CREATE",
        entity_type="STUDENT",
        entity_id=student.id,
        details={"student_id_number": student.student_id_number, "admission_number": student.admission_number},
    )

    return student


@router.get("/{student_id}", response_model=StudentOut)
async def get_student_by_id(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Student).where(Student.id == student_id)
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user_roles = [r.name for r in current_user.roles]
    if "Student" in user_roles and not current_user.is_superuser:
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: Cannot view another student's record")

    if "Parent/Guardian" in user_roles and not current_user.is_superuser:
        parent_stmt = select(Parent).where(Parent.user_id == current_user.id)
        parent = (await db.execute(parent_stmt)).scalar_one_or_none()
        if parent:
            sp_stmt = select(StudentParent).where(
                StudentParent.student_id == student.id, StudentParent.parent_id == parent.id
            )
            sp = (await db.execute(sp_stmt)).scalar_one_or_none()
            if not sp:
                raise HTTPException(status_code=403, detail="Access denied: Student is not linked to your parent account")

    return student


@router.get("/{student_id}/profile")
async def get_student_profile_tabs(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Student record verification
    student = await get_student_by_id(student_id=student_id, db=db, current_user=current_user)

    # Fetch active enrollment
    enr_stmt = (
        select(StudentEnrollment)
        .where(StudentEnrollment.student_id == student.id)
        .order_by(StudentEnrollment.date_enrolled.desc())
    )
    enr_res = await db.execute(enr_stmt)
    enrollment = enr_res.scalars().first()

    section_info = None
    if enrollment:
        sec_stmt = select(Section).where(Section.id == enrollment.section_id)
        sec = (await db.execute(sec_stmt)).scalar_one_or_none()
        if sec:
            section_info = {"id": sec.id, "name": sec.name, "class_id": sec.class_id}

    return {
        "overview": {
            "student_id": student.id,
            "student_id_number": student.student_id_number,
            "admission_number": student.admission_number,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "date_of_birth": student.date_of_birth.isoformat(),
            "gender": student.gender,
            "status": student.status,
            "contact_number": student.contact_number,
            "address": student.address,
            "current_section": section_info,
        },
        "academic": {
            "enrollment_history": [
                {
                    "id": enrollment.id,
                    "section_id": enrollment.section_id,
                    "academic_year_id": enrollment.academic_year_id,
                    "status": enrollment.status,
                    "date_enrolled": enrollment.date_enrolled.isoformat(),
                }
            ]
            if enrollment
            else []
        },
        "attendance": {"summary": {"present_days": 0, "absent_days": 0, "percentage": 0.0}, "records": []},
        "exams": {"records": []},
        "fees": {"outstanding": 0.0, "transactions": []},
        "documents": [],
        "leave": [],
    }


@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: str,
    data: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("student:update")),
) -> Any:
    stmt = select(Student).where(Student.id == student_id)
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if data.first_name is not None:
        student.first_name = data.first_name
    if data.last_name is not None:
        student.last_name = data.last_name
    if data.student_id_number is not None:
        student.student_id_number = data.student_id_number
    if data.admission_number is not None:
        student.admission_number = data.admission_number
    if data.date_of_birth is not None:
        student.date_of_birth = data.date_of_birth
    if data.gender is not None:
        student.gender = data.gender
    if data.address is not None:
        student.address = data.address
    if data.contact_number is not None:
        student.contact_number = data.contact_number
    if data.status is not None:
        student.status = data.status

    await db.commit()
    await db.refresh(student)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="STUDENT_UPDATE",
        entity_type="STUDENT",
        entity_id=student.id,
    )

    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("student:delete")),
):
    stmt = select(Student).where(Student.id == student_id)
    student = (await db.execute(stmt)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Delete related StudentEnrollment and StudentParent records
    enr_stmt = select(StudentEnrollment).where(StudentEnrollment.student_id == student_id)
    enrollments = (await db.execute(enr_stmt)).scalars().all()
    for enr in enrollments:
        await db.delete(enr)

    sp_stmt = select(StudentParent).where(StudentParent.student_id == student_id)
    parent_links = (await db.execute(sp_stmt)).scalars().all()
    for sp in parent_links:
        await db.delete(sp)

    await db.delete(student)
    await db.commit()

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="STUDENT_DELETE",
        entity_type="STUDENT",
        entity_id=student_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
