# School Management ERP — Local Development Guide

## Local Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m pytest
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js 14)
```bash
cd frontend
npm install
npm run dev
npm run build
```

## Running Tests
- Backend test suite: `python -m pytest`
- Frontend type & build check: `npm run build`
