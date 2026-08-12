# UNYT System — Feature Inventory

One line per feature: what it is and what it does. Grouped by role/area.

Cross-check against [SCHEMA.md](./SCHEMA.md) before building on a feature listed here — some tables backing these features are flagged dead/scaffold there (unused, generic-shaped leftovers). A feature name existing here doesn't guarantee its table is live-wired; see [TASKS.md](./TASKS.md) for per-component build status.

## Admin — Enrollment & Courses
- **Course catalog management** — Create, edit, delete, duplicate, and search courses by title/code/professor/campus.
- **Bulk course operations** — Bulk CSV import, bulk open/close update, and soft-delete/restore for removed courses (48-hour recovery window).
- **Semester rollover** — Duplicate a filtered set of courses into a new term with shifted dates in one action.
- **Course scheduling** — Set/edit weekly class schedules per course and preview conflicts before saving.
- **Academic structure management** — Maintain departments, majors, and campuses that courses and students are organized under.
- **Global enrollment toggle** — Open/close enrollment platform-wide for all students with one switch.
- **Enrollment lifecycle management** — View, create, edit, and delete individual enrollment records.
- **Enrollment approvals workflow** — Advisor approve/reject, advisor messaging, and payment approve/reject on pending enrollments.
- **Waitlist management** — View the FIFO waitlist queue per course, manually promote a student when a seat opens (capacity-checked), or remove someone from the queue.
- **Room/seat utilization dashboard** — Aggregate fill-rate view across courses, flags underfilled and near-capacity courses by department/campus.
- **Room inventory management** — Canonical room directory with capacity, used to keep "suggest a room" from proposing a room too small for the course.
- **Live room/schedule lookup** — Look up what's booked in a room at a given time and find capacity-aware available rooms for a new booking.
- **Enrollment summary dashboard** — Aggregate stats (totals, pending, capacity) for the enrollment area.
- **Course prerequisite enforcement** — Define required prior courses per course; enforced on self-enrollment and waitlist promotion.
- **Audit log with filters** — Chronological trail of every course/enrollment admin action, filterable by entity type, actor, and date range.

## Admin — Users & Access
- **User account management** — Create, edit, delete, and list all portal user accounts across every role.
- **Password administration** — Admin-forced password resets and self-service password changes.
- **Login/authentication** — Central login endpoint issuing auth tokens.
- **Role & permission matrix** — Fine-grained permission toggles across Identity, Academics, Enrollment, Operations, and Security categories.
- **Custom role templates** — Create, edit, and delete reusable custom role definitions bundling permission sets.
- **Per-user notifications view** — Inspect notification history/queue for a specific user.

## Admin — Finance
- **Invoice generation & billing** — Create and list student invoices/charges.
- **Payment confirmation** — Confirm incoming/pending payment transactions.
- **Refund processing** — Submit and approve refund requests.
- **Installment plans** — Set up and track multi-installment payment plans per student.
- **Sponsorship tracking** — Record and monitor sponsor-funded student payments.
- **Unpaid balance & collections tracking** — Surface overdue/unpaid student balances.
- **Financial reporting** — Consolidated revenue/expense summary reports.
- **Staff purchase/fund requests** — Non-finance staff submit budget/equipment purchase requests routed to finance.
- **Income & expense ledgers** — Record and manage discrete income and expense line items.
- **Coupon/discount codes** — Create percentage-based discount coupons for tuition/fees.

## Admin — Facilities
- **Room booking management** — Request, approve, edit, and cancel room bookings.
- **Maintenance request tracking** — Log and resolve classroom/facility maintenance tickets.
- **Equipment request tracking** — Log and fulfill equipment provisioning requests.

## Admin — Communications
- **News & announcements publishing** — Create, edit, delete, and list institutional news/announcements.
- **Public site content management** — Edit the public-facing marketing/site content shown outside the portal.
- **In-app notifications feed** — Central notification stream aggregating system events for the logged-in user.

## Admin — Feedback & Support
- **Feedback queue management** — View, respond to, and resolve feedback/support submissions from any role.
- **Student Q&A inbox** — Students submit questions; professors/admins reply; separate admin and professor views.
- **Contextual student hints** — Serve field/program-specific guidance tips to students based on their program.

## Admin — Reporting & System
- **System analysis report** — Multi-section report: system overview, enrollment snapshot, financial summary, course profitability, professor revenue.
- **Audit trail / activity stream** — Chronological log of administrative actions across the platform.
- **Terminal / module toggles** — Enable/disable individual dashboard modules platform-wide.
- **Dashboard KPIs** — Aggregate overview stats for the main landing dashboard.
- **Maintenance mode** — Toggle platform-wide maintenance mode with a custom message shown to users.

