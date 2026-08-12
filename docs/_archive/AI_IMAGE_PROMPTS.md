# AI Image-Gen Prompts — UNYT System Diagrams

Each prompt below independent. Paste one at a time into Claude or ChatGPT (image-capable) to get one diagram picture. No prompt depends on another.

---

## Prompt 1 — High-Level System Architecture

```
Create a clean, professional software architecture diagram (like a technical whitepaper illustration, flat design, blue/gray/white color scheme, rounded rectangles, clear arrows) titled "UNYT System Architecture".

Show 3 horizontal layers top to bottom:

LAYER 1 - "Client Browser": three boxes side by side: "Public Site (Home/About/Admissions/Campus/Contact)", "Dashboard Portal (31 role-based routes)", "Student Portal (14 self-service routes)".

LAYER 2 - "Frontend: Next.js 16 App Router (deployed on Vercel)": contains 4 boxes: "App Pages & Layouts", "API Client Libraries + Auth Context", "BFF Proxy: /api/[...path]/route.ts", "Client-side Route Guard (RBAC)".

LAYER 3 - "Backend: Express REST API (Node.js/TypeScript)": show a horizontal pipeline of middleware boxes: "CORS" -> "JWT Auth Check" -> "Maintenance Mode Gate" -> "22 Route Modules" -> then branching down to two boxes: "Business Logic Lib (compliance, transcripts, course assignment)" and "Data Access Layer (~31 collection accessors)".

LAYER 4 (bottom) - "PostgreSQL Database (Supabase-hosted)": one large box labeled "~35 tables: users, students, professors, courses, enrollments, payments, finance, academic_structure, etc." with a small note "Custom ORM-lite layer maps camelCase <-> snake_case, tolerates missing tables gracefully".

Draw arrows flowing top to bottom showing request flow, and a dashed arrow flowing bottom to top labeled "JSON response". Use a legend box in the corner explaining box colors (Frontend = blue, Backend = green, Database = orange). Style: enterprise software documentation, isometric or flat 2D, no photorealism, no people, plenty of whitespace, sans-serif labels.
```

---

## Prompt 2 — Entity Relationship Diagram (Database Schema)

```
Create a clean entity-relationship (ER) diagram in flat technical-documentation style (like a database design document), white background, thin black connector lines, boxes with a header bar and rows listing fields.

Central entity: "USERS" (fields: id PK, username, email, role enum, permissions jsonb, student_id FK, professor_id FK).

Connect USERS with a 1-to-0/1 line to "STUDENTS" (fields: id PK, display_id, first_name, last_name, program, faculty, current_semester, status enum, balance, supervisor_id).

Connect USERS with a 1-to-0/1 line to "PROFESSORS" (fields: id PK, first_name, last_name, department, salary, status enum).

Connect STUDENTS with a 1-to-many line to "ENROLLMENTS" (fields: id PK, student_id FK, course_id FK, status enum, coupon_code FK, price, total, letter_grade, campus, semester).

Connect "COURSES" (fields: id PK, code unique, professor_id FK, department, campus, creditHours, courseType enum major/common, prerequisiteCourseIds array) with a many-to-1 line to PROFESSORS, and a 1-to-many line to ENROLLMENTS.

Connect "COUPONS" (fields: code PK, percent) with a 1-to-many line to ENROLLMENTS.

Connect STUDENTS with 1-to-many lines to four more boxes: "PAYMENTS" (id, student_id FK, enrollment_id FK, amount, method enum, type enum), "FEEDBACK" (id, student_id FK, professor_id FK, course_id FK, type enum, rating, status enum), "QUESTIONS" (id, course_id FK, professor_id FK, student_id FK, status enum), and "STUDENT_PROFILES_EXTRA" (student_id PK, year_level, advisor_id, scholarship_status).

Add a small cluster on the right side: "CAMPUSES" 1-to-many "CLASSES", both loosely connected with a dashed line labeled "jsonb-embedded, partially normalized" to a box "ACADEMIC_STRUCTURE (singleton: departments, campuses, majors)".

Use crow's-foot notation for relationship lines. Label each relationship line with cardinality. Style: precise, database-textbook diagram, no color gradients, black text, light gray box headers.
```

---

## Prompt 3 — Backend Route/Module Map

