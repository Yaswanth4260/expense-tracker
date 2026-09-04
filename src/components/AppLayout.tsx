import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Home, Plus, Settings, WalletCards } from 'lucide-react'
import { OfflineIndicator } from './OfflineIndicator'

const navigation = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/analysis', label: 'Analysis', icon: BarChart3 },
  { to: '/add', label: 'Add', icon: Plus, isAdd: true },
  { to: '/accounts', label: 'Accounts', icon: WalletCards },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <OfflineIndicator />
      <main><Outlet /></main>
      <nav className="bottom-navigation" aria-label="Primary navigation">
        {navigation.map(({ to, label, icon: Icon, end, isAdd }) => <NavLink key={to} to={to} end={end} aria-label={label} className={({ isActive }) => isAdd ? 'nav-item nav-add-item' : isActive ? 'nav-item active' : 'nav-item'}><Icon size={isAdd ? 27 : 19} /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  )
}
