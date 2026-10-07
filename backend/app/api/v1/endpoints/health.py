from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.redis import redis_client

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    redis_status = "ok"

    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    try:
        res = await redis_client.get("health_ping")
    except Exception as e:
        redis_status = f"degraded: {str(e)}"

    overall_status = "healthy" if db_status == "ok" else "unhealthy"

    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
        "version": "1.0.0",
    }
