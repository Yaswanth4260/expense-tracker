export const FIRST_NAME_STORAGE_KEY = 'expense-tracker-first-name'
export const FIRST_NAME_UPDATED_EVENT = 'expense-tracker-first-name-updated'

export function getFirstName() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(FIRST_NAME_STORAGE_KEY)?.trim() || ''
}

export function saveFirstName(firstName: string) {
  const value = firstName.trim()
  if (value) localStorage.setItem(FIRST_NAME_STORAGE_KEY, value)
  else localStorage.removeItem(FIRST_NAME_STORAGE_KEY)
  window.dispatchEvent(new Event(FIRST_NAME_UPDATED_EVENT))
}