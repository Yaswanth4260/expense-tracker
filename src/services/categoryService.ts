import { database } from '../db/database'
import type { TransactionType } from '../types/transaction'

const CATEGORY_STORAGE_KEY = 'expense-tracker-categories'
const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Salary',
  'Other',
]

function normalizeCategories(categories: string[]) {
  return [...new Map(categories.map((category) => [category.trim().toLowerCase(), category.trim()])).values()]
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second))
}

function storageKey(type: TransactionType) {
  return `${CATEGORY_STORAGE_KEY}-${type}`
}

function subcategoryStorageKey(type: TransactionType, category: string) {
  return `expense-tracker-subcategories-${type}-${category.trim().toLowerCase()}`
}

export async function getCategories(type: TransactionType) {
  const stored = localStorage.getItem(storageKey(type))
  const transactionCategories = await database.transactions.where('type').equals(type).toArray()
  const categories = transactionCategories.map((transaction) => transaction.category)
  const savedCategories = stored ? JSON.parse(stored) as string[] : []
  const result = normalizeCategories([...DEFAULT_CATEGORIES, ...savedCategories, ...categories])
  localStorage.setItem(storageKey(type), JSON.stringify(result))
  return result
}

export async function addCategory(type: TransactionType, category: string) {
  const categories = await getCategories(type)
  const result = normalizeCategories([...categories, category])
  localStorage.setItem(storageKey(type), JSON.stringify(result))
  return result
}

export async function renameCategory(type: TransactionType, currentName: string, nextName: string) {
  const trimmedName = nextName.trim()
  if (!trimmedName) return getCategories(type)

  const subcategories = localStorage.getItem(subcategoryStorageKey(type, currentName))
  await database.transactions
    .where('type').equals(type)
    .filter((transaction) => transaction.category === currentName)
    .modify({ category: trimmedName })
  const categories = await getCategories(type)
  const result = normalizeCategories(categories.filter((category) => category !== currentName).concat(trimmedName))
  localStorage.setItem(storageKey(type), JSON.stringify(result))
  if (subcategories) {
    localStorage.setItem(subcategoryStorageKey(type, trimmedName), subcategories)
    localStorage.removeItem(subcategoryStorageKey(type, currentName))
  }
  return result
}

export async function deleteCategory(type: TransactionType, category: string) {
  const used = await database.transactions
    .where('type').equals(type)
    .filter((transaction) => transaction.category === category)
    .count()
  if (used > 0) return false

  const categories = await getCategories(type)
  localStorage.setItem(storageKey(type), JSON.stringify(categories.filter((item) => item !== category)))
  localStorage.removeItem(subcategoryStorageKey(type, category))
  return true
}