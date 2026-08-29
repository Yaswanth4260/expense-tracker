import type { Transaction } from '../types/transaction'

export type AnalysisPeriod =
  | 'month'
  | 'last-month'
  | 'year'
  | 'all'

export type CategoryTotal = {
  category: string
  amount: number
  percentage: number
}

export type MonthlyTotal = {
  month: string
  label: string
  income: number
  expense: number
}

function getLocalMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

export function getPeriodTransactions(
  transactions: Transaction[],
  period: AnalysisPeriod,
) {
  const now = new Date()

  if (period === 'all') {
    return transactions
  }

  if (period === 'month') {
    const monthKey = getLocalMonthKey(now)

    return transactions.filter((transaction) =>
      transaction.date.startsWith(monthKey),
    )
  }

  if (period === 'last-month') {
    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    )

    const monthKey = getLocalMonthKey(previousMonth)

    return transactions.filter((transaction) =>
      transaction.date.startsWith(monthKey),
    )
  }

  const year = String(now.getFullYear())

  return transactions.filter((transaction) =>
    transaction.date.startsWith(year),
  )
}

export function getCategoryTotals(
  transactions: Transaction[],
): CategoryTotal[] {
  const expenses = transactions.filter(
    (transaction) =>
      transaction.type === 'expense',
  )

  const totals = new Map<string, number>()

  for (const transaction of expenses) {
    const category =
      transaction.category.trim() ||
      'Uncategorized'

    totals.set(
      category,
      (totals.get(category) ?? 0) +
        transaction.amount,
    )
  }

  const total = expenses.reduce(
    (sum, transaction) =>
      sum + transaction.amount,
    0,
  )

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percentage:
        total > 0
          ? (amount / total) * 100
          : 0,
    }))
    .sort(
      (first, second) =>
        second.amount - first.amount,
    )
}

export function getMonthlyTotals(
  transactions: Transaction[],
  numberOfMonths = 6,
): MonthlyTotal[] {
  const now = new Date()

  const result: MonthlyTotal[] = []

  for (
    let offset = numberOfMonths - 1;
    offset >= 0;
    offset--
  ) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1,
    )

    const year = date.getFullYear()

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0')

    const key = `${year}-${month}`

    const monthTransactions =
      transactions.filter((transaction) =>
        transaction.date.startsWith(key),
      )

    const income =
      monthTransactions
        .filter(
          (transaction) =>
            transaction.type === 'income',
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0,
        )

    const expense =
      monthTransactions
        .filter(
          (transaction) =>
            transaction.type === 'expense',
        )
        .reduce(
          (total, transaction) =>
            total + transaction.amount,
          0,
        )

    result.push({
      month: key,
      label: date.toLocaleDateString(
        'en-IN',
        {
          month: 'short',
        },
      ),
      income,
      expense,
    })
  }

  return result
}