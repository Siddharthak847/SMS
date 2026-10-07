import uuid
from datetime import date
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.domain import CertificateRecord, Student, User
from app.schemas.domain import CertificateRecordCreate, CertificateRecordOut

router = APIRouter()


@router.get("/", response_model=List[CertificateRecordOut])
async def list_certificates(
    student_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(CertificateRecord)
    if student_id:
        stmt = stmt.where(CertificateRecord.student_id == student_id)
    stmt = stmt.order_by(CertificateRecord.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/generate", response_model=CertificateRecordOut, status_code=status.HTTP_201_CREATED)
async def generate_certificate(
    cert_in: CertificateRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    student = (await db.execute(select(Student).where(Student.id == cert_in.student_id))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    cert_no = f"CERT-{date.today().year}-{uuid.uuid4().hex[:6].upper()}"

    certificate = CertificateRecord(
        certificate_number=cert_no,
        student_id=cert_in.student_id,
        certificate_type=cert_in.certificate_type,
        issue_date=date.today(),
        remarks=cert_in.remarks,
        issued_by_id=current_user.id,
    )
    db.add(certificate)
    await db.commit()
    await db.refresh(certificate)
    return certificate
