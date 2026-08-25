import type { Transaction } from '../types/transaction'

export function getTotalIncome(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === 'income').reduce((total, transaction) => total + transaction.amount, 0)
}

export function getTotalExpense(transactions: Transaction[]) {
  return transactions.filter((transaction) => transaction.type === 'expense').reduce((total, transaction) => total + transaction.amount, 0)
}

export function getNetBalance(transactions: Transaction[]) {
  return getTotalIncome(transactions) - getTotalExpense(transactions)
}

export function sortTransactionsNewestFirst(transactions: Transaction[]) {
  return [...transactions].sort((first, second) => {
    const firstDate = `${first.date}T${first.time}`
    const secondDate = `${second.date}T${second.time}`
    return secondDate.localeCompare(firstDate) || second.createdAt.localeCompare(first.createdAt)
  })
}

export function getRecentTransactions(transactions: Transaction[], limit = 3) {
  return sortTransactionsNewestFirst(transactions).slice(0, limit)
}
