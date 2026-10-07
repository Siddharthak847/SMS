import random
import string
from datetime import date, datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, log_audit_action, require_permission
from app.core.database import get_db
from app.models.domain import (
    Class,
    FeeCategory,
    FeePayment,
    FeeStructure,
    Section,
    Student,
    StudentEnrollment,
    StudentFeeInvoice,
    User,
)
from app.schemas.domain import (
    FeeCategoryCreate,
    FeeCategoryOut,
    FeeCategoryUpdate,
    FeePaymentCreate,
    FeePaymentOut,
    FeeStructureCreate,
    FeeStructureOut,
    FeeStructureUpdate,
    StudentFeeInvoiceOut,
    StudentFeeInvoiceUpdate,
)

router = APIRouter()


def generate_payment_number():
    year = date.today().year
    rand_str = "".join(random.choices(string.digits, k=5))
    return f"PAY-{year}-{rand_str}"


def generate_invoice_number():
    year = date.today().year
    rand_str = "".join(random.choices(string.digits, k=5))
    return f"INV-{year}-{rand_str}"


@router.get("/categories", response_model=List[FeeCategoryOut])
async def list_fee_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(FeeCategory).order_by(FeeCategory.name.asc())
    cats = (await db.execute(stmt)).scalars().all()
    return cats


@router.post("/categories", response_model=FeeCategoryOut, status_code=status.HTTP_201_CREATED)
async def create_fee_category(
    data: FeeCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    if (await db.execute(select(FeeCategory).where(FeeCategory.name == data.name))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Fee category name already exists")

    cat = FeeCategory(name=data.name, description=data.description)
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.get("/structures", response_model=List[FeeStructureOut])
async def list_fee_structures(
    class_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(FeeStructure)
    if class_id:
        stmt = stmt.where(FeeStructure.class_id == class_id)
    if academic_year_id:
        stmt = stmt.where(FeeStructure.academic_year_id == academic_year_id)
    structures = (await db.execute(stmt)).scalars().all()
    return structures


@router.post("/structures", response_model=FeeStructureOut, status_code=status.HTTP_201_CREATED)
async def create_fee_structure(
    data: FeeStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    struct = FeeStructure(
        academic_year_id=data.academic_year_id,
        class_id=data.class_id,
        fee_category_id=data.fee_category_id,
        amount=data.amount,
        due_date=data.due_date,
    )
    db.add(struct)
    await db.commit()
    await db.refresh(struct)

    # Auto-generate fee invoices for enrolled students in this class
    enrollment_stmt = (
        select(StudentEnrollment)
        .join(Section, StudentEnrollment.section_id == Section.id)
        .where(Section.class_id == data.class_id, StudentEnrollment.academic_year_id == data.academic_year_id)
    )
    enrollments = (await db.execute(enrollment_stmt)).scalars().all()

    for enr in enrollments:
        inv_num = generate_invoice_number()
        inv = StudentFeeInvoice(
            invoice_number=inv_num,
            student_id=enr.student_id,
            academic_year_id=data.academic_year_id,
            fee_structure_id=struct.id,
            total_amount=data.amount,
            discount_amount=0,
            paid_amount=0,
            due_date=data.due_date,
            status="UNPAID",
        )
        db.add(inv)

    await db.commit()
    return struct


@router.get("/invoices", response_model=List[StudentFeeInvoiceOut])
async def list_invoices(
    student_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    stmt = select(StudentFeeInvoice)
    if student_id:
        stmt = stmt.where(StudentFeeInvoice.student_id == student_id)
    if status_filter:
        stmt = stmt.where(StudentFeeInvoice.status == status_filter)
    invoices = (await db.execute(stmt)).scalars().all()
    return invoices


@router.post("/payments", response_model=FeePaymentOut, status_code=status.HTTP_201_CREATED)
async def process_fee_payment(
    data: FeePaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    invoice = (await db.execute(select(StudentFeeInvoice).where(StudentFeeInvoice.id == data.invoice_id))).scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    outstanding = (invoice.total_amount - invoice.discount_amount) - invoice.paid_amount
    if data.amount_paid > outstanding:
        raise HTTPException(status_code=400, detail=f"Amount paid (${data.amount_paid}) exceeds outstanding balance (${outstanding})")

    pay_num = generate_payment_number()
    payment = FeePayment(
        invoice_id=data.invoice_id,
        payment_number=pay_num,
        amount_paid=data.amount_paid,
        payment_method=data.payment_method,
        transaction_reference=data.transaction_reference,
        received_by_id=current_user.id,
    )
    db.add(payment)

    # Update invoice status
    invoice.paid_amount += data.amount_paid
    net_payable = invoice.total_amount - invoice.discount_amount
    if invoice.paid_amount >= net_payable:
        invoice.status = "PAID"
    elif invoice.paid_amount > 0:
        invoice.status = "PARTIAL"

    await db.commit()
    await db.refresh(payment)

    await log_audit_action(
        db=db,
        actor_id=current_user.id,
        action="FEE_PAYMENT_PROCESS",
        entity_type="FEE_PAYMENT",
        entity_id=payment.id,
        details={"payment_number": payment.payment_number, "amount": data.amount_paid},
    )

    return payment


@router.put("/categories/{category_id}", response_model=FeeCategoryOut)
async def update_fee_category(
    category_id: str,
    data: FeeCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    cat = (await db.execute(select(FeeCategory).where(FeeCategory.id == category_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Fee category not found")

    if data.name is not None:
        cat.name = data.name
    if data.description is not None:
        cat.description = data.description

    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fee_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    cat = (await db.execute(select(FeeCategory).where(FeeCategory.id == category_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Fee category not found")
    await db.delete(cat)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/structures/{structure_id}", response_model=FeeStructureOut)
async def update_fee_structure(
    structure_id: str,
    data: FeeStructureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    struct = (await db.execute(select(FeeStructure).where(FeeStructure.id == structure_id))).scalar_one_or_none()
    if not struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")

    if data.academic_year_id is not None:
        struct.academic_year_id = data.academic_year_id
    if data.class_id is not None:
        struct.class_id = data.class_id
    if data.fee_category_id is not None:
        struct.fee_category_id = data.fee_category_id
    if data.amount is not None:
        struct.amount = data.amount
    if data.due_date is not None:
        struct.due_date = data.due_date

    await db.commit()
    await db.refresh(struct)
    return struct


@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fee_structure(
    structure_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    struct = (await db.execute(select(FeeStructure).where(FeeStructure.id == structure_id))).scalar_one_or_none()
    if not struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    await db.delete(struct)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/invoices/{invoice_id}", response_model=StudentFeeInvoiceOut)
async def update_fee_invoice(
    invoice_id: str,
    data: StudentFeeInvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
) -> Any:
    inv = (await db.execute(select(StudentFeeInvoice).where(StudentFeeInvoice.id == invoice_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Fee invoice not found")

    if data.total_amount is not None:
        inv.total_amount = data.total_amount
    if data.discount_amount is not None:
        inv.discount_amount = data.discount_amount
    if data.paid_amount is not None:
        inv.paid_amount = data.paid_amount
    if data.due_date is not None:
        inv.due_date = data.due_date
    if data.status is not None:
        inv.status = data.status

    await db.commit()
    await db.refresh(inv)
    return inv


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fee_invoice(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("academics:manage")),
):
    inv = (await db.execute(select(StudentFeeInvoice).where(StudentFeeInvoice.id == invoice_id))).scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Fee invoice not found")
    await db.delete(inv)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

