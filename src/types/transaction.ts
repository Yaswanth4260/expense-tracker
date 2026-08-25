export type TransactionType = 'expense' | 'income' | 'transfer'

export type Transaction = {
  id?: number
  type: TransactionType
  amount: number
  description: string
  category: string
  occurredAt: string
}
