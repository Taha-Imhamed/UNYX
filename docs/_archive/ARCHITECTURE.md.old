# UNYT System — Architecture & UML

System: university admin + student portal (University of New York Tirana). Monorepo, no build orchestrator (npm + concurrently). Dev model: not classic waterfall — evolved **incrementally/agile**, feature-by-feature, roles grew 6→20 over time, schema patched live via ad-hoc SQL + resilience-to-missing-tables pattern. See "Dev Model" section at bottom.

> **Schema drift notice (2026-08-10):** this doc's ERD and table counts below are illustrative/core-only and are stale — they undercount the live database badly (~35 tables claimed vs **149 actual**, per live introspection). See [`SCHEMA.md`](./SCHEMA.md) for the full, generated, ground-truth table reference (columns, PKs, FKs, row estimates) covering HR/payroll, library, research, campus life, quizzes/attendance, security/IT, and reporting subsystems this doc never described. Treat `SCHEMA.md` as authoritative for schema; treat this file as authoritative for request flow, auth, and route architecture, which were verified against source and remain accurate.

---

## 1. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix/shadcn UI, react-hook-form + zod, TanStack Query/Table, Recharts, Playwright (e2e) |
| Backend | Node.js + Express 4, TypeScript (ESM), tsx (dev) / tsc (prod build) |
| DB access | Raw `pg` driver wrapped in custom Mongo-like collection layer (`db/postgres.ts`) — no ORM, no Prisma |
| Database | PostgreSQL (Supabase-hosted) |
| Auth | JWT (`jsonwebtoken`) + bcryptjs, 12h expiry, role+permission matrix |
| Validation | zod |
| Shared contract | `shared/types/index.ts` — single source of DTO/domain types, imported by both sides |
| Testing | Jest + Supertest (backend), Playwright (frontend e2e) |
| Deploy | Vercel (frontend), backend deploy target unspecified in repo |

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Browser"]
        PUB["Public Site\n(Home/About/Admissions/Campus/Contact/Faculties)"]
        DASH["Dashboard Portal\n(31 role-based routes)"]
        STU["Student Portal\n(14 self-service routes)"]
    end

    subgraph FE["Frontend — Next.js 16 App Router (Vercel)"]
        PAGES["app/ pages & layouts"]
        APICLIENT["lib/*-api.ts clients\n+ auth-context.tsx"]
        PROXY["app/api/[...path]/route.ts\n(BFF catch-all proxy)"]
        GUARD["dashboard-route-guard.tsx\n(client-side RBAC gate)"]
    end

    subgraph BE["Backend — Express API"]
        MW1["CORS"]
        MW2["requireAuth (JWT verify)"]
        MW3["enforceMaintenanceMode"]
        ROUTES["22 route modules\n(fat-route pattern, no MVC layer)"]
        LIB["lib/*\nacademic-compliance, transcripts,\nbase-course-assignment"]
        DATA["data/collections.ts\n~31 typed collection accessors"]
    end

    subgraph DB["PostgreSQL (Supabase)"]
        PG["db/postgres.ts\nCollectionLike ORM-lite\ncamelCase<->snake_case mapping\ntolerates missing tables (42P01)"]
        TABLES[("149 tables (see SCHEMA.md)\nusers, students, professors,\ncourses, enrollments, payments,\nfinance*, academic_structure, ...")]
    end

    PUB --> PAGES
    DASH --> PAGES
    STU --> PAGES
    PAGES --> GUARD
    PAGES --> APICLIENT
    APICLIENT --> PROXY
    PROXY -->|"/api/*"| MW1
    MW1 --> MW2 --> MW3 --> ROUTES
    ROUTES --> LIB
    ROUTES --> DATA
    LIB --> DATA
    DATA --> PG
    PG --> TABLES
```

---

## 3. Backend Module / Route Map

```mermaid
flowchart LR
    subgraph Core["Core Academic"]
        R_STU[students.ts]
        R_PROF[professors.ts]
        R_PW[professor-workspace.ts]
        R_ENR["enrollments.ts\n(~3700 lines, largest)"]
        R_ADMSCH[admin-schedule.ts]
    end
    subgraph Finance["Finance"]
        R_FIN[finance.ts]
        R_PAY[payments.ts]
        R_INC[income.ts]
        R_EXP[expenses.ts]
        R_COUP[coupons.ts]
    end
    subgraph Engagement["Engagement"]
        R_FB[feedback.ts]
        R_Q[questions.ts]
        R_NEWS[news.ts]
    end
    subgraph IAM["Identity & Content"]
        R_USR["users.ts\n(~1700 lines, auth+roles)"]
        R_DASH[dashboard.ts]
        R_SITE[site-content.ts]
        R_HINT[student-hints.ts]
    end
    subgraph OfficeModules["Office / Back-office Modules"]
        R_ADM[admissions.ts]
        R_REG[registrar.ts]
        R_FAC[facilities.ts]
        R_IT[it-admin.ts]
        R_RES[research-office.ts]
        R_SEC[security.ts]
    end

    R_ENR --> R_STU
    R_ENR --> R_PROF
    R_ENR --> R_COUP
    R_FIN --> R_PAY
    R_PW --> R_PROF
    R_ADMSCH --> R_ENR
