import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_bulk_attendance_marking(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    att_payload = {
        "section_id": "non-existent-id",
        "date": "2026-09-01",
        "entries": [],
    }
    response = await client.post("/api/v1/attendance/bulk", json=att_payload, headers=headers)
    assert response.status_code == 404  # Invalid section ID handled gracefully


@pytest.mark.asyncio
async def test_exam_and_report_card_flow(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    ay_res = await client.get("/api/v1/academic-years/", headers=headers)
    assert ay_res.status_code == 200
    ay_data = ay_res.json()

    if len(ay_data) == 0:
        # Create an academic year for testing
        ay_create = {
            "name": "2026-2027 Test Year",
            "start_date": "2026-06-01",
            "end_date": "2027-04-30",
            "is_current": True,
        }
        create_res = await client.post("/api/v1/academic-years/", json=ay_create, headers=headers)
        assert create_res.status_code == 201
        ay_id = create_res.json()["id"]
    else:
        ay_id = ay_data[0]["id"]

    # Create Exam
    exam_payload = {
        "name": "Phase 2 Integration Exam",
        "exam_type": "FINAL",
        "academic_year_id": ay_id,
        "start_date": "2026-11-01",
        "end_date": "2026-11-15",
    }
    exam_res = await client.post("/api/v1/examinations/", json=exam_payload, headers=headers)
    assert exam_res.status_code == 201
    assert exam_res.json()["name"] == "Phase 2 Integration Exam"


@pytest.mark.asyncio
async def test_fee_category_and_structure_flow(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    cat_payload = {"name": "Lab & Practical Fee", "description": "Annual computer lab fee"}
    cat_res = await client.post("/api/v1/fees/categories", json=cat_payload, headers=headers)
    assert cat_res.status_code in [201, 400]

    cats_res = await client.get("/api/v1/fees/categories", headers=headers)
    assert cats_res.status_code == 200
    assert len(cats_res.json()) > 0


@pytest.mark.asyncio
async def test_announcements_and_leaves(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    ann_payload = {
        "title": "Phase 2 Deployment Announcement",
        "content": "Phase 2 backend and frontend modules are active.",
        "target_role": "ALL",
        "is_important": True,
    }
    ann_res = await client.post("/api/v1/communication/", json=ann_payload, headers=headers)
    assert ann_res.status_code == 201
    assert ann_res.json()["title"] == "Phase 2 Deployment Announcement"

    list_res = await client.get("/api/v1/communication/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0
