import { database } from '../db/database'
import type { Account } from '../types/account'
import type { Budget } from '../types/budget'
import type { Transaction } from '../types/transaction'

const BACKUP_VERSION = 1

export type ExpenseTrackerBackup = {
  version: number
  exportedAt: string
  data: {
    transactions: Transaction[]
    accounts: Account[]
    budgets: Budget[]
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTransaction(value: unknown): value is Transaction {
  if (!isObject(value)) return false

  return (
    (value.id === undefined || isNumber(value.id)) &&
    ['income', 'expense', 'transfer'].includes(
      String(value.type),
    ) &&
    isNumber(value.amount) &&
    isString(value.category) &&
    (value.subcategory === undefined || isString(value.subcategory)) &&
    isNumber(value.accountId) &&
    (value.fromAccountId === undefined || isNumber(value.fromAccountId)) &&
    (value.toAccountId === undefined || isNumber(value.toAccountId)) &&
    ['cash', 'upi', 'card', 'net-banking', 'other'].includes(
      String(value.paymentMode),
    ) &&
    isString(value.date) &&
    isString(value.time) &&
    isString(value.note) &&
    Array.isArray(value.hashtags) &&
    value.hashtags.every(isString) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function isAccount(value: unknown): value is Account {
  if (!isObject(value)) return false

  return (
    (value.id === undefined || isNumber(value.id)) &&
    isString(value.name) &&
    ['cash', 'bank', 'credit-card', 'wallet', 'other'].includes(
      String(value.type),
    ) &&
    isNumber(value.openingBalance) &&
    isString(value.icon) &&
    (value.color === undefined || isString(value.color)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function isBudget(value: unknown): value is Budget {
  if (!isObject(value)) return false

  return (
    (value.id === undefined || isNumber(value.id)) &&
    ['monthly', 'annual'].includes(String(value.type)) &&
    isString(value.period) &&
    isNumber(value.amount) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

export function validateBackup(
  value: unknown,
): value is ExpenseTrackerBackup {
  if (!isObject(value)) {
    throw new Error('The backup file is not a valid object.')
  }

  if (value.version !== BACKUP_VERSION) {
    throw new Error(
      `Unsupported backup version: ${String(value.version)}.`,
    )
  }

  if (!isString(value.exportedAt)) {
    throw new Error('The backup is missing its export timestamp.')
  }

  if (!isObject(value.data)) {
    throw new Error('The backup is missing its data section.')
  }

  const data = value.data

  if (!Array.isArray(data.transactions)) {
    throw new Error('The transactions section is invalid.')
  }

  if (!Array.isArray(data.accounts)) {
    throw new Error('The accounts section is invalid.')
  }

  if (!Array.isArray(data.budgets)) {
    throw new Error('The budgets section is invalid.')
  }

  if (!data.transactions.every(isTransaction)) {
    throw new Error(
      'The backup contains an invalid transaction.',
    )
  }

  if (!data.accounts.every(isAccount)) {
    throw new Error(
      'The backup contains an invalid account.',
    )
  }

  if (!data.budgets.every(isBudget)) {
    throw new Error(
      'The backup contains an invalid budget.',
    )
  }

  const transactionIds = data.transactions
    .map((transaction) => transaction.id)
    .filter((id): id is number => id !== undefined)

  const accountIds = data.accounts
    .map((account) => account.id)
    .filter((id): id is number => id !== undefined)

  const budgetIds = data.budgets
    .map((budget) => budget.id)
    .filter((id): id is number => id !== undefined)

  if (
    new Set(transactionIds).size !==
    transactionIds.length
  ) {
    throw new Error(
      'The backup contains duplicate transaction IDs.',
    )
  }

  if (
    new Set(accountIds).size !== accountIds.length
  ) {
    throw new Error(
      'The backup contains duplicate account IDs.',
    )
  }

  if (
    new Set(budgetIds).size !== budgetIds.length
  ) {
    throw new Error(
      'The backup contains duplicate budget IDs.',
    )
  }

  const accountIdSet = new Set(accountIds)

  for (const transaction of data.transactions) {
    if (!accountIdSet.has(transaction.accountId)) {
      throw new Error(
        `Transaction ${transaction.id ?? ''} references a missing account.`,
      )
    }

    if (transaction.fromAccountId !== undefined && !accountIdSet.has(transaction.fromAccountId)) {
      throw new Error(`Transaction ${transaction.id ?? ''} references a missing source account.`)
    }

    if (transaction.toAccountId !== undefined && !accountIdSet.has(transaction.toAccountId)) {
      throw new Error(`Transaction ${transaction.id ?? ''} references a missing destination account.`)
    }
  }

  return true
}

export async function createBackup(): Promise<ExpenseTrackerBackup> {
  const [transactions, accounts, budgets] =
    await Promise.all([
      database.transactions.toArray(),
      database.accounts.toArray(),
      database.budgets.toArray(),
    ])

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      accounts,
      budgets,
    },
  }
}

export async function exportBackup(): Promise<void> {
  const backup = await createBackup()

  const json = JSON.stringify(
    backup,
    null,
    2,
  )

  const blob = new Blob(
    [json],
    { type: 'application/json' },
  )

  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')

  const date = new Date()
    .toISOString()
    .slice(0, 10)

  anchor.href = url
  anchor.download =
    `expense-tracker-backup-${date}.json`

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

export async function readBackupFile(
  file: File,
): Promise<ExpenseTrackerBackup> {
  const text = await file.text()

  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(
      'The selected file is not valid JSON.',
    )
  }

  if (!validateBackup(parsed)) {
    throw new Error(
      'The selected file is not a valid Expense Tracker backup.',
    )
  }

  return parsed
}

export async function restoreBackup(
  backup: ExpenseTrackerBackup,
): Promise<void> {
  validateBackup(backup)

  await database.transaction(
    'rw',
    database.transactions,
    database.accounts,
    database.budgets,
    async () => {
      await database.transactions.clear()
      await database.accounts.clear()
      await database.budgets.clear()

      if (backup.data.accounts.length) {
        await database.accounts.bulkAdd(
          backup.data.accounts,
        )
      }

      if (backup.data.transactions.length) {
        await database.transactions.bulkAdd(
          backup.data.transactions,
        )
      }

      if (backup.data.budgets.length) {
        await database.budgets.bulkAdd(
          backup.data.budgets,
        )
      }
    },
  )
}

export async function resetAllData(): Promise<void> {
  await database.transaction(
    'rw',
    database.transactions,
    database.accounts,
    database.budgets,
    async () => {
      await database.transactions.clear()
      await database.accounts.clear()
      await database.budgets.clear()
    },
  )

  await database.accounts.add({
    name: 'Cash',
    type: 'cash',
    openingBalance: 0,
    icon: 'banknote',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}