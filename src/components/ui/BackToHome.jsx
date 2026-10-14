import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'

/**
 * A way back to the home page from a leaf page.
 *
 * The chevron points RIGHT because the interface is Hebrew: in a
 * right-to-left reading order, back is the direction you came from, and
 * that is the right-hand side. WizardShell's back control points the same
 * way, so the two agree wherever someone meets them.
 *
 * Deliberately a Link and not navigate(-1): history could have come from
 * anywhere - a sign-in redirect, an invitation email, a deep link out of
 * an SMS - and "back" landing somewhere other than home would be a worse
 * answer than always landing home.
 */
export function BackToHome({ label = 'חזרה לדף הבית', className }) {
  return (
    <Link
      to={paths.app}
      className={cn(
        'inline-flex items-center gap-1 rounded-xl px-3 py-2',
        'text-sm font-semibold text-[var(--l-muted)] transition-colors',
        'hover:bg-[var(--l-soft)] hover:text-[var(--l-primary)]',
        className,
      )}
    >
      <ChevronRight size={17} aria-hidden="true" />
      {label}
    </Link>
  )
}
