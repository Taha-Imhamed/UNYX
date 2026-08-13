-- Enforces round(amount, 2) = amount on every real money column, at the DB layer,
-- so a raw SQL insert or a future route bypassing app-level rounding (backend/src/lib/currency.ts)
-- can't silently write a sub-cent value. Application code was already fixed to use that
-- helper consistently (finance.ts, enrollments.ts) instead of scattered ad hoc .toFixed(2)
-- calls. Verified zero existing violations across all 24 columns below before writing this
-- (checked live via a one-off script against every row, not assumed).
--
-- coverage_value on finance_sponsorships is deliberately excluded: it can be a percentage
-- (0-100) rather than a dollar amount when coverage_type = 'percentage', so a 2-decimal-cents
-- constraint doesn't universally apply to it.
--
-- Postgres has no "add constraint if not exists" syntax, so each constraint is wrapped in
-- do $$ ... exception when duplicate_object then null; end $$, matching the pattern already
-- used for FKs in migration 0007.

do $$ begin
  alter table public.expenses add constraint chk_expenses_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_installment_plans add constraint chk_fin_installment_total_cents check (round(total_amount, 2) = total_amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_installment_plans add constraint chk_fin_installment_per_cents check (round(amount_per_installment, 2) = amount_per_installment);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_installment_plans add constraint chk_fin_installment_paid_cents check (round(paid_amount, 2) = paid_amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_installment_plans add constraint chk_fin_installment_remaining_cents check (round(remaining_balance, 2) = remaining_balance);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_invoices add constraint chk_fin_invoices_subtotal_cents check (round(subtotal, 2) = subtotal);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_invoices add constraint chk_fin_invoices_total_cents check (round(total, 2) = total);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_invoices add constraint chk_fin_invoices_paid_cents check (round(paid_amount, 2) = paid_amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_invoices add constraint chk_fin_invoices_balance_due_cents check (round(balance_due, 2) = balance_due);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_refund_requests add constraint chk_fin_refunds_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_requests add constraint chk_fin_requests_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.finance_sponsorships add constraint chk_fin_sponsorships_applied_cents check (round(applied_amount, 2) = applied_amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.financial_holds add constraint chk_fin_holds_balance_cents check (round(balance_at_hold, 2) = balance_at_hold);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.financial_ledger add constraint chk_fin_ledger_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.income add constraint chk_income_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.payments add constraint chk_payments_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.payments add constraint chk_payments_balance_after_cents check (balance_after is null or round(balance_after, 2) = balance_after);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.payroll_entries add constraint chk_payroll_entries_amount_cents check (round(amount, 2) = amount);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.students add constraint chk_students_balance_cents check (round(balance, 2) = balance);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.students add constraint chk_students_tuition_balance_cents check (tuition_balance is null or round(tuition_balance, 2) = tuition_balance);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.courses add constraint chk_courses_price_cents check (round(price, 2) = price);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.enrollments add constraint chk_enrollments_price_cents check (round(price, 2) = price);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.enrollments add constraint chk_enrollments_base_price_cents check (base_price is null or round(base_price, 2) = base_price);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.enrollments add constraint chk_enrollments_discount_amount_cents check (discount_amount is null or round(discount_amount, 2) = discount_amount);
exception when duplicate_object then null; end $$;
