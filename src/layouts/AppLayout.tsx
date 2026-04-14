import { NavLink, Outlet } from 'react-router-dom'
import { EnvironmentSwitcher } from '../components/shared/EnvironmentSwitcher'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Upload Master Data', to: '/core/upload' },
  { label: 'Master Data Records', to: '/core/records' },
  { label: 'SPPG/Kitchens', to: '/core/overview' },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr] gap-6 p-6">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="mb-4 text-lg font-bold">WMS BGN</h1>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="space-y-4">
          <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Warehouse Management System</div>
                <p className="text-sm text-slate-500">Kitchen deployment workflow</p>
              </div>
              <EnvironmentSwitcher />
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