```

---

## 4. Entity Relationship Diagram (Core Schema)

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "student_id"
    USERS ||--o| PROFESSORS : "professor_id"
    STUDENTS ||--o{ ENROLLMENTS : has
    COURSES ||--o{ ENROLLMENTS : has
    PROFESSORS ||--o{ COURSES : teaches
    COUPONS ||--o{ ENROLLMENTS : discounts
    STUDENTS ||--o{ PAYMENTS : makes
    ENROLLMENTS ||--o{ PAYMENTS : "generates"
    STUDENTS ||--o{ INCOME : "linked (nullable)"
    STUDENTS ||--o{ FEEDBACK : submits
    PROFESSORS ||--o{ FEEDBACK : "receives (nullable)"
    COURSES ||--o{ FEEDBACK : "about (nullable)"
    STUDENTS ||--o{ QUESTIONS : asks
    COURSES ||--o{ QUESTIONS : "regarding"
    PROFESSORS ||--o{ QUESTIONS : answers
    STUDENTS ||--o{ TRANSFER_CREDITS : requests
    STUDENTS ||--o{ TRANSCRIPT_REQUESTS : requests
    STUDENTS ||--o{ GRADUATION_APPROVALS : requests
    STUDENTS ||--o{ SCHOLARSHIP_AWARDS : awarded
    STUDENTS ||--o{ ENROLLMENT_OVERRIDES : "subject of"
    STUDENTS ||--o| STUDENT_PROFILES_EXTRA : extends
    CAMPUSES ||--o{ CLASSES : hosts
    ACADEMIC_STRUCTURE ||--o{ CAMPUSES : "jsonb-embeds"
    ACADEMIC_STRUCTURE ||--o{ DEPARTMENTS_JSON : "jsonb-embeds"
    ACADEMIC_STRUCTURE ||--o{ MAJORS_JSON : "jsonb-embeds"

    USERS {
        uuid id PK
        string username
        string email
        enum role
        jsonb permissions
        uuid student_id FK
        uuid professor_id FK
    }
    STUDENTS {
        uuid id PK
        string display_id
        string first_name
        string last_name
        string program
        string faculty
        int current_semester
        enum status
        numeric balance
        uuid supervisor_id
    }
    PROFESSORS {
        uuid id PK
        string first_name
        string last_name
        string department
        numeric salary
        enum status
    }
    COURSES {
        uuid id PK
        string code UK
        uuid professor_id FK
        string department
        string campus
        int creditHours
        enum courseType "major|common"
        text[] prerequisiteCourseIds
        jsonb schedule
    }
    ENROLLMENTS {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        enum status
        string coupon_code FK
        numeric price
        numeric total
        string letter_grade
        string campus
        string semester
    }
    PAYMENTS {
        uuid id PK
        uuid student_id FK
        uuid enrollment_id FK
        numeric amount
        enum method
        enum type
    }
    COUPONS {
        string code PK
        numeric percent
    }
    FEEDBACK {
        uuid id PK
        uuid student_id FK
        uuid professor_id FK
        uuid course_id FK
        enum type
        int rating
        enum status
    }
    QUESTIONS {
        uuid id PK
        uuid course_id FK
        uuid professor_id FK
        uuid student_id FK
        enum status
    }
```

---

## 5. Auth / Request Lifecycle (Sequence)

```mermaid
sequenceDiagram
    actor U as User (browser)
    participant FE as Next.js Frontend
    participant Proxy as app/api/[...path] (BFF proxy)
    participant MW as Express Middleware Chain
    participant Route as Route Handler
    participant Data as data/collections.ts
    participant DB as Postgres (Supabase)

    U->>FE: Login form submit
    FE->>Proxy: POST /api/users/auth/login
    Proxy->>MW: forward
    MW->>Route: (public path, skips requireAuth)
    Route->>Data: find user by username
    Data->>DB: SELECT
    DB-->>Data: user row
    Route->>Route: bcrypt.compare(password)
    Route-->>FE: JWT (12h) + AuthUser
    FE->>FE: store token (auth-context.tsx)

    Note over U,DB: Subsequent authenticated request
    U->>FE: Navigate to /dashboard/finance
    FE->>FE: dashboard-route-guard.tsx checks role/permission
    FE->>Proxy: GET /api/finance/invoices (Bearer token)
    Proxy->>MW: forward
    MW->>MW: requireAuth: verify JWT -> req.auth
    MW->>MW: enforceMaintenanceMode check
    MW->>Route: next()
    Route->>Route: requirePermission("finance:view")
    Route->>Data: getCollection("financeInvoices").find()
    Data->>DB: SELECT (tolerates 42P01 -> [])
    DB-->>Data: rows
    Data-->>Route: typed results
    Route-->>FE: JSON
    FE-->>U: render
```

