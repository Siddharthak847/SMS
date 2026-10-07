from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Auth & User Schemas ---
class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str


class TokenDataSchema(BaseModel):
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class PermissionOut(BaseModel):
    id: str
    code: str
    module: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RoleOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: List[PermissionOut] = []

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    role_names: List[str] = ["Student"]


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_superuser: bool
    roles: List[RoleOut] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Academic Schemas ---
class AcademicYearCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearOut(BaseModel):
    id: str
    name: str
    start_date: date
    end_date: date
    is_current: bool
    is_archived: bool

    model_config = ConfigDict(from_attributes=True)


class ClassCreate(BaseModel):
    academic_year_id: str
    name: str
    code: int


class ClassOut(BaseModel):
    id: str
    academic_year_id: str
    name: str
    code: int

    model_config = ConfigDict(from_attributes=True)


class SectionCreate(BaseModel):
    class_id: str
    name: str
    capacity: int = 40
    class_teacher_id: Optional[str] = None


class SectionOut(BaseModel):
    id: str
    class_id: str
    name: str
    capacity: int
    class_teacher_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    name: str
    code: str
    subject_type: str = "THEORY"


class SubjectOut(BaseModel):
    id: str
    name: str
    code: str
    subject_type: str

    model_config = ConfigDict(from_attributes=True)


class ClassSubjectCreate(BaseModel):
    class_id: str
    subject_id: str


# --- Teacher Schemas ---
class TeacherCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    employee_id: str
    first_name: str
    last_name: str
    phone: str
    address: str
    qualification: str
    specialization: str
    experience_years: int = 0
    joining_date: date
    department: str
    designation: str


class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None


class TeacherOut(BaseModel):
    id: str
    user_id: str
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    qualification: str
    specialization: str
    experience_years: int
    joining_date: date
    department: str
    designation: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# --- Student Schemas ---
class StudentCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    student_id_number: str
    admission_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    address: str
    contact_number: str
    section_id: str
    academic_year_id: str
    parent_id: Optional[str] = None


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    student_id_number: Optional[str] = None
    admission_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None


class StudentOut(BaseModel):
    id: str
    user_id: str
    student_id_number: str
    admission_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    address: str
    contact_number: str
    photo_url: Optional[str] = None
    status: str
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    section_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Parent Schemas ---
class ParentCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    occupation: Optional[str] = None
    address: str


class ParentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    occupation: Optional[str] = None
    address: Optional[str] = None


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    is_archived: Optional[bool] = None


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[int] = None
    academic_year_id: Optional[str] = None


class SectionUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    class_teacher_id: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    subject_type: Optional[str] = None


class FeeCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class FeeStructureUpdate(BaseModel):
    academic_year_id: Optional[str] = None
    class_id: Optional[str] = None
    fee_category_id: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[date] = None


class StudentFeeInvoiceUpdate(BaseModel):
    total_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    due_date: Optional[date] = None
    status: Optional[str] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target_role: Optional[str] = None
    class_id: Optional[str] = None
    is_important: Optional[bool] = None


class SchoolEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = None


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    registration_number: Optional[str] = None
    capacity: Optional[int] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    status: Optional[str] = None


class TransportRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    fare: Optional[float] = None


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_type: Optional[str] = None
    academic_year_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_published: Optional[bool] = None


class ExamScheduleUpdate(BaseModel):
    exam_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    max_marks: Optional[float] = None
    passing_marks: Optional[float] = None



class ParentOut(BaseModel):
    id: str
    user_id: str
    first_name: str
    last_name: str
    phone: str
    email: str
    occupation: Optional[str] = None
    address: str

    model_config = ConfigDict(from_attributes=True)


class LinkParentStudentRequest(BaseModel):
    student_id: str
    parent_id: str
    relationship_type: str = "FATHER"
    is_primary_contact: bool = True


# --- Admission Schemas ---
class AdmissionApplicationCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    parent_name: str
    parent_email: EmailStr
    parent_phone: str
    address: str
    target_class_id: str
    target_academic_year_id: str


