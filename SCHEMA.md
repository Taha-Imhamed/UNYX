# UNYT System — Live Schema Reference (generated)

Generated 2026-08-10 directly from the live Supabase Postgres DB via information_schema introspection. This is ground truth — ARCHITECTURE.md's ERD is illustrative/core-only and undercounted the real table set (~35 claimed vs **149 actual**).

## Table count by domain

| Domain | Tables |
|---|---|
| Core Academic | 18 |
| Users / IAM | 11 |
| Enrollment / Registration | 3 |
| Finance | 20 |
| Admissions | 9 |
| Registrar | 6 |
| Advising | 5 |
| Professor / TA workspace | 12 |
| HR | 5 |
| Library | 9 |
| Facilities / Ops | 8 |
| Research Office | 4 |
| Security / IT | 14 |
| Student Affairs / Campus Life | 9 |
| Engagement | 5 |
| Reporting / Audit | 5 |
| Faculty budget | 1 |
| Misc / system | 5 |
| Public site | 1 |
| **Total** | **149** |

## Full table reference

### Core Academic

**academic_structure** (rows: ~0, pk: id)
- columns: id:text, enrollment_open:boolean, enrollment_message?:text, departments:jsonb, majors:jsonb, updated_at:timestamp with time zone, campuses:jsonb

**academic_terms** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**campuses** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone, name?:text

**classes** (rows: ~0, pk: id)
- columns: id:text, campus_id:text, name:text, created_at:timestamp with time zone, updated_at:timestamp with time zone
- fks: campus_id->campuses.id

**classroom_schedules** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**classrooms** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**course_approval_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**course_materials** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**course_reviews** (rows: ~0, pk: id)
- columns: id:text, course_id:text, course_title:text, professor_id?:text, professor_name?:text, student_id:text, rating:integer, difficulty?:integer, comment?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**courses** (rows: ~0, pk: id)
- columns: id:text, display_id:text, title:text, code:text, professor_id:text, professor_name:text, section_id?:text, capacity:integer, start_date:timestamp with time zone, end_date:timestamp with time zone, price:numeric, department?:text, branch?:text, location?:text, schedule?:jsonb, eligible_programs?:ARRAY, eligible_faculties?:ARRAY, eligible_semesters?:ARRAY, enrollment_open:boolean, enrollment_opens_at?:timestamp with time zone, enrollment_closes_at?:timestamp with time zone, enrollment_open_at?:timestamp with time zone, enrollment_close_at?:timestamp with time zone, enrollment_status_note?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone, prerequisite_course_ids?:jsonb, credit_hours?:numeric
- fks: professor_id->professors.id

**departments** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**enrollments** (rows: ~0, pk: id)
- columns: id:text, display_id:text, student_id:text, course_id:text, course_title:text, professor_id:text, professor_name:text, status:USER-DEFINED, start_date:timestamp with time zone, end_date:timestamp with time zone, price:numeric, base_price?:numeric, coupon_code?:text, discount_percent?:numeric, discount_amount?:numeric, created_at:timestamp with time zone, updated_at:timestamp with time zone, grade?:text, grade_midterm?:numeric, grade_final?:numeric, grade_project?:numeric, grade_participation?:numeric, grade_total?:numeric, letter_grade?:text, semester?:text, tuition_charged:boolean, charged_at?:timestamp with time zone, payment_verified:boolean, approved_by_user_id?:text, approved_by_name?:text, approved_by_role?:USER-DEFINED, approved_at?:timestamp with time zone, rejected_by_user_id?:text, rejected_by_name?:text, rejected_by_role?:USER-DEFINED, rejected_at?:timestamp with time zone, course_schedule?:jsonb, course_code?:text, course_branch?:text, auto_assigned_base_course?:boolean, updated_by_user_id?:text, updated_by_name?:text, updated_by_role?:text, deleted_at?:timestamp with time zone
- fks: course_id->courses.id, student_id->students.id, professor_id->professors.id, coupon_code->coupons.code

**grade_change_audit** (rows: ~0, pk: id)
- columns: id:text, enrollment_id:text, student_id:text, course_id:text, actor_user_id?:text, actor_username?:text, before_state:jsonb, after_state:jsonb, created_at:timestamp with time zone

**gradebook_entries** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**late_penalties** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**professors** (rows: ~0, pk: id)
- columns: id:text, first_name:text, last_name:text, email:text, phone:text, photo:text, department:text, salary:numeric, hire_date:timestamp with time zone, specialization:text, status:USER-DEFINED, created_at:timestamp with time zone, updated_at:timestamp with time zone

