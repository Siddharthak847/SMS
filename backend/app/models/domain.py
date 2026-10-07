import enum
import uuid
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class GenderEnum(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class ApplicationStatusEnum(str, enum.Enum):
    APPLIED = "APPLIED"
    VERIFIED = "VERIFIED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ENROLLED = "ENROLLED"


class StudentStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    GRADUATED = "GRADUATED"
    ARCHIVED = "ARCHIVED"


# Association table for User <-> Role
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Role <-> Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    roles: Mapped[List["Role"]] = relationship("Role", secondary=user_roles, back_populates="users", lazy="selectin")
    student: Mapped[Optional["Student"]] = relationship("Student", back_populates="user", uselist=False)
    teacher: Mapped[Optional["Teacher"]] = relationship("Teacher", back_populates="user", uselist=False)
    parent: Mapped[Optional["Parent"]] = relationship("Parent", back_populates="user", uselist=False)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    users: Mapped[List[User]] = relationship("User", secondary=user_roles, back_populates="roles")
    permissions: Mapped[List["Permission"]] = relationship("Permission", secondary=role_permissions, lazy="selectin")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    module: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)

    classes: Mapped[List["Class"]] = relationship("Class", back_populates="academic_year", cascade="all, delete-orphan")


class Class(Base):
    __tablename__ = "classes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[int] = mapped_column(Integer, nullable=False)

    academic_year: Mapped[AcademicYear] = relationship("AcademicYear", back_populates="classes")
    sections: Mapped[List["Section"]] = relationship("Section", back_populates="class_obj", cascade="all, delete-orphan")
    class_subjects: Mapped[List["ClassSubject"]] = relationship("ClassSubject", back_populates="class_obj", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("academic_year_id", "name", name="uix_academic_year_class_name"),)


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=40)
    class_teacher_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)

    class_obj: Mapped[Class] = relationship("Class", back_populates="sections")
    class_teacher: Mapped[Optional["Teacher"]] = relationship("Teacher", foreign_keys=[class_teacher_id])
    enrollments: Mapped[List["StudentEnrollment"]] = relationship("StudentEnrollment", back_populates="section")

    __table_args__ = (UniqueConstraint("class_id", "name", name="uix_class_section_name"),)


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    subject_type: Mapped[str] = mapped_column(String(20), default="THEORY")


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)

    class_obj: Mapped[Class] = relationship("Class", back_populates="class_subjects")
    subject: Mapped[Subject] = relationship("Subject")

    __table_args__ = (UniqueConstraint("class_id", "subject_id", name="uix_class_subject"),)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    qualification: Mapped[str] = mapped_column(String(100), nullable=False)
    specialization: Mapped[str] = mapped_column(String(100), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    joining_date: Mapped[date] = mapped_column(Date, nullable=False)
    department: Mapped[str] = mapped_column(String(50), nullable=False)
    designation: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped[User] = relationship("User", back_populates="teacher")
    assignments: Mapped[List["TeacherSubjectAssignment"]] = relationship("TeacherSubjectAssignment", back_populates="teacher")


class TeacherSubjectAssignment(Base):
    __tablename__ = "teacher_subject_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    class_subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("class_subjects.id", ondelete="CASCADE"), nullable=False)

    teacher: Mapped[Teacher] = relationship("Teacher", back_populates="assignments")
    section: Mapped[Section] = relationship("Section")
    class_subject: Mapped[ClassSubject] = relationship("ClassSubject")

    __table_args__ = (UniqueConstraint("teacher_id", "section_id", "class_subject_id", name="uix_teacher_subject_assignment"),)


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    admission_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    photo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=StudentStatusEnum.ACTIVE.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user: Mapped[User] = relationship("User", back_populates="student")
    enrollments: Mapped[List["StudentEnrollment"]] = relationship("StudentEnrollment", back_populates="student", cascade="all, delete-orphan")
    parents: Mapped[List["StudentParent"]] = relationship("StudentParent", back_populates="student", cascade="all, delete-orphan")


class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    occupation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="parent")
    students: Mapped[List["StudentParent"]] = relationship("StudentParent", back_populates="parent", cascade="all, delete-orphan")


class StudentParent(Base):
    __tablename__ = "student_parents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[str] = mapped_column(String(36), ForeignKey("parents.id", ondelete="CASCADE"), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(20), default="FATHER")
    is_primary_contact: Mapped[bool] = mapped_column(Boolean, default=True)

    student: Mapped[Student] = relationship("Student", back_populates="parents")
    parent: Mapped[Parent] = relationship("Parent", back_populates="students")

    __table_args__ = (UniqueConstraint("student_id", "parent_id", name="uix_student_parent"),)


