import { Link } from 'react-router-dom'
import { ArrowLeft, ListTree } from 'lucide-react'
import { CategoryManager } from './SettingsPage'
import { PageHeader } from '../components/ui'

export function CategoriesPage() {
  return (
    <section className="settings-page categories-page">
      <PageHeader
        eyebrow="SETTINGS"
        title="Categories"
        description="Manage categories and subcategories for your income and expenses."
        action={<div className="settings-header-icon"><ListTree size={20} /></div>}
      />
      <Link className="categories-back-link" to="/settings"><ArrowLeft size={16} /> Back to settings</Link>
      <CategoryManager />
    </section>
  )
}