# School Management ERP — Production Deployment Guide

## Docker Compose Production Setup

Run the multi-container stack:

```bash
docker-compose up -d --build
```

## Environment Configuration (`.env`)
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database secret password
- `POSTGRES_DB`: Database name `school_erp`
- `REDIS_HOST`: Redis service hostname
- `SECRET_KEY`: JWT signing key
- `ALGORITHM`: HS256

## Migrations & Database Initialization
To run migrations and populate seed data:

```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.db.seed
```
