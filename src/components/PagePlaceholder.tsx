type PagePlaceholderProps = {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">EXPENSE TRACKER</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  )
}
