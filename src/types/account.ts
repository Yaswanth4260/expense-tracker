export type AccountType = 'cash' | 'bank' | 'credit-card' | 'wallet' | 'other'

export type Account = {
  id?: number
  name: string
  type: AccountType
  openingBalance: number
  icon: string
  color?: string
  createdAt: string
  updatedAt: string
}
