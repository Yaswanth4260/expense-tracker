export type BudgetType = 'monthly' | 'annual'

export type Budget = {
  id?: number
  type: BudgetType
  period: string
  amount: number
  createdAt: string
  updatedAt: string
}
