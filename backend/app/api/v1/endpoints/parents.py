from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.domain import Parent, Role, Student, StudentParent, User
from app.schemas.domain import (
    LinkParentStudentRequest,
    PaginatedResponse,
    ParentCreate,
    ParentOut,
    ParentUpdate,
    StudentOut,
)

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_parents(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(Parent)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (Parent.first_name.ilike(pattern))
            | (Parent.last_name.ilike(pattern))
            | (Parent.email.ilike(pattern))
            | (Parent.phone.ilike(pattern))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.offset((page - 1) * size).limit(size)
    parents = (await db.execute(stmt)).scalars().all()

    items = [ParentOut.model_validate(p).model_dump(mode="json") for p in parents]
    return {"total": total, "page": page, "size": size, "items": items}


@router.post("/", response_model=ParentOut, status_code=status.HTTP_201_CREATED)
async def create_parent(
    data: ParentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("parent:manage")),
) -> Any:
    role = (await db.execute(select(Role).where(Role.name == "Parent/Guardian"))).scalar_one_or_none()

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

    parent = Parent(
        user_id=user.id,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=data.email,
        occupation=data.occupation,
        address=data.address,
    )
    db.add(parent)
    await db.commit()
    await db.refresh(parent)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="PARENT_CREATE",
        entity_type="PARENT",
        entity_id=parent.id,
    )

    return parent


@router.post("/link-student")
async def link_parent_to_student(
    data: LinkParentStudentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("parent:manage")),
) -> Any:
    # Check parent exists
    parent = (await db.execute(select(Parent).where(Parent.id == data.parent_id))).scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Check student exists
    student = (await db.execute(select(Student).where(Student.id == data.student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if duplicate relationship
    existing = (
        await db.execute(
            select(StudentParent).where(
                StudentParent.student_id == data.student_id, StudentParent.parent_id == data.parent_id
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already linked to this parent")

    link = StudentParent(
        student_id=data.student_id,
        parent_id=data.parent_id,
        relationship_type=data.relationship_type,
        is_primary_contact=data.is_primary_contact,
    )
    db.add(link)
    await db.commit()

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="PARENT_LINK_STUDENT",
        entity_type="STUDENT_PARENT",
        entity_id=link.id,
        details={"parent_id": data.parent_id, "student_id": data.student_id},
    )

    return {"detail": "Student successfully linked to parent"}


@router.get("/{parent_id}/children", response_model=List[StudentOut])
async def get_parent_children(
    parent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    parent = (await db.execute(select(Parent).where(Parent.id == parent_id))).scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Authorization check
    user_roles = [r.name for r in current_user.roles]
    if "Parent/Guardian" in user_roles and not current_user.is_superuser:
        if parent.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: Cannot view another parent's children")

    stmt = select(Student).join(StudentParent).where(StudentParent.parent_id == parent_id)
    students = (await db.execute(stmt)).scalars().all()
    return students


@router.put("/{parent_id}", response_model=ParentOut)
async def update_parent(
    parent_id: str,
    data: ParentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("parent:manage")),
) -> Any:
    parent = (await db.execute(select(Parent).where(Parent.id == parent_id))).scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(parent, field, val)

    await db.commit()
    await db.refresh(parent)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="PARENT_UPDATE",
        entity_type="PARENT",
        entity_id=parent.id,
    )

    return parent


@router.delete("/{parent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_parent(
    parent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("parent:manage")),
):
    parent = (await db.execute(select(Parent).where(Parent.id == parent_id))).scalar_one_or_none()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")

    sp_stmt = select(StudentParent).where(StudentParent.parent_id == parent_id)
    links = (await db.execute(sp_stmt)).scalars().all()
    for l in links:
        await db.delete(l)

    await db.delete(parent)
    await db.commit()

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="PARENT_DELETE",
        entity_type="PARENT",
        entity_id=parent_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