class StudentEnrollment(Base):
    __tablename__ = "student_enrollments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    date_enrolled: Mapped[date] = mapped_column(Date, default=lambda: date.today())

    student: Mapped[Student] = relationship("Student", back_populates="enrollments")
    section: Mapped[Section] = relationship("Section", back_populates="enrollments")
    academic_year: Mapped[AcademicYear] = relationship("AcademicYear")


class AdmissionApplication(Base):
    __tablename__ = "admission_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    application_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    parent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_email: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    target_class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="RESTRICT"), nullable=False)
    target_academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=ApplicationStatusEnum.APPLIED.value)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


# ==========================================
# PHASE 2 DOMAIN MODELS
# ==========================================

class AttendanceStatusEnum(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    HALF_DAY = "HALF_DAY"
    EXCUSED = "EXCUSED"


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=AttendanceStatusEnum.PRESENT.value)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    marked_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    student: Mapped[Student] = relationship("Student")
    section: Mapped[Section] = relationship("Section")
    marked_by: Mapped[User] = relationship("User")

    __table_args__ = (UniqueConstraint("student_id", "date", name="uix_student_date_attendance"),)


class TeacherAttendance(Base):
    __tablename__ = "teacher_attendances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=AttendanceStatusEnum.PRESENT.value)
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    marked_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    teacher: Mapped[Teacher] = relationship("Teacher")
    marked_by: Mapped[User] = relationship("User")

    __table_args__ = (UniqueConstraint("teacher_id", "date", name="uix_teacher_date_attendance"),)


class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id: Mapped[str] = mapped_column(String(36), ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(10), nullable=False)  # MON, TUE, WED, THU, FRI, SAT, SUN
    period_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)  # HH:MM
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)    # HH:MM
    room_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    section: Mapped[Section] = relationship("Section")
    subject: Mapped[Subject] = relationship("Subject")
    teacher: Mapped[Teacher] = relationship("Teacher")

    __table_args__ = (
        UniqueConstraint("section_id", "day_of_week", "period_number", name="uix_section_period_clash"),
        UniqueConstraint("teacher_id", "day_of_week", "period_number", name="uix_teacher_period_clash"),
    )


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    exam_type: Mapped[str] = mapped_column(String(50), default="MIDTERM")  # UNIT_TEST, MIDTERM, FINAL, CUSTOM
    academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)

    academic_year: Mapped[AcademicYear] = relationship("AcademicYear")
    schedules: Mapped[List["ExamSchedule"]] = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    exam_id: Mapped[str] = mapped_column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    max_marks: Mapped[float] = mapped_column(Integer, default=100)
    passing_marks: Mapped[float] = mapped_column(Integer, default=40)

    exam: Mapped[Exam] = relationship("Exam", back_populates="schedules")
    class_obj: Mapped[Class] = relationship("Class")
    subject: Mapped[Subject] = relationship("Subject")
    marks: Mapped[List["ExamMark"]] = relationship("ExamMark", back_populates="exam_schedule", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("exam_id", "class_id", "subject_id", name="uix_exam_class_subject"),)


class GradeScale(Base):
    __tablename__ = "grade_scales"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g. A+, A, B, C, F
    min_score: Mapped[float] = mapped_column(Integer, nullable=False)
    max_score: Mapped[float] = mapped_column(Integer, nullable=False)
    grade_point: Mapped[float] = mapped_column(Integer, default=0)
    remarks: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class ExamMark(Base):
    __tablename__ = "exam_marks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    exam_schedule_id: Mapped[str] = mapped_column(String(36), ForeignKey("exam_schedules.id", ondelete="CASCADE"), nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained: Mapped[float] = mapped_column(Integer, default=0)
    is_absent: Mapped[bool] = mapped_column(Boolean, default=False)
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    exam_schedule: Mapped[ExamSchedule] = relationship("ExamSchedule", back_populates="marks")
    student: Mapped[Student] = relationship("Student")

    __table_args__ = (UniqueConstraint("exam_schedule_id", "student_id", name="uix_schedule_student_mark"),)


class FeeCategory(Base):
    __tablename__ = "fee_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id: Mapped[str] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    fee_category_id: Mapped[str] = mapped_column(String(36), ForeignKey("fee_categories.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[float] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)

    academic_year: Mapped[AcademicYear] = relationship("AcademicYear")
    class_obj: Mapped[Class] = relationship("Class")
    fee_category: Mapped[FeeCategory] = relationship("FeeCategory")

    __table_args__ = (UniqueConstraint("academic_year_id", "class_id", "fee_category_id", name="uix_class_fee_structure"),)


