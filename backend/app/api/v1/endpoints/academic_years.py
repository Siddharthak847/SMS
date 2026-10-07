from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import (
    AcademicYear,
    AdmissionApplication,
    Exam,
    FeeStructure,
    StudentEnrollment,
    StudentFeeInvoice,
    User,
)
from app.schemas.domain import AcademicYearCreate, AcademicYearOut, AcademicYearUpdate

router = APIRouter()


@router.get("/", response_model=List[AcademicYearOut])
async def list_academic_years(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(AcademicYear).order_by(AcademicYear.start_date.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/", response_model=AcademicYearOut, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    data: AcademicYearCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    if data.end_date <= data.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    stmt_name = select(AcademicYear).where(AcademicYear.name == data.name)
    if (await db.execute(stmt_name)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Academic year name already exists")

    if data.is_current:
        await db.execute(update(AcademicYear).values(is_current=False))

    ac_year = AcademicYear(
        name=data.name,
        start_date=data.start_date,
        end_date=data.end_date,
        is_current=data.is_current,
    )
    db.add(ac_year)
    await db.commit()
    await db.refresh(ac_year)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="ACADEMIC_YEAR_CREATE",
        entity_type="ACADEMIC_YEAR",
        entity_id=ac_year.id,
    )

    return ac_year


@router.put("/{year_id}", response_model=AcademicYearOut)
async def update_academic_year(
    year_id: str,
    data: AcademicYearUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    year = (await db.execute(select(AcademicYear).where(AcademicYear.id == year_id))).scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    if data.name is not None:
        year.name = data.name
    if data.start_date is not None:
        year.start_date = data.start_date
    if data.end_date is not None:
        year.end_date = data.end_date
    if data.is_current is True:
        await db.execute(update(AcademicYear).values(is_current=False))
        year.is_current = True
    elif data.is_current is False:
        year.is_current = False

    await db.commit()
    await db.refresh(year)
    return year


@router.delete("/{year_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_academic_year(
    year_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    year = (await db.execute(select(AcademicYear).where(AcademicYear.id == year_id))).scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    await db.execute(delete(AdmissionApplication).where(AdmissionApplication.target_academic_year_id == year_id))
    await db.execute(delete(StudentFeeInvoice).where(StudentFeeInvoice.academic_year_id == year_id))
    await db.execute(delete(FeeStructure).where(FeeStructure.academic_year_id == year_id))
    await db.execute(delete(Exam).where(Exam.academic_year_id == year_id))
    await db.execute(delete(StudentEnrollment).where(StudentEnrollment.academic_year_id == year_id))

    await db.delete(year)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{year_id}/activate", response_model=AcademicYearOut)
async def activate_academic_year(
    year_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    stmt = select(AcademicYear).where(AcademicYear.id == year_id)
    year = (await db.execute(stmt)).scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    await db.execute(update(AcademicYear).values(is_current=False))
    year.is_current = True
    await db.commit()
    await db.refresh(year)

    return year

