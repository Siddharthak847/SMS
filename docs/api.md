# School Management ERP — API Reference Documentation

## Base Endpoint
All API endpoints are hosted under `/api/v1`. Interactive OpenAPI documentation is accessible at `/docs` when running the backend server.

## API Endpoint Categories

### 1. Authentication (`/api/v1/auth`)
- `POST /login`: Generate JWT access and refresh tokens.
- `POST /logout`: Invalidate session token.
- `POST /refresh`: Issue new access token.
- `GET /me`: Fetch authenticated user profile.

### 2. People & Admissions
- `/students`: GET, POST, PUT, DELETE student records.
- `/teachers`: GET, POST, PUT, PATCH faculty profiles.
- `/parents`: GET, POST, PUT parent accounts and link students.
- `/admissions`: GET, POST, PATCH admission applications and trigger student enrollment.

### 3. Academics & Examinations
- `/academic-years`, `/classes`, `/sections`, `/subjects`: Manage structure.
- `/attendance`: Bulk mark section attendance.
- `/timetable`: Assign section period schedules.
- `/examinations`: Manage exams, schedules, and bulk mark entry.

### 4. Finances, Communications & Events
- `/fees`: Fee structures, student invoices, and fee payment recording.
- `/leaves`: Submit and review leave applications.
- `/communication`: Broadcast noticeboard announcements.
- `/events`: Schedule school events.
- `/certificates`: Issue official academic certificates.

### 5. Transport, Reports, Analytics & Search
- `/transport`: Manage vehicles, routes, stops, and student transport assignments.
- `/reports`: Aggregate executive report metrics.
- `/analytics`: Fetch enrollment, attendance, financial, and grade analytics data.
- `/search`: Global multi-entity search API.
- `/audit-logs`: Fetch security audit logs.
