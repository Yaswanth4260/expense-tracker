import { database } from '../db/database'
import type { Transaction } from '../types/transaction'

export function listTransactions() {
  return database.transactions.orderBy('occurredAt').reverse().toArray()
}

export function createTransaction(transaction: Transaction) {
  return database.transactions.add(transaction)
}
