from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, async_engine
from app.core.logging import logger, setup_logging
from app.db.seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info("Starting up School Management ERP Backend...", environment=settings.ENVIRONMENT)

    # Initialize DB tables for development/testing
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial data
    try:
        await seed_database()
        logger.info("Database seeding completed successfully")
    except Exception as e:
        logger.warning("Database seeding skipped or encountered non-critical notice", error=str(e))

    yield

    logger.info("Shutting down School Management ERP Backend...")
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler to prevent leaking stack traces or internal secrets
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled Global Exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system administrator."},
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to School Management ERP API", "docs": "/docs", "health": f"{settings.API_V1_STR}/health"}