**students** (rows: ~0, pk: id)
- columns: id:text, display_id:text, first_name:text, last_name:text, email:text, phone:text, photo:text, enrollment_date:timestamp with time zone, program:text, program_id?:text, faculty?:text, faculty_id?:text, current_semester?:text, status:USER-DEFINED, address:text, date_of_birth?:date, balance:numeric, supervisor_id?:text, supervisor_name?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone, year_level?:text, advisor_id?:text, advisor_name?:text, professor_id?:text, professor_name?:text, scholarship_status?:text, payment_status?:text, registration_hold?:boolean, tuition_balance?:numeric, middle_name?:text, major?:text, gender?:text, nationality?:text, national_id?:text, passport_number?:text, blood_type?:text, city?:text, postal_code?:text, emergency_contact_name?:text, emergency_contact_phone?:text, mother_name?:text, father_name?:text, deleted_at?:timestamp with time zone

**teaching_loads** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Users / IAM

**api_clients** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**custom_roles** (rows: ~0, pk: id)
- columns: id:text, name:text, description?:text, base_role:text, permissions:jsonb, access_profile:jsonb, created_at:timestamp with time zone, updated_at:timestamp with time zone

**login_devices** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**password_reset_audit** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**role_permissions** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**sso_config** (rows: ~0, pk: id)
- columns: id:text, provider:text, client_id:text, issuer_url:text, enabled:boolean, updated_at:timestamp with time zone

