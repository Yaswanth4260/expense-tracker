export type TransactionType = 'income' | 'expense' | 'transfer'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'net-banking' | 'other'

export type Attachment = {
  name: string
  type: string
  size: number
  dataUrl?: string
}

export type Transaction = {
  id?: number
  type: TransactionType
  amount: number
  category: string
  accountId: number
  paymentMode: PaymentMode
  date: string
  time: string
  note: string
  hashtags: string[]
  attachment?: Attachment
  createdAt: string
  updatedAt: string
}
