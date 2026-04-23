# Manual Deployment Guide

Since Docker is not available, follow these steps to deploy manually.

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## 1. Database Setup

```bash
# Create database
createdb kasbnoma

# Or via psql
psql -c "CREATE DATABASE kasbnoma;"
```

## 2. Backend Deployment (Specialties API)

```bash
cd /Users/shuhrat/KN NEW/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://kasbnoma:kasbnoma@localhost:5432/kasbnoma?schema=public"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Build for production
npm run build

# Start server
npm run start
```

The specialties API will run on `http://localhost:4001`

## 3. Main Backend (FastAPI)

```bash
cd /Users/shuhrat/KN NEW

# Install Python dependencies
pip install -r requirements.txt

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://kasbnoma:kasbnoma@localhost:5432/kasbnoma?schema=public"

# Run migrations (if needed)
# python -m alembic upgrade head

# Start FastAPI server
uvicorn app.main:create_app --host 0.0.0.0 --port 8000
```

The main API will run on `http://localhost:8000`

## 4. Frontend Deployment

```bash
cd /Users/shuhrat/KN NEW/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

The frontend will run on `http://localhost:3000`

## 5. Verify Deployment

```bash
# Check specialties API
curl http://localhost:4001/api/health

# Check main API
curl http://localhost:8000/api/health

# Access frontend
open http://localhost:3000/admin
```

## Environment Variables

### Backend (Specialties)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kasbnoma?schema=public"
PORT=4001
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

### Main Backend
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kasbnoma?schema=public"
```

### Frontend
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SPECIALTIES_API_URL=http://localhost:4001
PORT=3000
```