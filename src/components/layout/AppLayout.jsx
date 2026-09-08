import { NavLink, Outlet } from 'react-router-dom'
import { FileText, LayoutDashboard, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { env } from '@/lib/env'

const NAV = [
  { to: '/', label: 'דיווחים', icon: FileText, end: true },
  { to: '/coach', label: 'מאמן אישי', icon: MessageCircle },
  { to: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-semibold text-brand-700">
            {env.VITE_APP_NAME}
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
