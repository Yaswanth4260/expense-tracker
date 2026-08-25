import { database } from '../database'
import type { Budget } from '../../types/budget'

export function getBudgets() {
  return database.budgets.orderBy('period').reverse().toArray()
}

export function getBudget(id: number) {
  return database.budgets.get(id)
}

export function createBudget(budget: Budget) {
  return database.budgets.add(budget)
}

export function updateBudget(id: number, changes: Partial<Budget>) {
  return database.budgets.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export function deleteBudget(id: number) {
  return database.budgets.delete(id)
}
