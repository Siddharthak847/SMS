from fastapi import APIRouter
from app.api.v1.endpoints import (
    academic_years,
    admissions,
    analytics,
    attendance,
    audit_logs,
    auth,
    certificates,
    classes,
    communication,
    dashboard,
    events,
    examinations,
    fees,
    health,
    leaves,
    parents,
    reports,
    roles,
    search,
    sections,
    students,
    subjects,
    teachers,
    timetable,
    transport,
    users,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, prefix="/roles", tags=["Roles & Permissions"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["Teachers"])
api_router.include_router(parents.router, prefix="/parents", tags=["Parents"])
api_router.include_router(academic_years.router, prefix="/academic-years", tags=["Academic Years"])
api_router.include_router(classes.router, prefix="/classes", tags=["Classes"])
api_router.include_router(sections.router, prefix="/sections", tags=["Sections"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(admissions.router, prefix="/admissions", tags=["Admissions"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable"])
api_router.include_router(examinations.router, prefix="/examinations", tags=["Examinations"])
api_router.include_router(fees.router, prefix="/fees", tags=["Fees & Finances"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["Leaves"])
api_router.include_router(communication.router, prefix="/communication", tags=["Communication"])
api_router.include_router(events.router, prefix="/events", tags=["Event Management"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificate Management"])
api_router.include_router(transport.router, prefix="/transport", tags=["Transport Management"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reporting System"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics Dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["Global Search"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logs"])