class StudentFeeInvoice(Base):
    __tablename__ = "student_fee_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    academic_year_id: Mapped[str] = mapped_column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    fee_structure_id: Mapped[str] = mapped_column(String(36), ForeignKey("fee_structures.id", ondelete="RESTRICT"), nullable=False)
    total_amount: Mapped[float] = mapped_column(Integer, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Integer, default=0)
    paid_amount: Mapped[float] = mapped_column(Integer, default=0)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="UNPAID")  # UNPAID, PARTIAL, PAID, OVERDUE

    student: Mapped[Student] = relationship("Student")
    fee_structure: Mapped[FeeStructure] = relationship("FeeStructure")
    payments: Mapped[List["FeePayment"]] = relationship("FeePayment", back_populates="invoice", cascade="all, delete-orphan")


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey("student_fee_invoices.id", ondelete="CASCADE"), nullable=False)
    payment_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    amount_paid: Mapped[float] = mapped_column(Integer, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(30), default="CASH")  # CASH, BANK_TRANSFER, ONLINE, CHEQUE
    transaction_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    received_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)

    invoice: Mapped[StudentFeeInvoice] = relationship("StudentFeeInvoice", back_populates="payments")
    received_by: Mapped[User] = relationship("User")


class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    applicant_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    applicant_type: Mapped[str] = mapped_column(String(20), default="STUDENT")  # STUDENT, TEACHER, STAFF
    leave_type: Mapped[str] = mapped_column(String(20), default="SICK")  # SICK, CASUAL, EMERGENCY
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")  # PENDING, APPROVED, REJECTED
    reviewed_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    applicant: Mapped[User] = relationship("User", foreign_keys=[applicant_user_id])
    reviewed_by: Mapped[Optional[User]] = relationship("User", foreign_keys=[reviewed_by_id])


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_role: Mapped[str] = mapped_column(String(50), default="ALL")  # ALL, TEACHER, PARENT, STUDENT
    class_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=True)
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_important: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_by: Mapped[User] = relationship("User")
    class_obj: Mapped[Optional[Class]] = relationship("Class")


class SchoolEvent(Base):
    __tablename__ = "school_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), default="ACADEMIC")  # ACADEMIC, SPORTS, CULTURAL, MEETING, HOLIDAY
    organizer_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    organizer: Mapped[User] = relationship("User")


class CertificateRecord(Base):
    __tablename__ = "certificate_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    certificate_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    certificate_type: Mapped[str] = mapped_column(String(50), nullable=False)  # BONAFIDE, STUDY, CHARACTER, TRANSFER, ACHIEVEMENT
    issue_date: Mapped[date] = mapped_column(Date, default=lambda: date.today())
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    issued_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    student: Mapped[Student] = relationship("Student")
    issued_by: Mapped[User] = relationship("User")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    vehicle_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=40)
    driver_name: Mapped[str] = mapped_column(String(100), nullable=False)
    driver_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # ACTIVE, MAINTENANCE, INACTIVE


class TransportRoute(Base):
    __tablename__ = "transport_routes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    route_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    vehicle_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    start_location: Mapped[str] = mapped_column(String(100), nullable=False)
    end_location: Mapped[str] = mapped_column(String(100), nullable=False)
    fare: Mapped[float] = mapped_column(Integer, default=0)

    vehicle: Mapped[Optional[Vehicle]] = relationship("Vehicle")
    stops: Mapped[List["RouteStop"]] = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False)
    stop_name: Mapped[str] = mapped_column(String(100), nullable=False)
    pickup_time: Mapped[str] = mapped_column(String(10), nullable=False)
    drop_time: Mapped[str] = mapped_column(String(10), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, default=1)

    route: Mapped[TransportRoute] = relationship("TransportRoute", back_populates="stops")


class StudentTransport(Base):
    __tablename__ = "student_transports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    student_id: Mapped[str] = mapped_column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False)
    route_id: Mapped[str] = mapped_column(String(36), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False)
    stop_id: Mapped[str] = mapped_column(String(36), ForeignKey("route_stops.id", ondelete="CASCADE"), nullable=False)
    pickup_point: Mapped[str] = mapped_column(String(100), nullable=False)
    drop_point: Mapped[str] = mapped_column(String(100), nullable=False)

    student: Mapped[Student] = relationship("Student")
    route: Mapped[TransportRoute] = relationship("TransportRoute")
    stop: Mapped[RouteStop] = relationship("RouteStop")



