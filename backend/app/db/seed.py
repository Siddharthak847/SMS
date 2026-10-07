import asyncio
from datetime import date, datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.domain import (
    AcademicYear,
    AdmissionApplication,
    ApplicationStatusEnum,
    Class,
    ClassSubject,
    Parent,
    Permission,
    Role,
    Section,
    Student,
    StudentEnrollment,
    StudentParent,
    StudentStatusEnum,
    Subject,
    Teacher,
    User,
)

DEFAULT_PASSWORD = "Password123!"

ROLES_PERMISSIONS_DATA = {
    "Super Admin": [
        "users:manage", "roles:manage", "student:create", "student:read", "student:update", "student:delete",
        "teacher:manage", "parent:manage", "academics:manage", "admission:manage", "dashboard:view", "audit:read"
    ],
    "Principal": [
        "users:manage", "student:create", "student:read", "student:update",
        "teacher:manage", "parent:manage", "academics:manage", "admission:manage", "dashboard:view"
    ],
    "School Admin": [
        "student:create", "student:read", "student:update",
        "teacher:manage", "parent:manage", "academics:manage", "admission:manage", "dashboard:view"
    ],
    "Teacher": [
        "student:read", "dashboard:view"
    ],
    "Student": [
        "student:read", "dashboard:view"
    ],
    "Parent/Guardian": [
        "student:read", "dashboard:view"
    ],
    "Accountant": [
        "student:read", "dashboard:view"
    ],
    "Transport Manager": [
        "student:read", "dashboard:view"
    ]
}


