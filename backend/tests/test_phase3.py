import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_portal_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/dashboard/student-portal", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "attendance_percentage" in data
    assert "total_due_fees" in data


@pytest.mark.asyncio
async def test_parent_portal_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/dashboard/parent-portal", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "children" in data


@pytest.mark.asyncio
async def test_teacher_portal_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/dashboard/teacher-portal", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "timetable_slots" in data


@pytest.mark.asyncio
async def test_audit_logs_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/audit-logs/?page=1&size=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
