// Money stays a decimal `numeric` column in Postgres and a plain JS number at the
// API boundary (not integer cents — the DB access layer in postgres.ts is a single
// generic wrapper shared by every table in the system, so hooking cents-conversion
// into it by column name would risk miscoercing unrelated tables).
//
// What this module fixes instead: every money calculation in finance.ts/enrollments.ts
// used to call `.toFixed(2)` ad hoc (which returns a *string*, silently re-parsed back
// to a number elsewhere, and uses banker's-adjacent rounding that differs from what a
// finance system should do). These helpers centralize on round-half-up to the cent,
// always returning a number, so every call site behaves identically.

export function roundToCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid currency amount: ${amount}`)
  }
  // round-half-up (not banker's rounding), matches how a finance dept expects money to round.
  // The 1e-8 epsilon absorbs float representation error (e.g. 1.005 stored as 1.00499999...)
  // before rounding, so amounts land on the cent the input actually intended.
  return Math.round((amount + Number.EPSILON * amount) * 100 + 1e-8) / 100
}

export function sumCents(values: number[]): number {
  return roundToCents(values.reduce((sum, value) => sum + value, 0))
}

export function subtractCurrency(a: number, b: number): number {
  return roundToCents(a - b)
}

export function multiplyCurrency(amount: number, factor: number): number {
  return roundToCents(amount * factor)
}

export function percentageOf(amount: number, percent: number): number {
  return roundToCents((amount * percent) / 100)
}

export function isValidCurrencyAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value === roundToCents(value)
}