async def seed_database():
    from app.core.database import async_engine, Base
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:

        # Check if already seeded
        check_user = await db.execute(select(User).where(User.username == "admin"))
        if check_user.scalar_one_or_none():
            return

        # 1. Create Permissions
        all_perm_codes = set()
        for perms in ROLES_PERMISSIONS_DATA.values():
            all_perm_codes.update(perms)

        perm_objects = {}
        for code in all_perm_codes:
            module = code.split(":")[0]
            p = Permission(code=code, module=module, description=f"Permission for {code}")
            db.add(p)
            perm_objects[code] = p

        await db.flush()

        # 2. Create Roles
        role_objects = {}
        for r_name, p_codes in ROLES_PERMISSIONS_DATA.items():
            r = Role(
                name=r_name,
                description=f"Standard {r_name} role",
                permissions=[perm_objects[code] for code in p_codes]
            )
            db.add(r)
            role_objects[r_name] = r

        await db.flush()

        # 3. Create Super Admin User
        admin_user = User(
            username="admin",
            email="admin@school.edu",
            password_hash=get_password_hash("Admin123!"),
            first_name="Super",
            last_name="Admin",
            is_superuser=True,
            is_active=True,
            roles=[role_objects["Super Admin"]],
        )
        db.add(admin_user)

        # 4. Create Academic Year
        ac_year = AcademicYear(
            name="2026-2027",
            start_date=date(2026, 6, 1),
            end_date=date(2027, 4, 30),
            is_current=True,
            is_archived=False,
        )
        db.add(ac_year)
        await db.flush()

        # 5. Create Classes & Sections
        class_list = [
            ("Grade 1", 1), ("Grade 2", 2), ("Grade 3", 3), ("Grade 4", 4), ("Grade 5", 5),
            ("Grade 6", 6), ("Grade 7", 7), ("Grade 8", 8), ("Grade 9", 9), ("Grade 10", 10),
        ]
        classes = {}
        sections = []

        for name, code in class_list:
            c = Class(academic_year_id=ac_year.id, name=name, code=code)
            db.add(c)
            classes[name] = c

        await db.flush()

        for c in classes.values():
            s_A = Section(class_id=c.id, name="Section A", capacity=30)
            s_B = Section(class_id=c.id, name="Section B", capacity=30)
            db.add(s_A)
            db.add(s_B)
            sections.extend([s_A, s_B])

        await db.flush()

        # 6. Create Subjects
        subject_names = [
            ("Mathematics", "MATH"), ("English Language", "ENG"), ("Science", "SCI"),
            ("Social Studies", "SOC"), ("Computer Science", "CS"), ("Physical Education", "PE")
        ]
        subjects = []
        for s_name, s_code in subject_names:
            sub = Subject(name=s_name, code=s_code, subject_type="THEORY")
            db.add(sub)
            subjects.append(sub)

        await db.flush()

        # 7. Create Teachers (12 Teachers)
        pwd_hash = get_password_hash(DEFAULT_PASSWORD)
        teachers = []
        departments = ["Mathematics", "Science", "Languages", "Humanities", "IT"]
        for i in range(1, 13):
            t_user = User(
                username=f"teacher{i}",
                email=f"teacher{i}@school.edu",
                password_hash=pwd_hash,
                first_name=f"TeacherFirst{i}",
                last_name=f"TeacherLast{i}",
                roles=[role_objects["Teacher"]],
            )
            db.add(t_user)
            await db.flush()

            t = Teacher(
                user_id=t_user.id,
                employee_id=f"EMP-2026-{100+i}",
                first_name=f"TeacherFirst{i}",
                last_name=f"TeacherLast{i}",
                email=f"teacher{i}@school.edu",
                phone=f"+15550100{i:02d}",
                address=f"{100+i} Education Way, Academic City",
                qualification="M.Sc, B.Ed",
                specialization=departments[i % len(departments)],
                experience_years=3 + (i % 8),
                joining_date=date(2020, 8, 1),
                department=departments[i % len(departments)],
                designation="Senior Teacher",
                is_active=True,
            )
            db.add(t)
            teachers.append(t)

        await db.flush()

        # 8. Create Parents (30 Parents)
        parents = []
        for i in range(1, 31):
            p_user = User(
                username=f"parent{i}",
                email=f"parent{i}@gmail.com",
                password_hash=pwd_hash,
                first_name=f"ParentFirst{i}",
                last_name=f"ParentLast{i}",
                roles=[role_objects["Parent/Guardian"]],
            )
            db.add(p_user)
            await db.flush()

            p = Parent(
                user_id=p_user.id,
                first_name=f"ParentFirst{i}",
                last_name=f"ParentLast{i}",
                phone=f"+15550200{i:02d}",
                email=f"parent{i}@gmail.com",
                occupation="Engineer / Professional",
                address=f"{200+i} Residential Ave, City",
            )
            db.add(p)
            parents.append(p)

        await db.flush()

        # 9. Create Students (55 Students)
        students = []
        for i in range(1, 56):
            s_user = User(
                username=f"student{i}",
                email=f"student{i}@school.edu",
                password_hash=pwd_hash,
                first_name=f"StudentFirst{i}",
                last_name=f"StudentLast{i}",
                roles=[role_objects["Student"]],
            )
            db.add(s_user)
            await db.flush()

            st = Student(
                user_id=s_user.id,
                student_id_number=f"STU-2026-{1000+i}",
                admission_number=f"ADM-2026-{2000+i}",
                first_name=f"StudentFirst{i}",
                last_name=f"StudentLast{i}",
                date_of_birth=date(2012, 1 + (i % 12), 1 + (i % 28)),
                gender="MALE" if i % 2 == 0 else "FEMALE",
                address=f"{300+i} Student Street, City",
                contact_number=f"+15550300{i:02d}",
                status=StudentStatusEnum.ACTIVE.value,
            )
            db.add(st)
            await db.flush()
            students.append(st)

            # Assign to Section
            sec = sections[i % len(sections)]
            enr = StudentEnrollment(
                student_id=st.id,
                section_id=sec.id,
                academic_year_id=ac_year.id,
                status="ACTIVE",
                date_enrolled=date(2026, 6, 1),
            )
            db.add(enr)

            # Link Parent
            parent_link = StudentParent(
                student_id=st.id,
                parent_id=parents[i % len(parents)].id,
                relationship_type="FATHER" if i % 2 == 0 else "MOTHER",
                is_primary_contact=True,
            )
            db.add(parent_link)

        await db.flush()

        # 10. Admissions Applications (10 Applications)
        g1_class = classes["Grade 1"]
        for i in range(1, 11):
            app = AdmissionApplication(
                application_number=f"APP-2026-{5000+i}",
                first_name=f"ApplicantFirst{i}",
                last_name=f"ApplicantLast{i}",
                date_of_birth=date(2019, 3, 10),
                gender="MALE" if i % 2 == 0 else "FEMALE",
                parent_name=f"ApplicantParent{i}",
                parent_email=f"applicantparent{i}@example.com",
                parent_phone=f"+15550400{i:02d}",
                address=f"{400+i} New Hope Rd",
                target_class_id=g1_class.id,
                target_academic_year_id=ac_year.id,
                status=ApplicationStatusEnum.APPLIED.value if i <= 5 else ApplicationStatusEnum.APPROVED.value,
            )
            db.add(app)

        # 11. Phase 2 Seed Data: Fee Categories & Fee Structures
        from app.models.domain import Announcement, Attendance, Exam, ExamMark, ExamSchedule, FeeCategory, FeePayment, FeeStructure, LeaveApplication, StudentFeeInvoice, TimetableSlot

        fee_cat_tuition = FeeCategory(name="Tuition Fee", description="Monthly academic tuition fee")
        fee_cat_exam = FeeCategory(name="Exam Fee", description="Term examination fee")
        db.add(fee_cat_tuition)
        db.add(fee_cat_exam)
        await db.flush()

        for c_name, c_obj in classes.items():
            fs = FeeStructure(
                academic_year_id=ac_year.id,
                class_id=c_obj.id,
                fee_category_id=fee_cat_tuition.id,
                amount=1200.0,
                due_date=date(2026, 9, 30),
            )
            db.add(fs)
            await db.flush()

            # Create Invoices & Payments for first 5 students in this class
            for st in students[:5]:
                inv = StudentFeeInvoice(
                    invoice_number=f"INV-2026-{random_id()}",
                    student_id=st.id,
                    academic_year_id=ac_year.id,
                    fee_structure_id=fs.id,
                    total_amount=1200.0,
                    discount_amount=100.0,
                    paid_amount=600.0,
                    due_date=date(2026, 9, 30),
                    status="PARTIAL",
                )
                db.add(inv)
                await db.flush()

                pay = FeePayment(
                    invoice_id=inv.id,
                    payment_number=f"PAY-2026-{random_id()}",
                    amount_paid=600.0,
                    payment_method="CASH",
                    transaction_reference="TXN-CASH-001",
                    received_by_id=admin_user.id,
                )
                db.add(pay)

        # 12. Timetable Slots
        sec_g1_a = sections[0]
        days = ["MON", "TUE", "WED", "THU", "FRI"]
        for p_idx, day in enumerate(days):
            t_slot = TimetableSlot(
                section_id=sec_g1_a.id,
                subject_id=subjects[p_idx % len(subjects)].id,
                teacher_id=teachers[p_idx % len(teachers)].id,
                day_of_week=day,
                period_number=1,
                start_time="09:00",
                end_time="09:45",
                room_number="Room 101",
            )
            db.add(t_slot)

        # 13. Exams & Marks
        exam_midterm = Exam(
            name="Midterm Examination 2026",
            exam_type="MIDTERM",
            academic_year_id=ac_year.id,
            start_date=date(2026, 10, 10),
            end_date=date(2026, 10, 20),
            is_published=True,
        )
        db.add(exam_midterm)
        await db.flush()

        exam_sch = ExamSchedule(
            exam_id=exam_midterm.id,
            class_id=g1_class.id,
            subject_id=subjects[0].id,
            exam_date=date(2026, 10, 12),
            start_time="10:00",
            end_time="12:00",
            max_marks=100,
            passing_marks=40,
        )
        db.add(exam_sch)
        await db.flush()

        for st in students[:5]:
            m = ExamMark(
                exam_schedule_id=exam_sch.id,
                student_id=st.id,
                marks_obtained=85.5,
                is_absent=False,
                remarks="Excellent performance",
            )
            db.add(m)

        # 14. Announcements & Leave Applications
        ann = Announcement(
            title="Parent-Teacher Association Meeting",
            content="All parents are requested to join the PTA meeting scheduled for next Friday.",
            target_role="ALL",
            created_by_id=admin_user.id,
            is_important=True,
        )
        db.add(ann)

        leave_app = LeaveApplication(
            applicant_user_id=students[0].user_id,
            applicant_type="STUDENT",
            leave_type="SICK",
            start_date=date(2026, 9, 10),
            end_date=date(2026, 9, 12),
            reason="High fever and doctor advised rest",
            status="APPROVED",
            reviewed_by_id=admin_user.id,
        )
        db.add(leave_app)

        await db.commit()
        print("Database successfully seeded with Phase 1 & Phase 2 entities (Attendance, Timetable, Exams, Fees, Invoices, Leaves, Announcements)!")


def random_id():
    import random, string
    return "".join(random.choices(string.digits, k=5))



if __name__ == "__main__":
    asyncio.run(seed_database())
