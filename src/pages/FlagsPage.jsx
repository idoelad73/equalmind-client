import { Link } from 'react-router-dom'
import { Bell, Flag } from 'lucide-react'
import { paths } from '@/routes/paths'

/**
 * "הדגלים שלי" - the personal feedback a person receives once enough Hooks
 * about them form a pattern.
 *
 * Only the empty state for now: flags come from the alert engine, which is
 * not built yet (see Status in CLAUDE.md). When it is, this page reads the
 * signed-in user's own flags and nothing else - flags are personal, and the
 * about page promises that not even their manager sees them.
 *
 * Registered accounts only, by construction: the route sits under
 * RequireAuth. Someone who is only on an employer's roster has no account,
 * so their flags wait until they sign up.
 */
export function FlagsPage() {
  return (
    <section className="flex flex-col items-center gap-8 py-4">
      <header className="flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--l-primary)] text-white shadow-[0_4px_14px_rgba(21,128,61,0.30)]">
          <Bell size={28} aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-[var(--l-ink)]">
          הדגלים שלי
        </h1>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-[var(--l-muted)]">
          כאן תוכל/י לראות משוב אישי על התנהגויות שדווחו
        </p>
      </header>

      <div className="flex w-full max-w-2xl flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(14,46,28,0.06)] ring-1 ring-[var(--l-ring)]">
        <Flag size={44} strokeWidth={1.5} className="text-[var(--l-muted)]/70" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-bold text-[var(--l-ink)]">עדיין אין דגלים ירוקים</h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--l-muted)]">
          כשאנשים בסביבתך יתרמו מספיק תצפיות, תקבל/י כאן דגל ירוק עם משוב מותאם
          אישית.
        </p>
        <Link
          to={paths.app}
          className="mt-6 inline-flex h-10 items-center rounded-xl border border-[var(--l-primary)]/40 px-5 text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)]/60"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </section>
  )
}
