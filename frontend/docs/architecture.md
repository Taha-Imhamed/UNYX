# Architecture

## Overview
- **Frontend:** Next.js (app router) consuming backend REST APIs; shared UI components and hooks.
- **Backend:** Express (Node) with a Supabase/Postgres adapter; routes for students, enrollments, payments, income, expenses, feedback, news, users, dashboard.
- **Auth:** JWT-based authentication; tokens issued at login and validated by middleware; role-based checks for admin-only endpoints (e.g., payments listing, course mutations).
- **Data:** Supabase tables for students, enrollments, courses, payments, income, expenses, feedback, professors, users, and notifications.

## Diagram (textual)
```
[Browser/Next.js] --> REST calls --> [Express API] --> [Supabase/Postgres]
    |                                  ^
    |-- Auth token ---------------------|

Enrollment/payment flow: enrollment route records a debit -> updates student balance; payments route records credits.
Dashboard aggregations read income/expenses/enrollments/students.
```

## Key Modules
- Backend routing: students, enrollments, payments, income, expenses, dashboard, feedback, news, professors, users.
- Data access: collection helpers backed by Supabase/Postgres; all data is sourced directly from the database without bundled seeds or mocks.
- Frontend pages: dashboard overview, students, enrollments, finance, login.

## Deployment assumptions
- Single-instance Node server with Supabase/Postgres reachable via `SUPABASE_DB_URL`/`DATABASE_URL` env vars.
- Frontend and backend can be served together via Next.js custom routes or separately behind a reverse proxy.