class AdmissionApplicationUpdateStatus(BaseModel):
    status: str
    remarks: Optional[str] = None


class AdmissionApplicationOut(BaseModel):
    id: str
    application_number: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    parent_name: str
    parent_email: str
    parent_phone: str
    address: str
    target_class_id: str
    target_academic_year_id: str
    status: str
    remarks: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Stats Schema ---
class DashboardStatsOut(BaseModel):
    total_students: int
    active_students: int
    new_admissions: int
    total_teachers: int
    pending_admissions: int
    class_wise_student_counts: List[dict]


# --- Pagination Helper Schema ---
class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[dict]


# ==========================================
# PHASE 2 SCHEMAS
# ==========================================

class AttendanceEntry(BaseModel):
    student_id: str
    status: str = "PRESENT"  # PRESENT, ABSENT, LATE, HALF_DAY, EXCUSED
    reason: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    section_id: str
    date: date
    entries: List[AttendanceEntry]


class AttendanceOut(BaseModel):
    id: str
    student_id: str
    section_id: str
    date: date
    status: str
    reason: Optional[str] = None
    marked_by_id: str
    is_locked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TimetableSlotCreate(BaseModel):
    section_id: str
    subject_id: str
    teacher_id: str
    day_of_week: str
    period_number: int
    start_time: str
    end_time: str
    room_number: Optional[str] = None


class TimetableSlotUpdate(BaseModel):
    subject_id: Optional[str] = None
    teacher_id: Optional[str] = None
    day_of_week: Optional[str] = None
    period_number: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room_number: Optional[str] = None


class TimetableSlotOut(BaseModel):
    id: str
    section_id: str
    subject_id: str
    teacher_id: str
    day_of_week: str
    period_number: int
    start_time: str
    end_time: str
    room_number: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ExamCreate(BaseModel):
    name: str
    exam_type: str = "MIDTERM"
    academic_year_id: str
    start_date: date
    end_date: date


class ExamOut(BaseModel):
    id: str
    name: str
    exam_type: str
    academic_year_id: str
    start_date: date
    end_date: date
    is_published: bool

    model_config = ConfigDict(from_attributes=True)


class ExamScheduleCreate(BaseModel):
    exam_id: str
    class_id: str
    subject_id: str
    exam_date: date
    start_time: str
    end_time: str
    max_marks: float = 100
    passing_marks: float = 40


class ExamScheduleOut(BaseModel):
    id: str
    exam_id: str
    class_id: str
    subject_id: str
    exam_date: date
    start_time: str
    end_time: str
    max_marks: float
    passing_marks: float

    model_config = ConfigDict(from_attributes=True)


class ExamMarkEntry(BaseModel):
    student_id: str
    marks_obtained: float
    is_absent: bool = False
    remarks: Optional[str] = None


class ExamMarkBulkCreate(BaseModel):
    exam_schedule_id: str
    marks: List[ExamMarkEntry]


class ExamMarkOut(BaseModel):
    id: str
    exam_schedule_id: str
    student_id: str
    marks_obtained: float
    is_absent: bool
    remarks: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FeeCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class FeeCategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FeeStructureCreate(BaseModel):
    academic_year_id: str
    class_id: str
    fee_category_id: str
    amount: float
    due_date: date


class FeeStructureOut(BaseModel):
    id: str
    academic_year_id: str
    class_id: str
    fee_category_id: str
    amount: float
    due_date: date

    model_config = ConfigDict(from_attributes=True)


class StudentFeeInvoiceOut(BaseModel):
    id: str
    invoice_number: str
    student_id: str
    academic_year_id: str
    fee_structure_id: str
    total_amount: float
    discount_amount: float
    paid_amount: float
    due_date: date
    status: str

    model_config = ConfigDict(from_attributes=True)


