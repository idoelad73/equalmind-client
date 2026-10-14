import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  FileSpreadsheet,
  HelpCircle,
  ListChecks,
  Home,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EqualmindMark } from '@/components/brand/EqualmindMark'
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
  // Every /app route is behind RequireAuth, so only a registered account
  // reaches this. Someone who is only on an employer's roster has no
  // account and no way in - their flags wait until they sign up.
  { to: paths.flags, label: 'הדגלים שלי', icon: Bell },
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

/**
 * 18rem = w-72. The page content offsets by the same amount (AppLayout),
 * and the closed drawer sits exactly one width out of view.
 */
const WIDTH = 'w-72'
const CLOSED = 'start-[-18rem]'

/* ------------------------------------------------------------- one row */

const rowBase = cn(
  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start',
  'text-[15px] font-medium transition-all duration-150',
  // Keyboard users get the same affordance mouse users get from hover.
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]',
)

/**
 * Selected rows lift onto white; the rest sit flat on the tinted panel.
 *
 * Depth rather than a block of colour: the panel is already green, so a
 * green active pill competes with it instead of standing out. A white card
 * with a hairline shadow reads as "in front" at any tint.
 */
const rowIdle =
  'text-[var(--l-muted)] hover:bg-white/70 hover:text-[var(--l-ink)]'
const rowActive =
  'bg-white text-[var(--l-ink)] shadow-[0_1px_3px_rgba(14,46,28,0.10)]'

/** The icon's own tile, so labels align whatever the glyph's width. */
function RowIcon({ icon: Icon, active }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-[var(--l-soft)] text-[var(--l-primary)]'
          : 'text-[var(--l-muted)] group-hover:text-[var(--l-primary)]',
      )}
    >
      <Icon size={17} aria-hidden="true" />
    </span>
  )
}

/** The marker on the inline edge of the selected row. */
function ActiveMark() {
  return (
    <span
      className="absolute inset-y-2.5 start-0 w-[3px] rounded-full bg-[var(--l-primary)]"
      aria-hidden="true"
    />
  )
}

/**
 * A group heading.
 *
 * Hebrew has no uppercase, so the usual small-caps section label does not
 * translate. Size, weight and colour carry the hierarchy instead.
 */
function GroupLabel({ children }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[11px] font-bold text-[var(--l-muted)]/70">
      {children}
    </p>
  )
}

/**
 * The brand mark, shared by the panel and the small-screen bar.
 *
 * The mark is the artwork from the browser tab, not a stand-in glyph. It
 * brings its own rounded-square background, so it is not wrapped in a
 * tinted tile - doing that would put a square inside a square.
 */
function Brand({ size = 'lg' }) {
  const px = size === 'lg' ? 36 : 32

  return (
    <Link to={paths.app} className="flex min-w-0 items-center gap-2.5">
      <EqualmindMark
        size={px}
        className="shrink-0 rounded-[7px] shadow-[0_2px_6px_rgba(14,46,28,0.18)]"
      />
      <span
        className={cn(
          'truncate font-extrabold tracking-tight text-[var(--l-ink)]',
          size === 'lg' ? 'text-[17px]' : 'text-base',
        )}
      >
        Equalmind
      </span>
    </Link>
  )
}

/**
 * The application's main navigation, as a panel down the side.
 *
 * It is fixed on large screens and a drawer below that, because a 288px
 * column on a phone leaves nothing for the page. The drawer slides on
 * `inset-inline-start` rather than a transform: that property is
 * direction-aware, so the panel enters from the right in Hebrew and from
 * the left in a left-to-right locale without a second rule. A
 * `translate-x` would need its sign flipped per direction and would be
 * wrong in exactly one of them.
 */
