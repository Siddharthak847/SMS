# School Management ERP — Database Schema & Data Dictionary

## Core Tables Overview

### Phase 1: Foundation & People
- `users`: Core account identity (`id`, `username`, `email`, `password_hash`, `is_active`, `is_superuser`).
- `roles` & `permissions`: Role-based access control matrix (`role_permissions`).
- `students`: Student profile details (`student_id_number`, `admission_number`, DOB, gender, status).
- `teachers`: Faculty record details (`employee_id`, qualification, specialization, joining_date).
- `parents`: Guardian profile records and student links (`student_parents`).
- `academic_years`, `classes`, `sections`, `subjects`, `class_subjects`.
- `admission_applications`: Admissions pipeline records.

### Phase 2: Academic Engine
- `attendances` & `teacher_attendances`: Daily student & faculty attendance tracking.
- `timetables`: Section period schedule mapping (`section_id`, `subject_id`, `teacher_id`, `period_number`).
- `exams`, `exam_schedules`, `exam_marks`: Examination creation, timetable scheduling, and grade recording.

### Phase 3: Administrative Layer
- `fee_categories`, `fee_structures`, `student_fee_invoices`, `fee_payments`: Billing & collection records.
- `leave_applications`: Student & staff leave request workflows.
- `announcements`: Noticeboard circulars and notifications.
- `school_events`: Event calendar items.
- `certificate_records`: Official academic document logs.
- `audit_logs`: System security audit event logs.

### Phase 4: Fleet & Transport
- `vehicles`: Bus fleet management (`vehicle_number`, `registration_number`, `capacity`, `driver_name`).
- `transport_routes` & `route_stops`: Bus routes, fares, and stop schedules.
- `student_transports`: Student transport assignments.
