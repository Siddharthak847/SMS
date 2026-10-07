import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_and_admission_flow(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create Academic Year
    ac_res = await client.post(
        "/api/v1/academic-years/",
        headers=headers,
        json={
            "name": "2026-2027 Test",
            "start_date": "2026-06-01",
            "end_date": "2027-04-30",
            "is_current": True,
        },
    )
    assert ac_res.status_code == 201
    ac_id = ac_res.json()["id"]

    # 2. Create Class & Section
    c_res = await client.post(
        "/api/v1/classes/",
        headers=headers,
        json={"academic_year_id": ac_id, "name": "Class 10", "code": 10},
    )
    assert c_res.status_code == 201
    c_id = c_res.json()["id"]

    sec_res = await client.post(
        f"/api/v1/classes/{c_id}/sections",
        headers=headers,
        json={"class_id": c_id, "name": "Section A", "capacity": 30},
    )
    assert sec_res.status_code == 201
    sec_id = sec_res.json()["id"]

    # 3. Create Student directly
    stu_res = await client.post(
        "/api/v1/students/",
        headers=headers,
        json={
            "username": "teststudent1",
            "email": "teststudent1@school.edu",
            "password": "Password123!",
            "student_id_number": "STU-9901",
            "admission_number": "ADM-9901",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "2010-05-15",
            "gender": "MALE",
            "address": "123 Test St",
            "contact_number": "+15551234",
            "section_id": sec_id,
            "academic_year_id": ac_id,
        },
    )
    assert stu_res.status_code == 201
    stu_data = stu_res.json()
    assert stu_data["first_name"] == "John"

    # 4. Duplicate Student ID rejection
    dup_res = await client.post(
        "/api/v1/students/",
        headers=headers,
        json={
            "username": "teststudent2",
            "email": "teststudent2@school.edu",
            "password": "Password123!",
            "student_id_number": "STU-9901",
            "admission_number": "ADM-9902",
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "2010-05-15",
            "gender": "FEMALE",
            "address": "123 Test St",
            "contact_number": "+15551234",
            "section_id": sec_id,
            "academic_year_id": ac_id,
        },
    )
    assert dup_res.status_code == 400

    # 5. Admission workflow test
    app_res = await client.post(
        "/api/v1/admissions/",
        json={
            "first_name": "Alice",
            "last_name": "Smith",
            "date_of_birth": "2018-04-12",
            "gender": "FEMALE",
            "parent_name": "Robert Smith",
            "parent_email": "robert@example.com",
            "parent_phone": "+15558888",
            "address": "456 Oak Lane",
            "target_class_id": c_id,
            "target_academic_year_id": ac_id,
        },
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # Approve Application
    app_update = await client.patch(
        f"/api/v1/admissions/{app_id}/status",
        headers=headers,
        json={"status": "APPROVED"},
    )
    assert app_update.status_code == 200
    assert app_update.json()["status"] == "APPROVED"

    # Enroll Approved Applicant
    enroll_res = await client.post(
        f"/api/v1/admissions/{app_id}/enroll?section_id={sec_id}",
        headers=headers,
    )
    assert enroll_res.status_code == 200
    assert enroll_res.json()["first_name"] == "Alice"
