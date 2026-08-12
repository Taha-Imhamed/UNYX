-- Drops 87 scaffold tables confirmed dead via SCHEMA.md's 2026-08-11 audit:
-- zero rows, zero references anywhere in backend/src/routes, backend/src/data,
-- or backend/src/lib outside system-diagnostics.ts (which lists all table names
-- for a diagnostics UI and doesn't count as real usage). Re-verified independently
-- before writing this migration by grepping every name against routes/data/lib;
-- the only hits (applications, campuses, classes, sponsorships) were false
-- positives from data/terminal-modules.ts, a static UI nav-label registry with
-- no DB calls. Full backup taken before running this (unyt_backup_20260812_084102.sql).
-- Forward-only: to undo, restore from that backup — there is no down-migration.

drop table if exists public.academic_terms cascade;
drop table if exists public.accreditation_reports cascade;
drop table if exists public.admissions_scholarships cascade;
drop table if exists public.advisor_meetings cascade;
drop table if exists public.advisor_notes cascade;
drop table if exists public.advisor_risk_alerts cascade;
drop table if exists public.advisor_student_assignments cascade;
drop table if exists public.api_clients cascade;
drop table if exists public.application_documents cascade;
drop table if exists public.applications cascade;
drop table if exists public.assignment_submissions cascade;
drop table if exists public.attendance_records cascade;
drop table if exists public.attendance_sessions cascade;
drop table if exists public.backup_jobs cascade;
drop table if exists public.backup_snapshots cascade;
drop table if exists public.book_copies cascade;
drop table if exists public.book_loans cascade;
drop table if exists public.book_reservations cascade;
drop table if exists public.books cascade;
drop table if exists public.branding_settings cascade;
drop table if exists public.campuses cascade;
drop table if exists public.classes cascade;
drop table if exists public.classroom_schedules cascade;
drop table if exists public.classrooms cascade;
drop table if exists public.club_memberships cascade;
drop table if exists public.clubs cascade;
drop table if exists public.course_approval_requests cascade;
drop table if exists public.course_materials cascade;
drop table if exists public.department_comparisons cascade;
drop table if exists public.department_reports cascade;
drop table if exists public.departments cascade;
drop table if exists public.discipline_cases cascade;
drop table if exists public.ebooks cascade;
drop table if exists public.email_sms_configs cascade;
drop table if exists public.employee_leave_requests cascade;
drop table if exists public.entrance_exam_results cascade;
drop table if exists public.event_registrations cascade;
drop table if exists public.events cascade;
drop table if exists public.exam_timetables cascade;
drop table if exists public.faculty_budget_requests cascade;
drop table if exists public.fee_invoice_items cascade;
drop table if exists public.fee_invoices cascade;
drop table if exists public.financial_reports cascade;
drop table if exists public.global_announcements cascade;
drop table if exists public.gradebook_entries cascade;
drop table if exists public.graduation_eligibility_checks cascade;
drop table if exists public.homework_grading_tasks cascade;
drop table if exists public.installment_payments cascade;
drop table if exists public.installment_plans cascade;
drop table if exists public.interviews cascade;
drop table if exists public.journals cascade;
drop table if exists public.lab_materials cascade;
drop table if exists public.late_penalties cascade;
drop table if exists public.leave_requests cascade;
drop table if exists public.library_fines cascade;
drop table if exists public.login_devices cascade;
drop table if exists public.maintenance_mode cascade;
drop table if exists public.maintenance_windows cascade;
drop table if exists public.multilingual_strings cascade;
drop table if exists public.password_reset_audit cascade;
drop table if exists public.payroll_items cascade;
drop table if exists public.payroll_runs cascade;
drop table if exists public.quiz_attempt_answers cascade;
drop table if exists public.quiz_attempts cascade;
drop table if exists public.quiz_questions cascade;
drop table if exists public.refund_requests cascade;
drop table if exists public.registration_state cascade;
drop table if exists public.research_database_access cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.security_incidents cascade;
drop table if exists public.security_logs cascade;
drop table if exists public.sponsorships cascade;
drop table if exists public.sso_providers cascade;
drop table if exists public.staff_contracts cascade;
drop table if exists public.staff_performance_reviews cascade;
drop table if exists public.student_documents cascade;
drop table if exists public.student_profiles_extra cascade;
drop table if exists public.student_record_changes cascade;
drop table if exists public.student_scholarships cascade;
drop table if exists public.support_ticket_messages cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.system_settings cascade;
drop table if exists public.ta_student_support_sessions cascade;
drop table if exists public.teaching_assistant_assignments cascade;
drop table if exists public.teaching_loads cascade;
drop table if exists public.user_role_history cascade;
drop table if exists public.welfare_requests cascade;
