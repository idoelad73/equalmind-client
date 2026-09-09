import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { HelpCircle, Home, LogOut, Menu, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { logout } from '@/lib/authApi'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: paths.app, label: 'בית', icon: Home, end: true },
  { to: paths.profile, label: 'פרופיל', icon: UserRound },
  { to: paths.about, label: 'מה זה Equalmind', icon: HelpCircle },
]

const linkClass = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2',
    'text-sm font-medium transition-colors',
    isActive
      ? 'bg-[var(--l-soft)] text-[var(--l-primary)]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

export function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    setOpen(false)
    await logout()
    useAuthStore.getState().clear()
    navigate(paths.landing, { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--l-ring)] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link
          to={paths.app}
          className="text-xl font-extrabold tracking-tight text-[var(--l-primary)]"
        >
          Equalmind
        </Link>

        {/* wide screens: inline navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {user?.email && (
            <span className="hidden max-w-[20ch] truncate text-xs text-slate-500 lg:inline">
              {user.email}
            </span>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="hidden items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 md:inline-flex"
          >
            <LogOut size={16} aria-hidden="true" />
            התנתקות
          </button>

          {/* narrow screens: disclosure */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="main-menu"
            aria-label={open ? 'סגירת התפריט' : 'פתיחת התפריט'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div
        id="main-menu"
        hidden={!open}
        className="border-t border-[var(--l-ring)] bg-white px-4 py-3 md:hidden"
      >
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}

          <span className="my-2 h-px bg-[var(--l-ring)]" />

          {user?.email && (
            <span className="truncate px-3.5 pb-1 text-xs text-slate-500">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-start text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={16} aria-hidden="true" />
            התנתקות
          </button>
        </nav>
      </div>
    </header>
  )
}
