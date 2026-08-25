import { useLiveQuery } from 'dexie-react-hooks'
import { getTransactions } from '../db/repositories/transactionRepository'

export function useTransactions() {
  return useLiveQuery(getTransactions, [])
}
