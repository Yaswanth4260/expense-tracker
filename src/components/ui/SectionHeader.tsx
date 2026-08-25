import type { ReactNode } from 'react'

type SectionHeaderProps = { title: string; action?: ReactNode }

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return <div className="ui-section-header"><h3>{title}</h3>{action}</div>
}
