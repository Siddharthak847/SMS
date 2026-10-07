<div align="center">

<img src="https://img.shields.io/badge/School%20Management-ERP-blue?style=for-the-badge&logo=graduation-cap&logoColor=white" alt="SMS ERP Badge"/>

# 🎓 School Management ERP System

### A Production-Ready, Full-Stack Enterprise School Management Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Dev-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#-features) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Project Structure](#-project-structure) • [Screenshots](#-screenshots)

</div>

---

## 📖 Overview

A centralized, secure, multi-tenant capable **School Management ERP** built through 4 carefully architected implementation phases. Designed for real-world school operations — from student admissions to transport fleet management — with full role-based access control, financial accounting, and executive analytics.

> **Live Demo Credentials:** `admin` / `Admin123!`

---

## ✨ Features

### 👥 People & Access Management
- JWT Authentication with refresh tokens
- Role-Based Access Control (RBAC): `Super Admin`, `Principal`, `School Admin`, `Teacher`, `Student`, `Parent`, `Accountant`, `Transport Manager`
- Student, Teacher & Parent CRUD with detailed profiles
- Multi-stage Admissions Pipeline: `APPLIED → VERIFIED → APPROVED → ENROLLED`

### 📚 Academic Engine
- Daily attendance marking (`PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `EXCUSED`) with automated % calculations
- Class & teacher timetable management with **clash detection**
- Examinations management, exam schedules & bulk marks entry with grade scaling
- Professional **printable report card** generation

### 💰 Financial & Administrative
- Fee structures, student fee accounts, discounts & multi-method payment collection (Cash, Bank Transfer, Online, Cheque)
- Student & staff leave request workflows with admin reviews
- Role-targeted noticeboard announcements
- Event schedule calendar & official Certificate Generator (Bonafide, Study, Character, TC, Achievement)
- Security Audit Log monitoring

### 🚌 Fleet, Analytics & Production Features
- Transport fleet & bus vehicle management, route planning, stop schedules & student assignments
- Executive report aggregator with **CSV export** and printing
- Visual analytics dashboard with **Recharts** graphs
- Multi-entity **global search engine**
- 17 passing automated pytest cases + Next.js 14 production build (27 pages)

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **State/Forms** | TanStack Query v5, React Hook Form, Zod |
| **Charts** | Recharts |
| **Backend** | Python 3.11+, FastAPI, Async SQLAlchemy 2.0, Pydantic v2 |
| **Auth** | JWT (python-jose), bcrypt, Refresh Tokens |
| **Database** | PostgreSQL 16 (prod) / SQLite (dev, zero-config) |
| **Cache** | Redis 7 (sessions & rate limiting) |
| **Migrations** | Alembic |
| **Logging** | Structlog |
| **Testing** | pytest, pytest-asyncio, httpx |
| **Containerization** | Docker & Docker Compose |

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Siddharthak847/SMS.git
cd SMS

# Copy environment config
cp .env.example .env

# Start all services (Backend + Frontend + PostgreSQL + Redis)
docker-compose up -d --build
```

- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8000
- **API Docs (Swagger)** → http://localhost:8000/docs

---

### Option 2: Manual Setup (Development)

#### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

#### 1️⃣ Backend Setup

```bash
cd backend

# Activate virtual environment (Windows)
.\venv\Scripts\Activate.ps1

# Or create a new one if needed
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start the FastAPI server (SQLite used automatically in dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> API available at **http://localhost:8000** | Swagger UI at **http://localhost:8000/docs**

#### 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

> App available at **http://localhost:3000**

#### 3️⃣ Login

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin123!` |

---

## 📂 Project Structure

```
SMS/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # All REST API route handlers
│   │   │   ├── auth.py            # JWT login, refresh, logout
│   │   │   ├── students.py        # Student CRUD & profiles
│   │   │   ├── teachers.py        # Teacher management
│   │   │   ├── attendance.py      # Daily attendance marking
│   │   │   ├── examinations.py    # Exams, marks, report cards
│   │   │   ├── fees.py            # Fee structures & payments
│   │   │   ├── transport.py       # Fleet & route management
│   │   │   ├── analytics.py       # Executive dashboard data
│   │   │   ├── certificates.py    # Certificate generation
│   │   │   ├── audit_logs.py      # Security audit trail
│   │   │   └── ...                # 25+ endpoint modules
│   │   ├── core/                  # Config, DB engine, security
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic v2 request/response schemas
│   │   └── db/seed.py             # Database seeder (auto-runs on startup)
│   ├── tests/                     # 17 pytest test cases
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 14 App Router pages (27 pages)
│   │   │   ├── dashboard/         # Executive dashboard
│   │   │   ├── students/          # Student management
│   │   │   ├── academics/         # Subjects, classes, sections
│   │   │   ├── attendance/        # Attendance marking UI
│   │   │   ├── examinations/      # Exams & marks entry
│   │   │   ├── fees/              # Fee collection & receipts
│   │   │   ├── transport/         # Fleet management UI
│   │   │   ├── analytics/         # Charts & visual reports
│   │   │   ├── certificates/      # Certificate generator
│   │   │   ├── audit-logs/        # Security audit viewer
│   │   │   └── ...                # All other feature pages
│   │   ├── components/            # Reusable UI components
│   │   └── lib/                   # API client, utilities, hooks
│   ├── package.json
│   └── Dockerfile
│
├── docs/
│   ├── api.md                     # Full API reference
│   ├── architecture.md            # System architecture
│   ├── database.md                # Database schema
│   ├── authentication.md          # Auth flow documentation
│   ├── deployment.md              # Production deployment guide
│   ├── security.md                # Security practices
│   └── development.md             # Developer guide
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📡 API Documentation

The full API is auto-documented via **Swagger UI** at `http://localhost:8000/docs` and **ReDoc** at `http://localhost:8000/redoc`.

Key API groups:

| Prefix | Description |
|--------|-------------|
| `/api/v1/auth` | Login, logout, token refresh |
| `/api/v1/students` | Student CRUD & profiles |
| `/api/v1/teachers` | Teacher management |
| `/api/v1/attendance` | Attendance marking & reports |
| `/api/v1/examinations` | Exams, marks & report cards |
| `/api/v1/fees` | Fee structures & payments |
| `/api/v1/transport` | Fleet, routes & assignments |
| `/api/v1/analytics` | Executive metrics & graphs |
| `/api/v1/certificates` | Certificate generation |
| `/api/v1/health` | Health check endpoint |

See [`docs/api.md`](docs/api.md) for the complete reference.

---

## 🧪 Running Tests

```bash
cd backend

# Activate venv first
.\venv\Scripts\Activate.ps1

# Run all tests
python -m pytest

# Run with verbose output
python -m pytest -v
```

17 automated test cases covering authentication, student CRUD, attendance, and fee workflows.

---

## 🏗 4-Phase Implementation

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| **Phase 1** | Foundation & People | Auth/RBAC, Students, Teachers, Parents, Admissions |
| **Phase 2** | Academic Engine | Attendance, Timetables, Exams, Report Cards |
| **Phase 3** | Financial & Admin | Fees, Leaves, Notices, Events, Certificates |
| **Phase 4** | Fleet & Analytics | Transport, Analytics Dashboard, Global Search |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# App
SECRET_KEY=your-super-secret-key-min-32-chars
ENVIRONMENT=development

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite+aiosqlite:///./school_erp.db
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/school_erp_db

# Redis (optional in dev)
REDIS_URL=redis://localhost:6379/0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for modern school administration

**[⬆ Back to Top](#-school-management-erp-system)**

</div>