## IT Admin
- **SSO configuration** — Create, edit, and delete identity-provider/SSO connection settings.
- **Third-party integrations** — Manage external API/email/SMS integration connections.
- **Device/session logs** — View device and login activity logs for security monitoring.
- **Maintenance mode control** — Same maintenance-mode switch, owned by the IT admin role.

## Security
- **Visitor log tracking** — Record and review campus visitor entries.
- **Incident reporting** — Log, edit, and resolve security incident reports.
- **ID card access control** — Manage and audit ID-card-based access records.

## Admissions
- **Scholarship award management** — Create, edit, delete scholarship awards tied to applicants.
- **Interview scheduling** — Schedule, edit, and cancel applicant interviews.
- **Offer letter management** — Generate, edit, and revoke admission offer letters/decisions.
- **Applications inbox** — Review the incoming applicant pipeline and process approve/reject/waitlist decisions.

## Registrar
- **Enrollment override handling** — Manually override enrollment rules/exceptions for edge cases.
- **Transfer credit evaluation** — Record and approve transfer credits from other institutions.
- **Transcript request processing** — Manage the student transcript request queue.
- **Graduation approval workflow** — Review and finalize graduation approvals per student.

## Research Office
- **Research grant tracking** — Create, edit, and delete grant records.
- **Publication tracking** — Log and manage faculty publication outputs.
- **Research request approvals** — Review and process research-related request submissions.

## Professor
- **Teaching dashboard** — Unified workspace: Overview, Materials, Coursework, Communication, Attendance tabs.
- **Course roster management** — View assigned courses and enrolled student rosters.
- **Weekly timetable & mock-class planner** — View weekly schedule; plan mock/practice class sessions with availability windows.
- **Course material uploads** — Upload syllabus, slides, and PDF materials; manage saved files.
- **Assignment & quiz creation** — Create and manage coursework assignments and quizzes.
- **Grade submission & marks publishing** — Enter and submit grades per enrollment, then publish finalized marks to students.
- **Student Q&A / messaging** — Respond to student questions, send direct messages, post announcements, schedule office hours.
- **Attendance management & analytics** — Take attendance per session, view saved sessions, see pass/fail and engagement analytics.
- **Finance request submission** — Submit purchase/fund requests to finance from the teaching dashboard.
- **Student requests inbox** — Review and act on student-submitted requests directed to professors.

## Advisor
- **Assigned student roster** — View list of advisees under the advisor's scope.
- **Enrollment approval queue** — Approve or reject pending course enrollment requests for advisees.
- **GPA/progress monitoring** — Track completion, grades, and graduation progress trends for advisees.
- **Advising notes** — Record advising notes and recommendations per student.

## Grades Requests (cross-role)
- **Grade change/dispute requests** — Students or staff submit grade correction requests; professors/registrar review a shared queue.

## Student
- **Course enrollment (self-service)** — Browse available classes, select classes, submit for advisor approval.
- **Enrollment renewal** — Renew enrollment for a new term.
- **Department course browsing** — View department-specific course catalog.
- **My grades / transcript** — View current grades and download/print an official transcript (CSV/PDF export).
- **Weekly schedule/timetable** — View personal class timetable.
- **Attendance view** — See attendance records for active enrolled courses.
- **Billing & account balance** — View balance and payment history, make payments, track payment plans.
- **Profile & settings** — Edit personal information and change password.
- **Supervisor/advisor info** — View assigned academic supervisor/advisor details.
- **Support & document requests** — Contact admin/supervisor/professor; submit and track document requests (transcripts, letters).
- **Student self Q&A** — Submit questions to professors and view replies.

## Shared / Cross-Cutting
- **Role-based workspace dashboards** — Each staff role (Dean, HOD, HR, Librarian, Student Affairs, Super Admin, Security, Facilities, Research Office, IT Admin, Registrar, Admissions, Finance, TA, Advisor) gets a dynamic dashboard of feature tiles bound to live data.
- **Student record detail view (admin)** — Drill into one student's academic snapshot, current courses, enrollment history, and payment history.
- **Full student directory (admin)** — Searchable table of all students.
- **Full professor directory (admin)** — Searchable table of all professors.

---

*Some frontend routes are aliases of another page (e.g. enrollment-renewal → enroll, document-request/message → support, payment-plan → billing, transcript → grades) — listed once above as the underlying feature, not duplicated per URL.*

