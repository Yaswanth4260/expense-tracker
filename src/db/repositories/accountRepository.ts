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
  return database.accounts.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export function deleteAccount(id: number) {
  return database.accounts.delete(id)
}

export { ensureDefaultCashAccount }
