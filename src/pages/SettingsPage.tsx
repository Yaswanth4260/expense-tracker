import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Check,
  Download,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  ChevronDown,
  Pencil,
  Plus,
  UserRound,
} from 'lucide-react'

import {
  Card,
  PageHeader,
  SectionHeader,
} from '../components/ui'

import {
  exportBackup,
  readBackupFile,
  restoreBackup,
  resetAllData,
} from '../services/dataBackupService'
import { addCategory, deleteCategory, getCategories, renameCategory } from '../services/categoryService'
import { addSubcategory, deleteSubcategory, getSubcategories, renameSubcategory } from '../services/subcategoryService'
import type { TransactionType } from '../types/transaction'
import { getFirstName, saveFirstName } from '../services/userProfileService'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY =
  'expense-tracker-theme'

function getStoredTheme(): Theme {
  const stored =
    localStorage.getItem(
      THEME_STORAGE_KEY,
    )

  return stored === 'dark'
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme =
    theme
}

export function CategoryManager() {
  const [type, setType] = useState<TransactionType>('expense')
  const [categories, setCategories] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [subcategories, setSubcategories] = useState<Record<string, string[]>>({})
  const [newCategory, setNewCategory] = useState('')
  const [newSubcategory, setNewSubcategory] = useState('')

  async function refresh(nextType = type) {
    setCategories(await getCategories(nextType))
    setSubcategories({})
  }

  useEffect(() => { refresh() }, [type])

  async function toggleCategory(category: string) {
    if (expanded === category) {
      setExpanded(null)
      return
    }
    setExpanded(category)
    const items = await getSubcategories(type, category)
    setSubcategories((current) => ({ ...current, [category]: items }))
  }

  async function createCategory() {
    if (!newCategory.trim()) return
    setCategories(await addCategory(type, newCategory))
    setNewCategory('')
  }

  async function editCategory(category: string) {
    const nextName = window.prompt('Rename category', category)
    if (!nextName || nextName.trim() === category) return
    setCategories(await renameCategory(type, category, nextName))
    if (expanded === category) setExpanded(nextName.trim())
  }

  async function removeCategory(category: string) {
    if (!window.confirm(`Delete ${category}? Categories used by transactions cannot be deleted.`)) return
    if (!await deleteCategory(type, category)) window.alert('This category is used by a transaction and cannot be deleted.')
    else { setCategories((current) => current.filter((item) => item !== category)); setExpanded(null) }
  }

  async function createSubcategory(category: string) {
    if (!newSubcategory.trim()) return
    const items = await addSubcategory(type, category, newSubcategory)
    setSubcategories((current) => ({ ...current, [category]: items }))
    setNewSubcategory('')
  }

  async function editSubcategory(category: string, subcategory: string) {
    const nextName = window.prompt('Rename subcategory', subcategory)
    if (!nextName || nextName.trim() === subcategory) return
    const items = await renameSubcategory(type, category, subcategory, nextName)
    setSubcategories((current) => ({ ...current, [category]: items }))
  }

  async function removeSubcategory(category: string, subcategory: string) {
    if (!window.confirm(`Delete ${subcategory}?`)) return
    if (!await deleteSubcategory(type, category, subcategory)) window.alert('This subcategory is used by a transaction and cannot be deleted.')
    else setSubcategories((current) => ({ ...current, [category]: current[category].filter((item) => item !== subcategory) }))
  }

  return <Card className="settings-card category-manager">
    <div className="category-manager-tabs"><button type="button" className={type === 'expense' ? 'selected' : ''} onClick={() => setType('expense')}>Expenses</button><button type="button" className={type === 'income' ? 'selected' : ''} onClick={() => setType('income')}>Income</button></div>
    <div className="category-create-row"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={`New ${type} category`} /><button type="button" className="settings-icon-action" onClick={createCategory} aria-label="Add category" title="Add category"><Plus size={17} /></button></div>
    <div className="category-manager-list">{categories.map((category) => <div className="category-manager-item" key={category}><div className="category-manager-row"><button type="button" className="category-expand-button" onClick={() => toggleCategory(category)}><ChevronDown size={16} className={expanded === category ? 'rotated' : ''} /><strong>{category}</strong></button><button type="button" className="settings-icon-action" onClick={() => editCategory(category)} aria-label={`Rename ${category}`} title="Rename"><Pencil size={15} /></button><button type="button" className="settings-icon-action danger" onClick={() => removeCategory(category)} aria-label={`Delete ${category}`} title="Delete"><Trash2 size={15} /></button></div>{expanded === category && <div className="subcategory-manager"><div className="subcategory-create-row"><input value={newSubcategory} onChange={(event) => setNewSubcategory(event.target.value)} placeholder="New subcategory" /><button type="button" className="text-button" onClick={() => createSubcategory(category)}>Add</button></div>{(subcategories[category] || []).map((subcategory) => <div className="subcategory-manager-row" key={subcategory}><span>{subcategory}</span><span><button type="button" className="text-button" onClick={() => editSubcategory(category, subcategory)}>Rename</button><button type="button" className="text-button danger-button" onClick={() => removeSubcategory(category, subcategory)}>Delete</button></span></div>)}{!subcategories[category]?.length && <small>No subcategories yet.</small>}</div>}</div>)}</div>
  </Card>
}

