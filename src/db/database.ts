import Dexie, { type Table } from 'dexie'
import type { Account } from '../types/account'
import type { Budget } from '../types/budget'
import type { Transaction } from '../types/transaction'

export class ExpenseTrackerDatabase extends Dexie {
  transactions!: Table<Transaction, number>
  accounts!: Table<Account, number>
  budgets!: Table<Budget, number>

  constructor() {
    super('expense-tracker')
    this.version(1).stores({
      transactions: '++id, type, category, accountId, date, createdAt, updatedAt',
      accounts: '++id, name, type',
      budgets: '++id, type, period',
    })
  }
}

export const database = new ExpenseTrackerDatabase()

export async function ensureDefaultCashAccount() {
  const cashAccount = await database.accounts.where('name').equals('Cash').first()
  if (cashAccount) return cashAccount.id

  const now = new Date().toISOString()
  return database.accounts.add({
    name: 'Cash',
    type: 'cash',
    openingBalance: 0,
    icon: 'banknote',
    createdAt: now,
    updatedAt: now,
  })
}

database.on('ready', () => ensureDefaultCashAccount())
