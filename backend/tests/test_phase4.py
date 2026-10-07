import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_transport_vehicles_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/transport/vehicles", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_reports_summary_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/reports/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "students" in data
    assert "financials" in data


@pytest.mark.asyncio
async def test_analytics_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/analytics/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "enrollment_trends" in data
    assert "grade_distribution" in data


@pytest.mark.asyncio
async def test_global_search_endpoint(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = await client.get("/api/v1/search/?q=admin", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "query" in data
    assert "results" in data