export function SettingsPage() {
  const [theme, setTheme] =
    useState<Theme>(() =>
      getStoredTheme(),
    )

  const [busy, setBusy] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(getFirstName)

  useEffect(() => {
    applyTheme(theme)

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    )
  }, [theme])

  function clearFeedback() {
    setMessage('')
    setError('')
  }

  async function handleExport() {
    clearFeedback()
    setBusy(true)

    try {
      await exportBackup()

      setMessage(
        'Backup exported successfully.',
      )
    } catch {
      setError(
        'Could not export your data.',
      )
    } finally {
      setBusy(false)
    }
  }

  function openImportPicker() {
    clearFeedback()
    fileInputRef.current?.click()
  }

  async function handleImport(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    clearFeedback()

    const confirmed =
      window.confirm(
        'Importing a backup will replace your current transactions, accounts and budgets. Continue?',
      )

    if (!confirmed) return

    setBusy(true)

    try {
      const backup =
        await readBackupFile(file)

      await restoreBackup(backup)

      setMessage(
        'Backup imported successfully.',
      )
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Could not import the backup.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    clearFeedback()

    const confirmed =
      window.confirm(
        'Delete ALL transactions, accounts and budgets? This cannot be undone.',
      )

    if (!confirmed) return

    const secondConfirmation =
      window.confirm(
        'Are you absolutely sure? Your current local data will be permanently removed.',
      )

    if (!secondConfirmation) return

    setBusy(true)

    try {
      await resetAllData()

      setMessage(
        'All data has been reset.',
      )
    } catch {
      setError(
        'Could not reset your data.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-page">
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your app preferences and local data."
        action={
          <div className="settings-header-icon">
            <ShieldCheck size={20} />
          </div>
        }
      />

      {message && (
        <div className="settings-feedback success">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="settings-feedback error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="settings-section">
        <SectionHeader title="User" />
        <Card className="settings-card">
          <div className="settings-row user-profile-row">
            <div className="settings-row-icon"><UserRound size={18} /></div>
            <div className="settings-row-copy">
              <strong>Your first name</strong>
              <span>Personalize your home greeting.</span>
            </div>
            <input className="settings-inline-input" value={firstName} onChange={(event) => setFirstName(event.target.value)} onBlur={() => saveFirstName(firstName)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }} placeholder="Your name" aria-label="Your first name" />
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Appearance" />

        <Card className="settings-card">
          <div className="settings-row">
            <div className="settings-row-icon">
              {theme === 'dark' ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </div>

            <div className="settings-row-copy">
              <strong>Dark mode</strong>
              <span>
                {theme === 'dark'
                  ? 'Dark appearance is enabled.'
                  : 'Use the light appearance.'}
              </span>
            </div>

            <button
              type="button"
              className={`settings-toggle ${
                theme === 'dark'
                  ? 'active'
                  : ''
              }`}
              aria-label="Toggle dark mode"
              aria-pressed={
                theme === 'dark'
              }
              onClick={() =>
                setTheme(
                  theme === 'dark'
                    ? 'light'
                    : 'dark',
                )
              }
            >
              <span />
            </button>
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Categories" />
        <Card className="settings-card">
          <Link className="settings-action-row" to="/settings/categories">
            <span className="settings-row-icon">
              <Pencil size={18} />
            </span>
            <span className="settings-row-copy">
              <strong>Manage categories</strong>
              <span>Create, rename and organize income and expense categories.</span>
            </span>
            <ChevronDown size={16} className="settings-forward-icon" />
          </Link>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Data management" />

        <Card className="settings-card">
          <button
            type="button"
            className="settings-action-row"
            onClick={handleExport}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Download size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Export backup
              </strong>

              <span>
                Save your transactions,
                accounts and budgets as
                JSON.
              </span>
            </span>
          </button>

          <div className="settings-divider" />

          <button
            type="button"
            className="settings-action-row"
            onClick={openImportPicker}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Upload size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Import backup
              </strong>

              <span>
                Restore data from a previous
                backup.
              </span>
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="settings-hidden-file"
            onChange={handleImport}
          />

          <div className="settings-divider" />

          <button
            type="button"
            className="settings-action-row destructive"
            onClick={handleReset}
            disabled={busy}
          >
            <span className="settings-row-icon">
              <Trash2 size={18} />
            </span>

            <span className="settings-row-copy">
              <strong>
                Reset all data
              </strong>

              <span>
                Permanently remove all local
                transactions, accounts and
                budgets.
              </span>
            </span>

            <RotateCcw size={16} />
          </button>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="Preferences" />

        <Card className="settings-card">
          <div className="settings-simple-row">
            <div>
              <strong>Currency</strong>
              <span>
                All amounts are displayed in
                Indian Rupees.
              </span>
            </div>

            <strong className="settings-value">
              ₹ INR
            </strong>
          </div>
        </Card>
      </section>

      <section className="settings-section">
        <SectionHeader title="About" />

        <Card className="settings-about-card">
          <div className="settings-about-icon">
            ₹
          </div>

          <strong>Expense Tracker</strong>

          <span>
            A simple mobile-first personal
            finance tracker.
          </span>

          <small>
            Version 1.0.0
          </small>
        </Card>
      </section>
    </section>
  )
}