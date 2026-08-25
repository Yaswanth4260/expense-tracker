import { Card, EmptyState, PageHeader } from './ui'

type PagePlaceholderProps = {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return <section className="placeholder-page"><PageHeader eyebrow="EXPENSE TRACKER" title={title} /><Card><EmptyState title={title} description={description} /></Card></section>
}
