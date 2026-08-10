import type { PaymentTransaction } from "../../../shared/types/index.js"

interface AppendResult {
  balanceAfter: number
}

const ISO_EPOCH = new Date(0).toISOString()

function cloneTransaction(entry: PaymentTransaction): PaymentTransaction {
  return { ...entry }
}

function sortByCreatedAtAsc(a: PaymentTransaction, b: PaymentTransaction) {
  const left = new Date(a.createdAt).getTime()
  const right = new Date(b.createdAt).getTime()
  if (left === right) {
    return a.id.localeCompare(b.id)
  }
  return left - right
}

function sortByCreatedAtDesc(a: PaymentTransaction, b: PaymentTransaction) {
  return -sortByCreatedAtAsc(a, b)
}

export class LedgerRepository {
  private transactions: PaymentTransaction[] = []

  isEmpty() {
    return this.transactions.length === 0
  }

  listAllTransactions() {
    return this.transactions.slice().sort(sortByCreatedAtAsc).map((transaction) => cloneTransaction(transaction))
  }

  listTransactionsByStudent(studentId: string) {
    return this.transactions
      .filter((transaction) => transaction.studentId === studentId)
      .sort(sortByCreatedAtDesc)
      .map((transaction) => cloneTransaction(transaction))
  }

  getStudentSnapshot(studentId: string) {
    const transactions = this.listTransactionsByStudent(studentId)
    const latest = transactions[0]
    return {
      balance: latest?.balanceAfter ?? 0,
      updatedAt: latest?.createdAt ?? ISO_EPOCH,
      transactions,
    }
  }

  appendTransaction(transaction: PaymentTransaction): AppendResult {
    const existing = this.transactions
      .filter((entry) => entry.studentId === transaction.studentId)
      .sort(sortByCreatedAtAsc)

    const currentBalance = existing.length > 0 ? existing[existing.length - 1].balanceAfter ?? 0 : 0
    const delta = transaction.type === "debit" ? transaction.amount : -transaction.amount
    const projected = Number((currentBalance + delta).toFixed(2))

    const balanceAfter = projected
    const stored: PaymentTransaction = { ...transaction, balanceAfter }
    this.transactions.push(stored)

    return { balanceAfter }
  }

  clearAll() {
    this.transactions = []
  }
}