export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
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
  // The buttons are a convenience only - every roster route is gated server
  // side, so hiding one is not what protects anything.
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchMyProfile })
  const isOrgAdmin = profile.data?.user_type === 'org_admin'
  const isSystemAdmin = profile.data?.user_type === 'system_admin'
  const userTypeLabel = USER_TYPE_LABELS[profile.data?.user_type]
  const isStaff = isOrgAdmin || isSystemAdmin

  // A drawer that survives navigation would cover the page someone just
  // asked for. On large screens it is not a drawer and this does nothing.
  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await logout()
    useAuthStore.getState().clear()
    navigate(paths.landing, { replace: true })
  }

  const email = user?.email ?? ''
  const displayName = profile.data?.full_name?.trim() || email
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <>
      {/* Small screens only: something to open the panel from, and a home
          link, so the top of the page is never without either. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--l-ring)]/70 bg-white/80 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="main-sidebar"
          aria-label="פתיחת התפריט"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-primary)]"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Brand size="sm" />

        {/* Renders nothing unless the server says this account is staff. */}
        <div className="ms-auto">
          <MessagesBell />
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[var(--l-ink)]/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="main-sidebar"
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col',
          // A tint at the top fading to white at the foot: it separates the
          // panel from the page without a heavy border, and keeps the
          // account block at the bottom on plain white where it is legible.
          'bg-gradient-to-b from-[var(--l-from)] via-[var(--l-via)] to-white',
          'border-e border-[var(--l-ring)]/80',
          'transition-[inset-inline-start] duration-200 ease-out',
          WIDTH,
          open ? 'start-0' : CLOSED,
          // Always in view on the wide layout, whatever the drawer state is.
          'lg:start-0',
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-4">
          <Brand />

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="סגירת התפריט"
            className="ms-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--l-muted)] transition-colors hover:bg-white/70 hover:text-[var(--l-ink)] lg:hidden"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/*
          Sized to fit without scrolling: seven rows, the group heading and
          the account block clear a 700px-tall window with room to spare.

          overflow-y-auto stays as a floor, not as the normal case - a short
          window or a future row must never put the account block out of
          reach. The scrollbar itself is hidden because when it does appear
          it is a 4px sliver against a tinted panel, which reads as a
          rendering fault rather than as an affordance; the wheel, touch and
          keyboard all still scroll.
        */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(rowBase, isActive ? rowActive : rowIdle)}
            >
              {({ isActive }) => (
                <>
                  {isActive && <ActiveMark />}
                  <RowIcon icon={Icon} active={isActive} />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Outside the staff check on purpose: this component decides
              its own visibility from the server's answer, not from a
              cached profile. On the wide layout there is no header, so the
              queue lives here; below it the header carries it instead. One
              of the two is always hidden, and they share a query key, so
              only one is on screen and they make one request. */}
          <div className="hidden lg:block">
            <MessagesBell variant="sidebar" />
          </div>

          {isStaff && (
            <>
              <GroupLabel>ניהול</GroupLabel>

              {isSystemAdmin && (
                <NavLink
                  to={paths.hooks}
                  className={({ isActive }) => cn(rowBase, isActive ? rowActive : rowIdle)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <ActiveMark />}
                      <RowIcon icon={ListChecks} active={isActive} />
                      <span className="truncate">HOOKS של משתמשים</span>
                    </>
                  )}
                </NavLink>
              )}

              {isSystemAdmin && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className={cn(rowBase, rowIdle)}
                >
                  <RowIcon icon={Building2} />
                  <span className="truncate">הזמן נציג הארגון</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setRosterOpen(true)}
                className={cn(rowBase, rowIdle)}
              >
                <RowIcon icon={FileSpreadsheet} />
                <span className="truncate">טען רשימת עובדים</span>
              </button>
            </>
          )}
        </nav>

        {/* Who is signed in, and the way out. Last, because it is the thing
            someone looks for rather than navigates by - and on white, where
            an email at 13px stays readable. */}
        <div className="shrink-0 border-t border-[var(--l-ring)]/70 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-[var(--l-ring)]/70">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--l-soft)] text-sm font-bold text-[var(--l-primary)]"
              aria-hidden="true"
            >
              {initial}
            </span>

            <span className="min-w-0 flex-1">
              <span
                className="block truncate text-[13px] font-semibold text-[var(--l-ink)]"
                // The email identifies the account even when a name is
                // shown instead, so it stays one hover away.
                title={email}
              >
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-[var(--l-muted)]">
                {userTypeLabel ?? email}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              rowBase,
              'mt-1 text-[var(--l-muted)] hover:bg-red-50 hover:text-red-700',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <LogOut size={17} aria-hidden="true" />
            </span>
            התנתקות
          </button>
        </div>
      </aside>

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
    </>
  )
}
