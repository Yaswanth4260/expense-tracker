import {
  Banknote,
  Car,
  Clapperboard,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  Tag,
  Utensils,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export const categoryIconOptions = [
  { value: 'tag', label: 'Tag', Icon: Tag },
  { value: 'food', label: 'Food', Icon: Utensils },
  { value: 'transport', label: 'Transport', Icon: Car },
  { value: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { value: 'bills', label: 'Bills', Icon: Receipt },
  { value: 'health', label: 'Health', Icon: HeartPulse },
  { value: 'entertainment', label: 'Entertainment', Icon: Clapperboard },
  { value: 'money', label: 'Money', Icon: Banknote },
  { value: 'wallet', label: 'Wallet', Icon: WalletCards },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
] as const

export type CategoryIconKey = typeof categoryIconOptions[number]['value']

export function getCategoryIcon(icon?: string): LucideIcon {
  return categoryIconOptions.find((option) => option.value === icon)?.Icon || Tag
}

export function defaultCategoryIcon(category: string): CategoryIconKey {
  const value = category.toLowerCase()
  if (value.includes('food')) return 'food'
  if (value.includes('transport')) return 'transport'
  if (value.includes('shop')) return 'shopping'
  if (value.includes('bill')) return 'bills'
  if (value.includes('health')) return 'health'
  if (value.includes('entertain')) return 'entertainment'
  if (value.includes('salary') || value.includes('income')) return 'money'
  return 'tag'
}
