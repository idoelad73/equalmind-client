import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  FileSpreadsheet,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { logout } from '@/lib/authApi'
import { fetchMyProfile } from '@/lib/registryApi'
import { RosterUploadModal } from '@/components/org/RosterUploadModal'
import { NotifyModal } from '@/components/org/NotifyModal'
import { MessagesBell } from '@/components/admin/MessagesBell'
import { InviteRepresentativeModal } from '@/components/admin/InviteRepresentativeModal'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { to: paths.app, label: 'בית', icon: Home, end: true },
  { to: paths.profile, label: 'פרופיל', icon: UserRound },
  { to: paths.about, label: 'מה זה Equalmind', icon: HelpCircle },
]

/**
 * What each account type is called on screen. Keyed on the stored value, so
 * renaming a label here cannot change who is what - and an unknown type
 * renders nothing rather than guessing at a name for it.
 */
const USER_TYPE_LABELS = {
  regular: 'עובד',
  org_admin: 'נציג הארגון',
  system_admin: 'מנהל המערכת',
}

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
  const [rosterOpen, setRosterOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  // Carried across so the invitation dialog can say what was just imported.
  const [imported, setImported] = useState(null)
  // Which organisation the staff upload was for, handed to the invitation
  // dialog so it scopes to the same one.
  const [notifyOrgId, setNotifyOrgId] = useState(null)
  // When the invitation dialog was opened from an upload, the moment that
  // upload wrote its rows - so "only the new ones" means that upload's.
  const [notifySince, setNotifySince] = useState(null)

  // Same queryKey as the profile page, so this is a cache hit there and back.
  // The button is a convenience only - every roster route is gated server
  // side by requireOrgAdmin, so hiding it is not what protects anything.
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchMyProfile })
  const isOrgAdmin = profile.data?.user_type === 'org_admin'
  const isSystemAdmin = profile.data?.user_type === 'system_admin'
  const userTypeLabel = USER_TYPE_LABELS[profile.data?.user_type]

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

          {userTypeLabel && (
            <span className="ms-1 inline-flex items-center rounded-full bg-[var(--l-soft)]/70 px-3 py-1 text-xs font-semibold whitespace-nowrap text-[var(--l-primary)] ring-1 ring-[var(--l-ring)]">
              {userTypeLabel}
            </span>
          )}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {/* Renders nothing unless the server says this account is staff. */}
          <MessagesBell />

          {user?.email && (
            <span className="hidden max-w-[20ch] truncate text-xs text-slate-500 lg:inline">
              {user.email}
            </span>
          )}

          {isSystemAdmin && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-[var(--l-primary)] px-3.5 py-2 text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)] md:inline-flex"
            >
              <Building2 size={16} aria-hidden="true" />
              הזמן נציג הארגון
            </button>
          )}

          {(isOrgAdmin || isSystemAdmin) && (
            <button
              type="button"
              onClick={() => setRosterOpen(true)}
              className="hidden items-center gap-2 rounded-full bg-[var(--l-soft)] px-3.5 py-2 text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft-hover)] md:inline-flex"
            >
              <FileSpreadsheet size={16} aria-hidden="true" />
              טען רשימת עובדים
            </button>
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

          {userTypeLabel && (
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[var(--l-soft)]/70 px-3 py-1 text-xs font-semibold text-[var(--l-primary)] ring-1 ring-[var(--l-ring)]">
              {userTypeLabel}
            </span>
          )}

          {isSystemAdmin && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setInviteOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-start text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)]"
            >
              <Building2 size={16} aria-hidden="true" />
              הזמן נציג הארגון
            </button>
          )}

          {(isOrgAdmin || isSystemAdmin) && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setRosterOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-start text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)]"
            >
              <FileSpreadsheet size={16} aria-hidden="true" />
              טען רשימת עובדים
            </button>
          )}

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

      <RosterUploadModal
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        // Staff pick an organisation first; an org admin has only their own.
        asStaff={isSystemAdmin}
        onRequestNotify={(summary, forOrganizationId, importedAt) => {
          setImported(summary)
          setNotifyOrgId(forOrganizationId ?? null)
          setNotifySince(importedAt ?? null)
          setRosterOpen(false)
          setNotifyOpen(true)
        }}
      />

      <InviteRepresentativeModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <NotifyModal
        open={notifyOpen}
        imported={imported}
        organizationId={notifyOrgId}
        since={notifySince}
        onClose={() => {
          setNotifyOpen(false)
          setImported(null)
          setNotifyOrgId(null)
          setNotifySince(null)
        }}
      />
    </header>
  )
}