```
Create a flat 2D node-graph diagram, professional software documentation style, grouping colored clusters connected by arrows, titled "UNYT Backend Route Modules".

Create 5 rounded-rectangle cluster groups, each a different pastel background color, arranged in a grid:

Cluster 1 "Core Academic" (light blue): nodes "students.ts", "professors.ts", "professor-workspace.ts", "enrollments.ts (largest, ~3700 lines)", "admin-schedule.ts".

Cluster 2 "Finance" (light green): nodes "finance.ts", "payments.ts", "income.ts", "expenses.ts", "coupons.ts".

Cluster 3 "Engagement" (light yellow): nodes "feedback.ts", "questions.ts", "news.ts".

Cluster 4 "Identity & Content" (light purple): nodes "users.ts (~1700 lines, auth+roles)", "dashboard.ts", "site-content.ts", "student-hints.ts".

Cluster 5 "Back-office Modules" (light orange): nodes "admissions.ts", "registrar.ts", "facilities.ts", "it-admin.ts", "research-office.ts", "security.ts".

Draw arrows: "enrollments.ts" -> "students.ts", "enrollments.ts" -> "professors.ts", "enrollments.ts" -> "coupons.ts", "finance.ts" -> "payments.ts", "professor-workspace.ts" -> "professors.ts", "admin-schedule.ts" -> "enrollments.ts". Each node styled as small rounded box with monospace filename font. Add subtitle text at top: "No MVC layering — each route file handles its own request logic directly (fat-route pattern)". Style: clean architecture diagram, minimal shadows, sans-serif cluster titles, monospace node labels.
```

---

## Prompt 4 — Auth & Request Lifecycle (Sequence Diagram)

```
Create a UML sequence diagram in classic technical style: vertical lifelines with actor/participant boxes at top, horizontal arrows for messages, activation bars, white background, black lines, small readable sans-serif labels.

Participants left to right: "User (Browser)", "Next.js Frontend", "BFF Proxy (/api/[...path])", "Express Middleware Chain", "Route Handler", "Data Access Layer", "Postgres DB (Supabase)".

Sequence part 1 - Login:
1. User -> Frontend: "Submit login form"
2. Frontend -> Proxy: "POST /api/users/auth/login"
3. Proxy -> Middleware: "forward request"
4. Middleware -> Route Handler: "public path, skip auth check"
5. Route Handler -> Data Layer: "find user by username"
6. Data Layer -> DB: "SELECT query"
7. DB --> Data Layer: "user row (dashed return arrow)"
8. Route Handler -> Route Handler: "self-message: bcrypt.compare(password)"
9. Route Handler --> Frontend: "dashed return: JWT token (12h expiry) + user profile"

Add a horizontal divider line labeled "Later: Authenticated Request".

Sequence part 2 - Authenticated call:
10. User -> Frontend: "Navigate to /dashboard/finance"
11. Frontend -> Frontend: "self-message: route guard checks role/permission"
12. Frontend -> Proxy: "GET /api/finance/invoices, Authorization: Bearer token"
13. Proxy -> Middleware: "forward"
14. Middleware -> Middleware: "self-message: verify JWT signature"
15. Middleware -> Middleware: "self-message: check maintenance mode flag"
16. Middleware -> Route Handler: "next()"
17. Route Handler -> Route Handler: "self-message: check permission finance:view"
18. Route Handler -> Data Layer: "query finance invoices collection"
19. Data Layer -> DB: "SELECT (returns empty array if table missing, no crash)"
20. DB --> Data Layer: "dashed return: rows"
21. Data Layer --> Route Handler: "dashed return: typed results"
22. Route Handler --> Frontend: "dashed return: JSON response"
23. Frontend --> User: "dashed return: rendered page"

Style: precise UML 2.0 sequence diagram notation, activation bars as thin vertical rectangles on each lifeline during processing, solid arrows for calls, dashed arrows for returns.
```

---

## Prompt 5 — Role & Permission Model (UML Class Diagram)