class FeePaymentCreate(BaseModel):
    invoice_id: str
    amount_paid: float
    payment_method: str = "CASH"
    transaction_reference: Optional[str] = None


class FeePaymentOut(BaseModel):
    id: str
    invoice_id: str
    payment_number: str
    amount_paid: float
    payment_method: str
    transaction_reference: Optional[str] = None
    payment_date: datetime
    received_by_id: str

    model_config = ConfigDict(from_attributes=True)


class LeaveApplicationCreate(BaseModel):
    applicant_type: Optional[str] = "STUDENT"
    leave_type: str = "SICK"
    start_date: date
    end_date: date
    reason: str


class LeaveApplicationReview(BaseModel):
    status: str  # APPROVED, REJECTED
    rejection_reason: Optional[str] = None


class LeaveApplicationOut(BaseModel):
    id: str
    applicant_user_id: str
    applicant_name: Optional[str] = None
    applicant_type: str
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    reviewed_by_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "ALL"
    class_id: Optional[str] = None
    is_important: bool = False


class AnnouncementOut(BaseModel):
    id: str
    title: str
    content: str
    target_role: str
    class_id: Optional[str] = None
    created_by_id: str
    is_important: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchoolEventCreate(BaseModel):
    title: str
    description: str
    event_date: date
    start_time: str
    end_time: str
    location: str
    event_type: str = "ACADEMIC"


class SchoolEventOut(BaseModel):
    id: str
    title: str
    description: str
    event_date: date
    start_time: str
    end_time: str
    location: str
    event_type: str
    organizer_user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CertificateRecordCreate(BaseModel):
    student_id: str
    certificate_type: str  # BONAFIDE, STUDY, CHARACTER, TRANSFER, ACHIEVEMENT
    remarks: Optional[str] = None


class CertificateRecordOut(BaseModel):
    id: str
    certificate_number: str
    student_id: str
    certificate_type: str
    issue_date: date
    remarks: Optional[str] = None
    issued_by_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Transport Schemas ---
class VehicleCreate(BaseModel):
    vehicle_number: str
    registration_number: str
    capacity: int = 40
    driver_name: str
    driver_phone: str
    status: str = "ACTIVE"


class VehicleOut(BaseModel):
    id: str
    vehicle_number: str
    registration_number: str
    capacity: int
    driver_name: str
    driver_phone: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class RouteStopCreate(BaseModel):
    stop_name: str
    pickup_time: str
    drop_time: str
    stop_order: int = 1


class RouteStopOut(BaseModel):
    id: str
    route_id: str
    stop_name: str
    pickup_time: str
    drop_time: str
    stop_order: int

    model_config = ConfigDict(from_attributes=True)


class TransportRouteCreate(BaseModel):
    route_name: str
    vehicle_id: Optional[str] = None
    start_location: str
    end_location: str
    fare: float = 0


class TransportRouteOut(BaseModel):
    id: str
    route_name: str
    vehicle_id: Optional[str] = None
    start_location: str
    end_location: str
    fare: float
    stops: List[RouteStopOut] = []

    model_config = ConfigDict(from_attributes=True)


class StudentTransportCreate(BaseModel):
    student_id: str
    route_id: str
    stop_id: str
    pickup_point: str
    drop_point: str


class StudentTransportOut(BaseModel):
    id: str
    student_id: str
    route_id: str
    stop_id: str
    pickup_point: str
    drop_point: str

    model_config = ConfigDict(from_attributes=True)


# --- Global Search & Analytics Schemas ---
class GlobalSearchResultItem(BaseModel):
    id: str
    title: str
    subtitle: str
    type: str  # STUDENT, TEACHER, PARENT, CLASS, ADMISSION, EXAM, FEE
    url: str


class GlobalSearchOut(BaseModel):
    query: str
    total_results: int
    results: List[GlobalSearchResultItem]


class AnalyticsDataOut(BaseModel):
    enrollment_trends: List[dict]
    attendance_trends: List[dict]
    financial_overview: dict
    grade_distribution: List[dict]



