# AR Company Admin Dashboard - Monorepo

This is a monorepo containing a frontend-backend split architecture for the AR Company admin dashboard.

## 📁 Project Structure

```
ar-company/
├── frontend/              # Next.js 16 frontend application
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Frontend utilities and auth context
│   ├── styles/          # CSS/styling
│   ├── package.json
│   └── tsconfig.json
├── backend/               # Express.js backend API
│   ├── src/
│   │   ├── server.ts    # Express app entry point
│   │   ├── routes/      # API route handlers
│   │   └── data/        # Mock data
│   ├── package.json
│   └── tsconfig.json
├── shared/                # Shared types and utilities
│   ├── types/           # TypeScript interfaces
│   ├── utils.ts         # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── public/                # Static assets (shared)
├── .env.example           # Environment variables template
├── .env.local             # Local environment variables
└── package-root.json      # Monorepo root (rename to package.json to use pnpm workspaces)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies for all workspaces:
```bash
pnpm install
```

2. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

### Development

#### Run both frontend and backend:
```bash
pnpm dev
```

#### Run frontend only:
```bash
pnpm dev:frontend
```

#### Run backend only:
```bash
pnpm dev:backend
```

The frontend will be available at `http://localhost:3000`
The backend API will be available at `http://localhost:3001/api`

### Build

#### Build all packages:
```bash
pnpm build
```

#### Build individual packages:
```bash
pnpm build:frontend
pnpm build:backend
```

### Production

#### Start all services:
```bash
pnpm start
```

## 📚 Architecture

### Frontend (`@ar-company/frontend`)
- **Framework**: Next.js 16 with React 19
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: React Context (Authentication)
- **Form Handling**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS with custom theme

**Key Features**:
- Admin dashboard with student/professor management
- Finance module with income/expense tracking
- Feedback management
- User management (admin only)
- Dark/Light theme support

### Backend (`@ar-company/backend`)
- **Framework**: Express.js with TypeScript
- **Database**: Supabase/Postgres (configured through the backend)
- **Authentication**: Mock implementation (to be replaced with JWT)
- **API Structure**: RESTful endpoints

**API Endpoints**:
- `GET /api/students` - List students
- `GET /api/professors` - List professors
- `GET /api/expenses` - List expenses
- `GET /api/income` - List income records
- `GET /api/feedback` - List feedback
- `GET /api/users` - List users
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/overview` - Complete dashboard overview

### Shared (`@ar-company/shared`)
- **Types**: Shared TypeScript interfaces for Student, Professor, Expense, Income, Feedback, User, etc.
- **Utils**: Common utility functions (e.g., `cn()` for class merging)

## 🔐 Environment Variables

Create a `.env.local` file with:

```
# Database
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# Backend
BACKEND_PORT=3001
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# Analytics
NEXT_PUBLIC_ANALYTICS=false

# App Config
NEXT_PUBLIC_APP_NAME="AR Company"
NEXT_PUBLIC_APP_DESCRIPTION="Course Management Administration Platform"
```

## 📝 Notes

- The application relies entirely on Supabase/Postgres for all content and operational data; ensure the database is populated and reachable.
- Authentication uses the backend API and JWT tokens; no fallback or mock credentials are present.
- Frontend design is unchanged to preserve UX consistency.
- Monorepo management uses pnpm workspaces for dependency management.

## 🔁 Migration Notes

- All core records use UUIDv4 primary keys with short `displayId` aliases (e.g. `ENR-60CF`). API clients must treat `id` as an opaque string and use `displayId` for UI labels.
- Backend tests should run against a controlled Supabase/Postgres database; no demo seeding occurs automatically.

## 🔄 Next Steps

1. Keep environment variables aligned between frontend and backend (.env.local).
2. Monitor Supabase/Postgres availability in production; surface clear errors to users if unavailable.
3. Add request/response interceptors for API calls as needed.

## 📦 Dependencies

### Frontend

### Backend

### Shared

## 📄 License

Private - AR Company
## Contributors
- Anas Abusefrita — Course project team
- Roland Kola — Course project team
- typescript - Type safety
