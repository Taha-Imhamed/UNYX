import { roundToCents, sumCents, subtractCurrency, multiplyCurrency, percentageOf, isValidCurrencyAmount } from '../src/lib/currency.js'

describe('roundToCents', () => {
  it('rounds half-cent up, not banker-rounds', () => {
    expect(roundToCents(1.005)).toBe(1.01)
    expect(roundToCents(2.675)).toBe(2.68)
  })

  it('is a no-op on values already at cent precision', () => {
    expect(roundToCents(19.99)).toBe(19.99)
    expect(roundToCents(0)).toBe(0)
  })

  it('absorbs classic float representation error', () => {
    // 0.1 + 0.2 in raw JS float math is 0.30000000000000004
    expect(roundToCents(0.1 + 0.2)).toBe(0.3)
  })

  it('rounds negative amounts correctly (refunds/debits)', () => {
    expect(roundToCents(-10.005)).toBe(-10)
    expect(roundToCents(-10.006)).toBe(-10.01)
  })

  it('throws on non-finite input rather than silently producing NaN', () => {
    expect(() => roundToCents(NaN)).toThrow()
    expect(() => roundToCents(Infinity)).toThrow()
  })
})

describe('sumCents', () => {
  it('sums a list of amounts and rounds the total, not each term', () => {
    expect(sumCents([10.1, 20.2])).toBe(30.3)
  })

  it('matches the classic installment-plan drift scenario: summing many small fractional charges', () => {
    // three line items of 33.33 should sum to 99.99, not 99.99000000000001-style drift
    expect(sumCents([33.33, 33.33, 33.33])).toBe(99.99)
  })

  it('returns 0 for an empty list', () => {
    expect(sumCents([])).toBe(0)
  })
})

describe('subtractCurrency', () => {
  it('computes balance-due style subtraction cleanly', () => {
    expect(subtractCurrency(100, 33.33)).toBe(66.67)
  })

  it('rounds a subtraction that would otherwise leave float dust', () => {
    expect(subtractCurrency(0.3, 0.1)).toBe(0.2)
  })
})

describe('multiplyCurrency', () => {
  it('computes a coupon-style percentage discount amount', () => {
    // 149.99 at a 0.15 (15%) discount factor
    expect(multiplyCurrency(149.99, 0.15)).toBe(22.5)
  })

  it('computes the late-fee scenario from finance.ts (5% of overdue balance)', () => {
    expect(multiplyCurrency(238.47, 0.05)).toBe(11.92)
  })
})

describe('percentageOf', () => {
  it('computes a whole-number percentage of an amount', () => {
    expect(percentageOf(200, 25)).toBe(50)
  })

  it('rounds the result to the nearest cent', () => {
    expect(percentageOf(99.99, 33)).toBe(33)
  })
})

describe('isValidCurrencyAmount', () => {
  it('accepts amounts already at cent precision', () => {
    expect(isValidCurrencyAmount(19.99)).toBe(true)
    expect(isValidCurrencyAmount(0)).toBe(true)
  })

  it('rejects sub-cent amounts', () => {
    expect(isValidCurrencyAmount(19.999)).toBe(false)
  })

  it('rejects non-numeric input', () => {
    expect(isValidCurrencyAmount('19.99')).toBe(false)
    expect(isValidCurrencyAmount(NaN)).toBe(false)
  })
})

describe('installment plan math (real finance.ts scenario)', () => {
  it('splitting a total across installments and re-deriving remaining balance stays exact', () => {
    const totalAmount = roundToCents(1000)
    const installmentCount = 3
    const amountPerInstallment = roundToCents(totalAmount / installmentCount)
    expect(amountPerInstallment).toBe(333.33)

    const paidAmount = roundToCents(333.33)
    const remainingBalance = Math.max(0, subtractCurrency(totalAmount, paidAmount))
    expect(remainingBalance).toBe(666.67)
  })
})

describe('invoice line item math (real finance.ts scenario)', () => {
  it('quantity times unit amount, then summed across line items, matches the invoice total exactly', () => {
    const lineItems = [
      { quantity: 3, unitAmount: 19.99 },
      { quantity: 1, unitAmount: 149.5 },
      { quantity: 2, unitAmount: 4.33 },
    ]
    const totals = lineItems.map((item) => roundToCents(item.quantity * item.unitAmount))
    expect(totals).toEqual([59.97, 149.5, 8.66])
    expect(sumCents(totals)).toBe(218.13)
  })
})
