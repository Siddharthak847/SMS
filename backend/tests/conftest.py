import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app
from app.models.domain import Permission, Role, User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def admin_user(db_session: AsyncSession):
    # Create all perms
    perms = [
        Permission(code="users:manage", module="users"),
        Permission(code="roles:manage", module="roles"),
        Permission(code="student:create", module="student"),
        Permission(code="student:read", module="student"),
        Permission(code="student:update", module="student"),
        Permission(code="teacher:manage", module="teacher"),
        Permission(code="parent:manage", module="parent"),
        Permission(code="academics:manage", module="academics"),
        Permission(code="admission:manage", module="admission"),
        Permission(code="dashboard:view", module="dashboard"),
    ]
    for p in perms:
        db_session.add(p)
    await db_session.flush()

    super_role = Role(name="Super Admin", permissions=perms)
    teacher_role = Role(name="Teacher", permissions=[p for p in perms if p.code in ["student:read", "dashboard:view"]])
    student_role = Role(name="Student", permissions=[p for p in perms if p.code in ["student:read", "dashboard:view"]])
    parent_role = Role(name="Parent/Guardian", permissions=[p for p in perms if p.code in ["student:read", "dashboard:view"]])

    db_session.add_all([super_role, teacher_role, student_role, parent_role])
    await db_session.flush()

    user = User(
        username="admin",
        email="admin@test.com",
        password_hash=get_password_hash("Admin@12345!"),
        first_name="Admin",
        last_name="Test",
        is_superuser=True,
        is_active=True,
        roles=[super_role],
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture(scope="function")
async def admin_token(client, admin_user):
    res = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@12345!"})
    return res.json()["access_token"]
