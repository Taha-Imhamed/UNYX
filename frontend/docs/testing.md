# Testing & QA

## Strategy
- **API integration (recommended):** supertest against a test Mongo database that contains representative production data. No mock or seed fixtures should be relied on.
- **Smoke API checks:** health endpoint; auth-required route denies without token; happy-path CRUD on key entities.
- **Manual UI smoke:** dashboard, students, enrollments, finance pages render using live database records.

## Critical API endpoints to cover
1) POST /api/enrollments — creates an enrollment, records a debit transaction, updates student balance.
2) POST /api/students/:id/payments — credits balance; returns updated balance and transaction.
3) GET /api/dashboard/overview — returns stats and recent lists (ensures aggregations work).

## Example test cases (supertest style)
- **Enrollment creation**
  - Arrange: prepare a test database with at least one student and course.
  - Act: POST /api/enrollments with studentId, courseId.
  - Assert: 201; enrollment status pending/active; payment transaction exists with type=debit; student balance increased.
- **Payment credit**
  - Arrange: student with outstanding balance in the database.
  - Act: POST /api/students/:id/payments with amount > 0, method=card.
  - Assert: 201; transaction type=credit; student balance decreases and not below 0.
- **Dashboard overview**
  - Act: GET /api/dashboard/overview.
  - Assert: 200; stats fields present; recent arrays reflect stored data.

## Evidence to capture
- Test command output (screenshots or logs) attached to PRs or issues.
- PR checklist: tests run, lint run, screenshots for UI changes.

### API Integration (live data)
- Tooling: jest + supertest; uses real Supabase/Postgres data (no mocks).
- Auth: log in with a real admin account configured in the database to obtain JWT for calls.
- Covered endpoints:
  - POST /api/enrollments — expects 201 and created enrollment tied to an existing student/course.
  - POST /api/students/:id/payments — expects 201 and credit transaction for the targeted student.
  - GET /api/dashboard/overview — expects 200 with stats fields (e.g., totalStudents, totalIncome, netIncome).
- Teardown: reset the database between test runs using database scripts or snapshots instead of seed data.
