import { useLiveQuery } from 'dexie-react-hooks'
import { getAccounts } from '../db/repositories/accountRepository'

export function useAccounts() {
  return useLiveQuery(getAccounts, []) ?? []
}