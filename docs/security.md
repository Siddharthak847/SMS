# School Management ERP — Security Hardening & Audit Standards

## Security Safeguards Implemented
1. **Password Security**: Passwords hashed using bcrypt algorithm.
2. **Access Control**: Fine-grained RBAC enforced via API router guards (`require_permission`).
3. **Audit Trails**: Critical operations logged in `audit_logs` (actor_id, action, entity_type, entity_id, timestamp, IP address).
4. **Data Isolation**: Database relations scoped per student/parent/teacher identity.
5. **No Excluded Features**: Clean codebase without unused tables or unnecessary dependencies.