```
Create a UML class diagram, standard notation (rectangles divided into 3 sections: class name, attributes, methods), white background, black lines, connecting lines with UML relationship arrows (association, composition).

Class 1 "AuthTokenPayload": attributes userId: string, role: SystemRole, secondaryRoles: SystemRole[], permissions: Permission[], studentId: string, professorId: string.

Class 2 "SystemRole" drawn as an enumeration stereotype box (<<enumeration>>) listing 20 values stacked: admin, super-admin, supervisor, student, professor, advisor, teaching-assistant, registrar, admissions, finance, it-admin, dean, hod, librarian, student-affairs, hr, security, facilities, research-office, user.

Class 3 "Permission" drawn as a stereotype box (<<string union type>>) listing sample values: students:view/create/edit/delete, finance:view/manage/approve, enrollment:view/manage/self, audit:view/export, settings:manage/security/sso, VIEW_FINANCIALS, ADMIN_VIEW_SCHEDULE, ENTER_GRADES.

Class 4 "CustomRoleTemplate": attributes baseRole: SystemRole, overrides: Permission[], accessProfile: AccessProfile.

Class 5 "AccessProfile": attributes allowEnrollmentAnytime: boolean, allowFinanceApprovals: boolean, allowAuditExports: boolean.

Draw a solid line with open arrowhead (association) from AuthTokenPayload to SystemRole labeled "role". Draw association from AuthTokenPayload to Permission labeled "grants". Draw association from CustomRoleTemplate to SystemRole labeled "baseRole". Draw composition (filled diamond) from CustomRoleTemplate to AccessProfile labeled "has". Draw association from CustomRoleTemplate to Permission labeled "overrides".

Style: rigorous UML class diagram per OMG spec, three-compartment class boxes, italic for abstract/enum stereotypes, clean sans-serif font, no color (black and white, or very light gray fills only).
```

---

## Prompt 6 — Frontend Route Tree (Sitemap Diagram)

```
Create a hierarchical tree / sitemap diagram, flat design, rounded boxes, top-down tree layout, professional UX-documentation style, blue and teal color palette.

Root node at top: "frontend/app/" (dark blue).

Root branches into 5 children: "page.tsx (public landing)", "login/", "api/[...path]/route.ts (BFF proxy)", "dashboard/ (31 routes)", "student/ (14 routes)".

Under "dashboard/", branch into 10 sub-groups shown as small clustered boxes:
- "super-admin, dean, hod"
- "registrar, admissions, advisor"
- "finance, hr, facilities"
- "it-admin, security, research-office"
- "professor, professors, ta"
- "librarian, student-affairs"
- "users, audit, report, requests"
- "students, students/[studentId]"
- "news, feedback, notifications, settings"
- "enrollment, grades-requests, applications"

Under "student/", branch into 5 sub-groups:
- "enroll, enrollment-renewal, schedule"
- "grades, transcript, attendance"
- "billing, payment-plan"
- "profile, settings, supervisor, support"
- "department-courses, document-request, message"

Use lighter teal boxes for dashboard leaf nodes and lighter blue boxes for student-portal leaf nodes so the two portal trees are visually distinguishable at a glance. Add small icons: a shield icon next to "dashboard/" (admin-heavy), a graduation-cap icon next to "student/". Style: clean org-chart / sitemap style, plenty of spacing, sans-serif labels, no photorealistic elements.
```

---

## Prompt 7 — Development Model / Project Evolution Timeline

```
Create a horizontal timeline / flowchart diagram, flat design, left-to-right arrows connecting 8 milestone boxes, professional project-management style (like a product roadmap slide), color gradient from light to dark blue as it progresses left to right.

Milestones in order:
1. "Initial 6-role MVP defined (Project Overview.md)"
2. "Core database schema authored (tahasql.md)"
3. "Core CRUD routes built: students, professors, courses, enrollments"
4. "Role model expanded 6 -> 17 -> 20 roles (cover.md, users.md)"
5. "Back-office modules added: admissions, registrar, facilities, IT admin, research office, security"
6. "Missing-table resilience pattern introduced — UI ships ahead of schema"
7. "Gap tracking & simulation seed data (missing.md, simulation_seed.sql)"
8. "Ongoing polish: UI fixes, permission scoping, semester/department structuring"

Draw a curved dashed arrow looping from milestone 8 back to milestone 3, labeled "iterate" — to visually indicate this is an agile/incremental cycle, NOT a strict linear waterfall.

Add a caption banner at the top: "UNYT Development Model: Agile / Incremental — NOT Waterfall. Schema evolved alongside code; roles and modules were added iteratively rather than fully specified upfront."

Style: modern roadmap infographic, rounded milestone boxes, connecting arrows with small circle markers, clean sans-serif typography, subtle drop shadows only, no photographic elements.
```

---

## Usage Notes

- Prompts 1–6 are structural/technical diagrams — best results from a model with strong diagram/schematic generation.
- Prompt 7 is more infographic-style — works well with either tool.
- If a tool struggles with dense text-heavy diagrams, split any prompt's cluster into 2 separate prompts (ask for "just the Core Academic and Finance clusters" etc.) and stitch manually.
- These are also editable as Mermaid — see `ARCHITECTURE.md` in this repo for live-editable diagram source (paste into https://mermaid.live or any Mermaid-compatible renderer for accurate diagrams instead of AI image generation, since Mermaid renders precise diagrams while AI image models may distort text/arrows).
