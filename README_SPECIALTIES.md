# University Specialties Management System

A full-stack web application for uploading Excel files containing university specialties data, parsing the files, saving data to a PostgreSQL database, and displaying it on the frontend with filtering capabilities.

## 📋 Features

### Backend (Express + Prisma)
- **Excel Upload**: Upload `.xlsx` files with university specialties data
- **Smart Parsing**: Automatically parses Tajik-language columns and splits compound fields
- **Duplicate Prevention**: Uses upsert to prevent duplicate entries based on code + university + study form
- **Multiple Sheets**: Supports multiple Excel sheets in a single file
- **REST API**: Full REST API with filtering, pagination, and sorting

### Frontend (React + TypeScript)
- **File Upload UI**: Drag-and-drop or click to upload Excel files
- **Preview**: Preview data before importing
- **Data Table**: Display all specialties with sorting
- **Filters**: Filter by location, language, study type, and university
- **Search**: Full-text search across all fields
- **Pagination**: Navigate through large datasets
- **Loading States**: Visual feedback during operations

## 🏗️ Project Structure

```
backend/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── lib/
│   │   └── prisma.ts      # Prisma client
│   ├── routes/
│   │   ├── upload.ts      # Excel upload endpoints
│   │   └── specialties.ts # Data retrieval endpoints
│   ├── services/
│   │   └── excel-parser.ts # Excel parsing logic
│   └── server.ts          # Express server
├── package.json
├── tsconfig.json
└── .env.example

frontend/
├── src/
│   ├── api/
│   │   ├── client.ts            # Main API client
│   │   ├── specialtiesClient.ts # Specialties API client
│   │   ├── kasbnoma.ts          # API functions
│   │   └── types.ts             # TypeScript types
│   ├── components/
│   │   └── admin/
│   │       └── AdminSpecialtiesTab.tsx # Specialties management
│   └── pages/
│       └── Admin.tsx            # Admin panel
└── ...
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE kasbnoma;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/kasbnoma?schema=public"

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

The backend will run on `http://localhost:4001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Admin Panel

Navigate to `http://localhost:5173/admin` and click on the "Ихтисосҳо (Excel)" tab.

## 📊 API Endpoints

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-excel/preview` | Preview Excel file |
| POST | `/api/upload-excel` | Upload and import Excel |

### Specialties Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/specialties/filters` | Get distinct filter values |
| GET | `/api/specialties` | List with filters & pagination |
| GET | `/api/specialties/export` | Export to Excel |
| GET | `/api/specialties/:id` | Get single specialty |
| DELETE | `/api/specialties/:id` | Delete specialty |
| DELETE | `/api/specialties` | Clear all specialties |

### Query Parameters for GET /specialties

| Parameter | Type | Description |
|-----------|------|-------------|
| location | string | Filter by location |
| language | string | Filter by language |
| studyType | string | Filter by study type (paid/free) |
| university | string | Filter by university |
| search | string | Full-text search |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| sortBy | string | Sort field (createdAt, code, name, university, price) |
| sortOrder | string | Sort direction (asc/desc) |

## 📝 Excel File Format

The Excel file should contain the following columns (Tajik language headers):

| Column | Description |
|--------|-------------|
| ID | Optional ID |
| рамз ва ном | Code and name (e.g., "1010100 — Иктисоси иктисосӣ") |
| Муассисаи таълимии таҳсилоти олии касбӣ | University name |
| макон (шаҳр/ноҳия) | Location (city/region) |
| Шакли таҳсил | Study form (e.g., "рӯз", "шаб") |
| Намуди таҳсил(маблағ бо сомонӣ) | Study type and price (e.g., "пулакӣ (6950)", "ройгон") |
| Забони таҳсил | Language (e.g., "тоҷикӣ", "русӣ") |
| Нақшаи қабул | Quota (number of seats) |
| Дараҷаи таҳсил | Degree (e.g., "бакалавр", "магистр") |

### Example Data

| рамз ва ном | Муассисаи таълимии таҳсилоти олии касбӣ | макон | Шакли таҳсил | Намуди таҳсил | Забони таҳсил | Нақшаи қабул | Дараҷаи таҳсил |
|-------------|--------------------------------------|-------|--------------|---------------|---------------|---------------|-----------------|
| 1010100 — Иктисоси иктисосӣ | ДТМО ба номи С. Умаров | Душанбе | рӯз | пулакӣ (6950) | тоҷикӣ | 25 | бакалавр |
| 1010200 — Математика | Донишгохи миллии Тоҷикистон | Душанбе | рӯз | ройгон | русӣ | 20 | бакалавр |

## 🔧 Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/kasbnoma?schema=public"
PORT=4001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SPECIALTIES_API_URL=http://localhost:4001
```

## 🐳 Docker Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f backend
```

## 📦 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Excel Parser**: xlsx
- **File Upload**: Multer

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Animations**: Framer Motion

## 📄 License

MIT