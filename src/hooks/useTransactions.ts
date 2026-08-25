import { useLiveQuery } from 'dexie-react-hooks'
import { listTransactions } from '../services/transactionService'

export function useTransactions() {
  return useLiveQuery(listTransactions, [])
}
