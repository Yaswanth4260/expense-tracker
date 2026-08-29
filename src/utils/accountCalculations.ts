import type { Account } from '../types/account'
import type { Transaction } from '../types/transaction'

export function getAccountIncome(
  accountId: number,
  transactions: Transaction[],
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.accountId === accountId &&
        transaction.type === 'income',
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getAccountExpense(
  accountId: number,
  transactions: Transaction[],
) {
  return transactions
    .filter(
      (transaction) =>
        transaction.accountId === accountId &&
        transaction.type === 'expense',
    )
    .reduce((total, transaction) => total + transaction.amount, 0)
}

export function getAccountBalance(
  account: Account,
  transactions: Transaction[],
) {
  const income = getAccountIncome(account.id ?? -1, transactions)

  const expense = getAccountExpense(account.id ?? -1, transactions)

  return account.openingBalance + income - expense
}