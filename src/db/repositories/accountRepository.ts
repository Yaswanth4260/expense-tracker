import { database, ensureDefaultCashAccount } from '../database'
import type { Account } from '../../types/account'

export function getAccounts() {
  return database.accounts.orderBy('name').toArray()
}

export function getAccount(id: number) {
  return database.accounts.get(id)
}

export function createAccount(account: Account) {
  return database.accounts.add(account)
}

export function updateAccount(id: number, changes: Partial<Account>) {
  return database.accounts.update(id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  })
}

export async function getAccountTransactionCount(id: number) {
  return database.transactions.where('accountId').equals(id).count()
}

export async function deleteAccount(id: number) {
  const account = await database.accounts.get(id)

  if (!account) {
    throw new Error('Account not found.')
  }

  if (account.type === 'cash' && account.name.trim().toLowerCase() === 'cash') {
    throw new Error('The default Cash account cannot be deleted.')
  }

  const transactionCount = await getAccountTransactionCount(id)

  if (transactionCount > 0) {
    throw new Error(
      'This account cannot be deleted because it is used by existing transactions.',
    )
  }

  await database.accounts.delete(id)
}

export { ensureDefaultCashAccount }