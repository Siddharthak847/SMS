import random
import string
from datetime import date
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.domain import (
    AcademicYear,
    AdmissionApplication,
    ApplicationStatusEnum,
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
from app.schemas.domain import (
    AdmissionApplicationCreate,
    AdmissionApplicationOut,
    AdmissionApplicationUpdateStatus,
    PaginatedResponse,
    StudentOut,
)

router = APIRouter()


def generate_app_number():
    year = date.today().year
    rand_str = "".join(random.choices(string.digits, k=5))
    return f"APP-{year}-{rand_str}"


def generate_student_id():
    year = date.today().year
    rand_str = "".join(random.choices(string.digits, k=4))
    return f"STU-{year}-{rand_str}"


def generate_admission_number():
    year = date.today().year
    rand_str = "".join(random.choices(string.digits, k=5))
    return f"ADM-{year}-{rand_str}"


@router.get("/", response_model=PaginatedResponse)
async def list_applications(
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(AdmissionApplication)

    if status_filter:
        stmt = stmt.where(AdmissionApplication.status == status_filter)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (AdmissionApplication.first_name.ilike(pattern))
            | (AdmissionApplication.last_name.ilike(pattern))
            | (AdmissionApplication.application_number.ilike(pattern))
            | (AdmissionApplication.parent_email.ilike(pattern))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.offset((page - 1) * size).limit(size).order_by(AdmissionApplication.created_at.desc())
    applications = (await db.execute(stmt)).scalars().all()

    items = [AdmissionApplicationOut.model_validate(a).model_dump(mode="json") for a in applications]
    return {"total": total, "page": page, "size": size, "items": items}


@router.post("/", response_model=AdmissionApplicationOut, status_code=status.HTTP_201_CREATED)
async def submit_admission_application(
    data: AdmissionApplicationCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Verify class & academic year
    if not (await db.execute(select(Class).where(Class.id == data.target_class_id))).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Target class not found")

    if not (await db.execute(select(AcademicYear).where(AcademicYear.id == data.target_academic_year_id))).scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Target academic year not found")

    app_num = generate_app_number()
    # ensure unique
    while (await db.execute(select(AdmissionApplication).where(AdmissionApplication.application_number == app_num))).scalar_one_or_none():
        app_num = generate_app_number()

    app = AdmissionApplication(
        application_number=app_num,
        first_name=data.first_name,
        last_name=data.last_name,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        parent_name=data.parent_name,
        parent_email=data.parent_email,
        parent_phone=data.parent_phone,
        address=data.address,
        target_class_id=data.target_class_id,
        target_academic_year_id=data.target_academic_year_id,
        status=ApplicationStatusEnum.APPLIED.value,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    return app


@router.get("/{id}", response_model=AdmissionApplicationOut)
async def get_application_by_id(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    app = (await db.execute(select(AdmissionApplication).where(AdmissionApplication.id == id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Admission application not found")
    return app


@router.patch("/{id}/status", response_model=AdmissionApplicationOut)
async def update_application_status(
    id: str,
    data: AdmissionApplicationUpdateStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("admission:manage")),
) -> Any:
    app = (await db.execute(select(AdmissionApplication).where(AdmissionApplication.id == id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Admission application not found")

    if app.status == ApplicationStatusEnum.ENROLLED.value:
        raise HTTPException(status_code=400, detail="Cannot change status of already enrolled applicant")

    allowed_statuses = [e.value for e in ApplicationStatusEnum]
    if data.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status value: {data.status}")

    app.status = data.status
    if data.remarks:
        app.remarks = data.remarks

    await db.commit()
    await db.refresh(app)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ADMISSION_STATUS_UPDATE",
        entity_type="ADMISSION_APPLICATION",
        entity_id=app.id,
        details={"new_status": app.status, "application_number": app.application_number},
    )

    return app


@router.post("/{id}/enroll", response_model=StudentOut)
async def enroll_approved_applicant(
    id: str,
    section_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("admission:manage")),
) -> Any:
    app = (await db.execute(select(AdmissionApplication).where(AdmissionApplication.id == id))).scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Admission application not found")

    if app.status != ApplicationStatusEnum.APPROVED.value:
        raise HTTPException(status_code=400, detail="Only APPROVED applications can be enrolled")

    # Check section exists
    section = (await db.execute(select(Section).where(Section.id == section_id))).scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Target section not found")

    # Generate credentials & numbers
    student_id_num = generate_student_id()
    admission_num = generate_admission_number()

    # Get student role
    role = (await db.execute(select(Role).where(Role.name == "Student"))).scalar_one_or_none()

    # Default username/password from application
    username = f"stu_{student_id_num.lower().replace('-', '_')}"
    default_password = f"Student@{date.today().year}!"

    user = User(
        username=username,
        email=app.parent_email,
        password_hash=get_password_hash(default_password),
        first_name=app.first_name,
        last_name=app.last_name,
        roles=[role] if role else [],
    )
    db.add(user)
    await db.flush()

    student = Student(
        user_id=user.id,
        student_id_number=student_id_num,
        admission_number=admission_num,
        first_name=app.first_name,
        last_name=app.last_name,
        date_of_birth=app.date_of_birth,
        gender=app.gender,
        address=app.address,
        contact_number=app.parent_phone,
        status=StudentStatusEnum.ACTIVE.value,
    )
    db.add(student)
    await db.flush()

    enrollment = StudentEnrollment(
        student_id=student.id,
        section_id=section_id,
        academic_year_id=app.target_academic_year_id,
        status="ACTIVE",
    )
    db.add(enrollment)

    # Update app status
    await db.execute(update(AdmissionApplication).where(AdmissionApplication.id == id).values(status=ApplicationStatusEnum.ENROLLED.value))
    await db.commit()
    await db.refresh(student)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ADMISSION_ENROLL_STUDENT",
        entity_type="STUDENT",
        entity_id=student.id,
        details={"application_number": app.application_number, "student_id_number": student.student_id_number},
    )

    return student
