import Dexie, { type Table } from 'dexie'
import type { Transaction } from '../types/transaction'

export class ExpenseTrackerDatabase extends Dexie {
  transactions!: Table<Transaction, number>

  constructor() {
    super('expense-tracker')
    this.version(1).stores({ transactions: '++id, type, category, occurredAt' })
  }
}

export const database = new ExpenseTrackerDatabase()