**sso_providers** (rows: ~0, pk: id,id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**user_feature_overrides** (rows: ~0, pk: id)
- columns: id:text, user_id:text, module_key:text, feature_key:text, state:text, created_at:timestamp with time zone, created_by?:text

**user_permissions** (rows: ~0, pk: id)
- columns: id:bigint, user_id:text, permission_key:text, allowed:boolean, created_at:timestamp with time zone, updated_at:timestamp with time zone

**user_role_history** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**users** (rows: ~0, pk: id,id)
- columns: id:text, username:text, normalized_username:text, email:text, role:USER-DEFINED, created_at:timestamp with time zone, last_login:timestamp with time zone, status:USER-DEFINED, avatar_url?:text, password:text, permissions:jsonb, student_id?:text, professor_id?:text, full_name?:text, phone?:text, department?:text, year_level?:text, advisor_id?:text, advisor_name?:text, professor_name?:text, custom_role_id?:text, custom_role_name?:text, access_profile:jsonb, secondary_roles:jsonb, deleted_at?:timestamp with time zone, mfa_enabled:boolean, mfa_secret?:text
- fks: student_id->students.id, professor_id->professors.id

### Enrollment / Registration

**coupons** (rows: ~0, pk: code)
- columns: code:text, percent:numeric, created_at:timestamp with time zone

**enrollment_overrides** (rows: ~0, pk: id)
- columns: id:text, student_id:text, course_id:text, reason?:text, approved_by?:text, created_at:timestamp with time zone, status:text

**registration_state** (rows: ~0, pk: id)
- columns: id:text, is_open:boolean, blocked_reason?:text, updated_at:timestamp with time zone, updated_by?:text

### Finance

**expenses** (rows: ~0, pk: id)
- columns: id:text, category:text, description:text, amount:numeric, date:timestamp with time zone, approved_by:text, status:USER-DEFINED

**fee_invoice_items** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**fee_invoices** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**finance_installment_plans** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, title:text, total_amount:numeric, installment_count:integer, amount_per_installment:numeric, paid_amount:numeric, remaining_balance:numeric, start_date:text, next_due_date:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**finance_invoices** (rows: ~0, pk: id)
- columns: id:text, invoice_number:text, student_id:text, student_name:text, student_display_id?:text, title:text, semester?:text, issue_date:text, due_date:text, status:text, subtotal:numeric, total:numeric, paid_amount:numeric, balance_due:numeric, currency:text, notes?:text, line_items:jsonb, created_by?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**finance_refund_requests** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, invoice_id?:text, invoice_number?:text, amount:numeric, reason:text, requested_at:timestamp with time zone, status:text, approved_at?:timestamp with time zone, approved_by?:text, notes?:text

**finance_requests** (rows: ~0, pk: id)
- columns: id:text, request_number:text, requester_id:text, requester_name:text, requester_role:text, department?:text, request_type:text, title:text, item_name:text, amount:numeric, urgency:text, justification:text, vendor_name?:text, notes?:text, status:text, handled_at?:timestamp with time zone, handled_by?:text, finance_notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**finance_sponsorships** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, sponsor_name:text, sponsor_type:text, coverage_type:text, coverage_value:numeric, applied_amount:numeric, status:text, start_date:text, end_date?:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**financial_holds** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, student_display_id?:text, reason:text, balance_at_hold:numeric, status:text, created_at:timestamp with time zone, released_at?:timestamp with time zone, released_by?:text

**financial_ledger** (rows: ~0, pk: id)
- columns: id:text, student_id:text, amount:numeric, entry_type:text, source:text, note?:text, payment_id?:text, enrollment_id?:text, invoice_id?:text, created_at:timestamp with time zone, created_by_user_id?:text, created_by_name?:text, metadata:jsonb

**financial_reports** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**income** (rows: ~0, pk: id)
- columns: id:text, source:text, description:text, amount:numeric, date:timestamp with time zone, student_id?:text
- fks: student_id->students.id

**installment_payments** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**installment_plans** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**payments** (rows: ~0, pk: id)
- columns: id:text, display_id:text, student_id:text, amount:numeric, method:USER-DEFINED, note?:text, created_at:timestamp with time zone, type:USER-DEFINED, source:USER-DEFINED, reference_id?:text, enrollment_id?:text, course_id?:text, course_title?:text, balance_after?:numeric, invoice_id?:text, finance_status?:text, confirmed_at?:timestamp with time zone, confirmed_by?:text, confirmation_note?:text, deleted_at?:timestamp with time zone
- fks: enrollment_id->enrollments.id, student_id->students.id, course_id->courses.id

**payroll_entries** (rows: ~0, pk: id)
- columns: id:text, staff_id:text, staff_name:text, pay_period:text, amount:numeric, status:text, paid_at?:timestamp with time zone, notes?:text, created_at:timestamp with time zone

**payroll_items** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**payroll_runs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**refund_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**sponsorships** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Admissions

**admissions_scholarships** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**application_documents** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**applications** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**entrance_exam_results** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**interview_schedules** (rows: ~0, pk: id)
- columns: id:text, applicant_name:text, program:text, interviewer?:text, scheduled_at?:timestamp with time zone, status:text, notes?:text

**interviews** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**offer_letters** (rows: ~0, pk: id)
- columns: id:text, applicant_name:text, program:text, issued_at?:timestamp with time zone, status:text, expiration_date?:timestamp with time zone, notes?:text

**scholarship_awards** (rows: ~0, pk: id)
- columns: id:text, student_id:text, scholarship_name:text, amount:numeric, awarded_by?:text, awarded_at?:timestamp with time zone, status:text, notes?:text

**student_scholarships** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Registrar

**graduation_approvals** (rows: ~0, pk: id)
- columns: id:text, student_id:text, program:text, approved_by?:text, approved_at?:timestamp with time zone, status:text, remarks?:text

**graduation_eligibility_checks** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**student_documents** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**student_record_changes** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**transcript_requests** (rows: ~0, pk: id)
- columns: id:text, student_id:text, requested_at:timestamp with time zone, delivery_method:text, status:text, notes?:text

**transfer_credits** (rows: ~0, pk: id)
- columns: id:text, student_id:text, source_institution:text, course_title:text, credit_hours:integer, evaluated_by?:text, evaluated_at?:timestamp with time zone, status:text

### Advising

**advising_appointments** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, advisor_id:text, advisor_name:text, scheduled_at:timestamp with time zone, duration_minutes:integer, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**advisor_meetings** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**advisor_notes** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**advisor_risk_alerts** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**advisor_student_assignments** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Professor / TA workspace

**assignment_submissions** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**assignments** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**attendance_records** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**attendance_sessions** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**homework_grading_tasks** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**professor_workspaces** (rows: ~0, pk: id)
- columns: id:text, professor_id:text, course_id:text, materials:jsonb, assignments:jsonb, quizzes:jsonb, attendance_sessions:jsonb, messages:jsonb, announcements:jsonb, office_hours:jsonb, mark_publications:jsonb, updated_at:timestamp with time zone

**quiz_attempt_answers** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**quiz_attempts** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**quiz_questions** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**quizzes** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**ta_student_support_sessions** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**teaching_assistant_assignments** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### HR

**employee_leave_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**leave_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**staff_contracts** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**staff_performance_reviews** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**staff_records** (rows: ~0, pk: id)
- columns: id:text, first_name:text, last_name:text, email:text, department?:text, position?:text, employment_status:text, hire_date?:timestamp with time zone, salary?:numeric, phone?:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Library

**book_copies** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**book_loans** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**book_reservations** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**books** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**ebooks** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**journals** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**library_books** (rows: ~0, pk: id)
- columns: id:text, title:text, author:text, isbn?:text, category?:text, total_copies:integer, available_copies:integer, created_at:timestamp with time zone, updated_at:timestamp with time zone

**library_fines** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**library_loans** (rows: ~0, pk: id)
- columns: id:text, book_id:text, book_title:text, borrower_name:text, borrower_type:text, borrowed_at:timestamp with time zone, due_at:timestamp with time zone, returned_at?:timestamp with time zone, status:text, created_at:timestamp with time zone

### Facilities / Ops

**equipment_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**housing_assignments** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, building_name:text, room_number:text, bed_number?:text, status:text, start_date:timestamp with time zone, end_date?:timestamp with time zone, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**maintenance_mode** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**maintenance_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**maintenance_state** (rows: ~0, pk: id)
- columns: id:text, enabled:boolean, message?:text, updated_at:timestamp with time zone, updated_by?:text

**maintenance_windows** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**meal_plans** (rows: ~0, pk: id)
- columns: id:text, student_id:text, student_name:text, plan_name:text, balance:numeric, status:text, start_date:timestamp with time zone, end_date?:timestamp with time zone, created_at:timestamp with time zone, updated_at:timestamp with time zone

**room_bookings** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Research Office

**publications** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**research_database_access** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**research_grants** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**research_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Security / IT

**backup_jobs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**backup_snapshots** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**branding_settings** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**device_logs** (rows: ~0, pk: id)
- columns: id:text, device_name:text, ip_address?:text, event_type:text, created_at:timestamp with time zone, user_id?:text, details?:text

**discipline_cases** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**email_sms_configs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**id_card_access** (rows: ~0, pk: id)
- columns: id:text, holder_name:text, holder_type:text, card_number:text, issued_at:timestamp with time zone, expires_at?:timestamp with time zone, status:text, notes?:text

**incident_reports** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**integrations** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**multilingual_strings** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**security_incidents** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**security_logs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**system_settings** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**visitor_logs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Student Affairs / Campus Life

**campus_event_rsvps** (rows: ~0, pk: id)
- columns: id:text, event_id:text, student_id:text, student_name:text, created_at:timestamp with time zone

**campus_events** (rows: ~0, pk: id)
- columns: id:text, title:text, description?:text, category:text, location:text, start_at:timestamp with time zone, end_at?:timestamp with time zone, capacity?:integer, rsvp_count:integer, created_at:timestamp with time zone, updated_at:timestamp with time zone

**club_memberships** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**clubs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**event_registrations** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**events** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**support_ticket_messages** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**support_tickets** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**welfare_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Engagement

**feedback** (rows: ~0, pk: id)
- columns: id:text, student_id?:text, student_name:text, professor_id?:text, professor_name?:text, type:USER-DEFINED, rating?:integer, comment:text, date:timestamp with time zone, status:USER-DEFINED, subject?:text, category?:text, course_id?:text, priority?:USER-DEFINED, context?:text, source?:text, target_role?:USER-DEFINED, attachment?:text, attachment_name?:text
- fks: course_id->courses.id, professor_id->professors.id

**global_announcements** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**news** (rows: ~0, pk: id)
- columns: id:text, title:text, body:text, created_at:timestamp with time zone, created_by:text, expires_at?:timestamp with time zone, image_url?:text

**notifications** (rows: ~0, pk: id)
- columns: id:text, user_id:text, title:text, body:text, created_at:timestamp with time zone, read:boolean, actor?:text, image_url?:text

**questions** (rows: ~0, pk: id)
- columns: id:text, course_id:text, professor_id:text, student_id:text, body:text, created_at:timestamp with time zone, status:USER-DEFINED, reply?:text, replied_at?:timestamp with time zone
- fks: course_id->courses.id, professor_id->professors.id, student_id->students.id

### Reporting / Audit

**accreditation_reports** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**audit_logs** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone, actor_user_id?:text, actor_username?:text, entity_type?:text, entity_id?:text, details:jsonb

**department_comparisons** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**department_reports** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**financial_reports** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Faculty budget

**faculty_budget_requests** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Misc / system

**exam_timetables** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**lab_materials** (rows: ~0, pk: id)
- columns: id:text, title:text, description:text, status:text, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

**module_toggles** (rows: ~1, pk: id)
- columns: id:text, passphrase_hash?:text, disabled_modules:jsonb, disabled_features:jsonb, updated_at:timestamp with time zone, updated_by?:text, module_states:jsonb, feature_states:jsonb, lock_message?:text

**schema_migrations** (rows: ~12, pk: version,version,id)
- columns: id:text, applied_at:timestamp with time zone

**student_profiles_extra** (rows: ~0, pk: student_id)
- columns: student_id:text, year_level:text, advisor_id?:text, advisor_name?:text, professor_id?:text, professor_name?:text, scholarship_status:text, payment_status:text, registration_hold:boolean, tuition_balance:numeric, notes?:text, created_at:timestamp with time zone, updated_at:timestamp with time zone

### Public site

**site_content** (rows: ~0, pk: id)
- columns: id:text, hero:jsonb, stats:jsonb, highlights?:jsonb, about:jsonb, admissions:jsonb, metrics?:jsonb, updated_at:timestamp with time zone

