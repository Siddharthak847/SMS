# School Management ERP — Authentication & Security Architecture

## Token-Based Authentication Flow
1. User submits credentials to `POST /api/v1/auth/login`.
2. Backend validates password against bcrypt hash.
3. Access token (short-lived JWT) and Refresh token are issued.
4. Client attaches `Authorization: Bearer <token>` on all REST calls.

## Role-Based Access Control (RBAC)
FastAPI dependency injection guards enforce permission checks on API routes:

```python
@router.get("/students", dependencies=[Depends(require_permission("student:read"))])
```

### System Roles
- `Super Admin`: Full system configuration.
- `Principal`: School-wide academic and financial visibility.
- `School Admin`: Daily operational management.
- `Teacher`: Class-level academic, attendance, and exam management.
- `Student`: Personal profile, grades, timetable, and notices.
- `Parent/Guardian`: Linked children academic, fee, and notice tracking.
- `Accountant`: Financial fee structures and collection tracking.
- `Transport Manager`: Vehicles and transport routes management.
