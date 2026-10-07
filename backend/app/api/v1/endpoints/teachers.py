from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.domain import Role, Teacher, User
from app.schemas.domain import PaginatedResponse, TeacherCreate, TeacherOut, TeacherUpdate

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_teachers(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Teacher)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (Teacher.first_name.ilike(pattern))
            | (Teacher.last_name.ilike(pattern))
            | (Teacher.employee_id.ilike(pattern))
            | (Teacher.email.ilike(pattern))
        )

    if department:
        stmt = stmt.where(Teacher.department == department)

    if is_active is not None:
        stmt = stmt.where(Teacher.is_active == is_active)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    stmt = stmt.offset((page - 1) * size).limit(size)
    teachers = (await db.execute(stmt)).scalars().all()

    items = [TeacherOut.model_validate(t).model_dump(mode="json") for t in teachers]
    return {"total": total, "page": page, "size": size, "items": items}


@router.post("/", response_model=TeacherOut, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    data: TeacherCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("teacher:manage")),
) -> Any:
    # Check employee_id
    if (await db.execute(select(Teacher).where(Teacher.employee_id == data.employee_id))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Check email
    if (await db.execute(select(Teacher).where(Teacher.email == data.email))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Teacher email already exists")

    # Fetch Teacher role
    role = (await db.execute(select(Role).where(Role.name == "Teacher"))).scalar_one_or_none()

    # Create User account
    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        roles=[role] if role else [],
    )
    db.add(user)
    await db.flush()

    teacher = Teacher(
        user_id=user.id,
        employee_id=data.employee_id,
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        qualification=data.qualification,
        specialization=data.specialization,
        experience_years=data.experience_years,
        joining_date=data.joining_date,
        department=data.department,
        designation=data.designation,
        is_active=True,
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="TEACHER_CREATE",
        entity_type="TEACHER",
        entity_id=teacher.id,
        details={"employee_id": teacher.employee_id},
    )

    return teacher


@router.get("/{teacher_id}", response_model=TeacherOut)
async def get_teacher_by_id(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


@router.put("/{teacher_id}", response_model=TeacherOut)
async def update_teacher(
    teacher_id: str,
    data: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("teacher:manage")),
) -> Any:
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(teacher, field, val)

    await db.commit()
    await db.refresh(teacher)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="TEACHER_UPDATE",
        entity_type="TEACHER",
        entity_id=teacher.id,
    )

    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("teacher:manage")),
):
    teacher = (await db.execute(select(Teacher).where(Teacher.id == teacher_id))).scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    await db.delete(teacher)
    await db.commit()

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="TEACHER_DELETE",
        entity_type="TEACHER",
        entity_id=teacher_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

