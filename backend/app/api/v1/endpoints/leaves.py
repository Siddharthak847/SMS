from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import LeaveApplication, User
from app.schemas.domain import LeaveApplicationCreate, LeaveApplicationOut, LeaveApplicationReview

router = APIRouter()


@router.get("/", response_model=List[LeaveApplicationOut])
async def list_leave_applications(
    status_filter: Optional[str] = Query(None),
    applicant_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(LeaveApplication).order_by(LeaveApplication.created_at.desc())

    user_roles = [r.name for r in current_user.roles]
    if "Super Admin" not in user_roles and "School Admin" not in user_roles and "Principal" not in user_roles:
        stmt = stmt.where(LeaveApplication.applicant_user_id == current_user.id)

    if status_filter:
        stmt = stmt.where(LeaveApplication.status == status_filter)

    if applicant_type:
        stmt = stmt.where(LeaveApplication.applicant_type == applicant_type.upper())

    apps = (await db.execute(stmt)).scalars().all()
    res = []
    for a in apps:
        a_dict = LeaveApplicationOut.model_validate(a).model_dump(mode="json")
        user = (await db.execute(select(User).where(User.id == a.applicant_user_id))).scalar_one_or_none()
        a_dict["applicant_name"] = f"{user.first_name} {user.last_name}" if user else "Unknown Applicant"
        res.append(a_dict)
    return res


@router.post("/", response_model=LeaveApplicationOut, status_code=status.HTTP_201_CREATED)
async def submit_leave_application(
    data: LeaveApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if data.end_date < data.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    user_roles = [r.name for r in current_user.roles]
    default_app_type = "TEACHER" if "Teacher" in user_roles else "STUDENT"
    app_type = data.applicant_type.upper() if data.applicant_type else default_app_type

    app = LeaveApplication(
        applicant_user_id=current_user.id,
        applicant_type=app_type,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        reason=data.reason,
        status="PENDING",
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    a_dict = LeaveApplicationOut.model_validate(app).model_dump(mode="json")
    a_dict["applicant_name"] = f"{current_user.first_name} {current_user.last_name}"
    return a_dict


@router.patch("/{leave_id}/review", response_model=LeaveApplicationOut)
async def review_leave_application(
    leave_id: str,
    data: LeaveApplicationReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    leave = (await db.execute(select(LeaveApplication).where(LeaveApplication.id == leave_id))).scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave application not found")

    if data.status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")

    leave.status = data.status
    leave.reviewed_by_id = current_user.id
    if data.rejection_reason:
        leave.rejection_reason = data.rejection_reason

    await db.commit()
    await db.refresh(leave)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="LEAVE_APPLICATION_REVIEW",
        entity_type="LEAVE_APPLICATION",
        entity_id=leave.id,
        details={"status": leave.status},
    )

    return leave
