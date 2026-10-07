from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.domain import (
    AdmissionApplication,
    Attendance,
    Class,
    FeePayment,
    LeaveApplication,
    Student,
    StudentFeeInvoice,
    Teacher,
    User,
)

router = APIRouter()


@router.get("/summary")
async def get_reports_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Student summary
    total_students = (await db.execute(select(func.count(Student.id)))).scalar() or 0
    active_students = (await db.execute(select(func.count(Student.id)).where(Student.status == "ACTIVE"))).scalar() or 0

    # Teacher summary
    total_teachers = (await db.execute(select(func.count(Teacher.id)))).scalar() or 0

    # Admissions summary
    total_admissions = (await db.execute(select(func.count(AdmissionApplication.id)))).scalar() or 0

    # Financial summary
    invoices = (await db.execute(select(StudentFeeInvoice))).scalars().all()
    total_billed = sum(i.total_amount - i.discount_amount for i in invoices)
    total_collected = sum(i.paid_amount for i in invoices)
    total_pending = total_billed - total_collected

    # Leave summary
    pending_leaves = (await db.execute(select(func.count(LeaveApplication.id)).where(LeaveApplication.status == "PENDING"))).scalar() or 0

    return {
        "students": {
            "total": total_students,
            "active": active_students,
        },
        "teachers": {
            "total": total_teachers,
        },
        "admissions": {
            "total": total_admissions,
        },
        "financials": {
            "total_billed": total_billed,
            "total_collected": total_collected,
            "total_pending": max(0.0, total_pending),
        },
        "leaves": {
            "pending": pending_leaves,
        },
    }
