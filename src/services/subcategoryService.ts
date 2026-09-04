import { database } from '../db/database'
import type { TransactionType } from '../types/transaction'

const STORAGE_PREFIX = 'expense-tracker-subcategories'

function storageKey(type: TransactionType, category: string) {
  return `${STORAGE_PREFIX}-${type}-${category.trim().toLowerCase()}`
}

function normalize(values: string[]) {
  return [...new Map(values.map((value) => [value.trim().toLowerCase(), value.trim()])).values()]
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second))
}

export async function getSubcategories(type: TransactionType, category: string) {
  if (!category) return []

  const stored = localStorage.getItem(storageKey(type, category))
  const transactions = await database.transactions.toArray()
  const existing = transactions
    .filter((transaction) => transaction.type === type && transaction.category === category)
    .map((transaction) => transaction.subcategory || '')
  const saved = stored ? JSON.parse(stored) as string[] : []
  const result = normalize([...saved, ...existing])
  localStorage.setItem(storageKey(type, category), JSON.stringify(result))
  return result
}

export async function addSubcategory(type: TransactionType, category: string, subcategory: string) {
  const result = normalize([...await getSubcategories(type, category), subcategory])
  localStorage.setItem(storageKey(type, category), JSON.stringify(result))
  return result
}

export async function renameSubcategory(type: TransactionType, category: string, currentName: string, nextName: string) {
  const trimmedName = nextName.trim()
  if (!trimmedName) return getSubcategories(type, category)

  await database.transactions
    .where('type').equals(type)
    .filter((transaction) => transaction.category === category && transaction.subcategory === currentName)
    .modify({ subcategory: trimmedName })
  const result = normalize((await getSubcategories(type, category)).filter((item) => item !== currentName).concat(trimmedName))
  localStorage.setItem(storageKey(type, category), JSON.stringify(result))
  return result
}

export async function deleteSubcategory(type: TransactionType, category: string, subcategory: string) {
  const used = await database.transactions
    .where('type').equals(type)
    .filter((transaction) => transaction.category === category && transaction.subcategory === subcategory)
    .count()
  if (used > 0) return false

  const result = (await getSubcategories(type, category)).filter((item) => item !== subcategory)
  localStorage.setItem(storageKey(type, category), JSON.stringify(result))
  return true
}