---

## 6. Role / Permission Model (Class-ish Diagram)

```mermaid
classDiagram
    class AuthTokenPayload {
        +string userId
        +SystemRole role
        +SystemRole[] secondaryRoles
        +Permission[] permissions
        +string studentId
        +string professorId
    }
    class SystemRole {
        <<enumeration>>
        admin
        super-admin
        supervisor
        student
        professor
        advisor
        teaching-assistant
        registrar
        admissions
        finance
        it-admin
        dean
        hod
        librarian
        student-affairs
        hr
        security
        facilities
        research-office
        user
    }
    class Permission {
        <<string union>>
        students:view/create/edit/delete
        finance:view/manage/approve
        enrollment:view/manage/self/override-*
        audit:view/export
        settings:manage/security/integrations/sso
        VIEW_FINANCIALS
        ADMIN_VIEW_SCHEDULE
        MANAGE_RESOURCES
        ENTER_GRADES
    }
    class CustomRoleTemplate {
        +string baseRole
        +Permission[] overrides
        +AccessProfile accessProfile
    }
    class AccessProfile {
        +bool allowEnrollmentAnytime
        +bool allowFinanceApprovals
        +bool allowAuditExports
    }
    AuthTokenPayload --> SystemRole
    AuthTokenPayload --> Permission
    CustomRoleTemplate --> SystemRole : baseRole
    CustomRoleTemplate --> Permission
    CustomRoleTemplate --> AccessProfile
```

---

## 7. Frontend Route Tree (Component/Deployment view)

```mermaid
flowchart TD
    ROOT["frontend/app/"] --> HOME["page.tsx (landing)"]
    ROOT --> LOGIN["login/"]
    ROOT --> APIRT["api/[...path]/route.ts (proxy)"]
    ROOT --> DASHROOT["dashboard/ (layout + 31 sub-routes)"]
    ROOT --> STUROOT["student/ (14 sub-routes)"]

    DASHROOT --> D1["super-admin, dean, hod"]
    DASHROOT --> D2["registrar, admissions, advisor"]
    DASHROOT --> D3["finance, hr, facilities"]
    DASHROOT --> D4["it-admin, security, research(-office)"]
    DASHROOT --> D5["professor, professors, ta"]
    DASHROOT --> D6["librarian, student-affairs"]
    DASHROOT --> D7["users, audit, report, requests"]
    DASHROOT --> D8["students, students/[studentId]"]
    DASHROOT --> D9["news, feedback, notifications, settings"]
    DASHROOT --> D10["enrollment, grades-requests, applications"]

    STUROOT --> S1["enroll, enrollment-renewal, schedule"]
    STUROOT --> S2["grades, transcript, attendance"]
    STUROOT --> S3["billing, payment-plan"]
    STUROOT --> S4["profile, settings, supervisor, support"]
    STUROOT --> S5["department-courses, document-request, message"]
```

---

## 8. Development Model

Not waterfall. Evidence from repo:
- No phased sign-off docs, no requirements-freeze artifacts.
- `cover.md` (role list) → `Project Overview.md` (6-role MVP) → `users.md`/`test.md` (17–20 role expansion) show **incremental widening of scope after initial build**.
- `db/postgres.ts` explicitly tolerates missing tables (Postgres error 42P01 → return `[]`) — a deliberate "ship UI before schema exists" pattern, i.e. **feature-flag-free incremental/agile delivery**, not upfront full design.
- `missing.md` + `last thing was working on.md` are running gap-lists, characteristic of **iterative/agile sprints**, not waterfall stage-gates.
- `test.md` marks completion **per role as a percentage** ("Student role done 40%") — incremental, not phase-based.

**Closest label: Agile / incremental, feature-branch-by-role, schema-evolves-with-code.** If asked to draw a "waterfall" diagram for a slide anyway, still usable for presentation purposes (Requirements → Design → Implementation → Testing → Deployment → Maintenance) but it would not reflect actual project history — flag this to stakeholders if used.

```mermaid
flowchart LR
    A[Initial 6-role MVP\nProject Overview.md] --> B[Schema authored\ntahasql.md]
    B --> C[Core CRUD routes built\nstudents/professors/courses/enrollments]
    C --> D[Role model expanded\n6 -> 17 -> 20 roles\ncover.md, users.md]
    D --> E[Office modules added\nadmissions/registrar/facilities/it-admin/research/security]
    E --> F[Missing-table resilience pattern\nUI ships ahead of schema]
    F --> G[Gap tracking & seed data\nmissing.md, simulation_seed.sql]
    G --> H[Ongoing polish\nUI fixes, permission scoping, semester/dept TODOs]
    H -.iterate.-> C
```
