import { database } from '../database'
import type { Transaction } from '../../types/transaction'

export function getTransactions() {
  return database.transactions.toArray().then((transactions) => transactions.sort((first, second) => {
    const firstDate = `${first.date}T${first.time}`
    const secondDate = `${second.date}T${second.time}`
    return secondDate.localeCompare(firstDate) || second.createdAt.localeCompare(first.createdAt)
  }))
}

export function getTransaction(id: number) {
  return database.transactions.get(id)
}

export function createTransaction(transaction: Transaction) {
  return database.transactions.add(transaction)
}

export function updateTransaction(id: number, changes: Partial<Transaction>) {
  return database.transactions.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export function deleteTransaction(id: number) {
  return database.transactions.delete(id)
}
