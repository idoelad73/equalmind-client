import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'
import { LANDING_VARS } from '@/pages/landingPalettes'

export const WIZARD_STEPS = 3

/**
 * The frame every step of the report wizard sits in: the landing page's
 * palette and backdrop, the heading, and the progress bar.
 *
 * The negative margins undo the AppLayout padding so the backdrop reaches the
 * edges, the same way the about page does it.
 */
export function WizardShell({ title, step, backTo, backLabel = 'חזרה', children }) {
  return (
    <div
      style={LANDING_VARS}
      className="relative -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden bg-white px-4 py-10 sm:px-8"
    >
      <CommunityBackdrop />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start gap-3">
          {backTo && (
            <Link
              to={backTo}
              aria-label={backLabel}
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-primary)]"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          )}

          <div className="flex-1 text-center">
            <h1 className="text-[clamp(1.35rem,4vw,1.75rem)] font-extrabold tracking-tight text-balance text-[var(--l-ink)]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[var(--l-muted)]">
              שלב {step} מתוך {WIZARD_STEPS}
            </p>
          </div>

          {/* Balances the back button so the title stays optically centred. */}
          {backTo && <span className="mt-1 h-9 w-9 shrink-0" aria-hidden="true" />}
        </header>

        <ProgressBar step={step} />

        {children}
      </div>
    </div>
  )
}

function ProgressBar({ step }) {
  return (
    <div
      className="flex gap-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={WIZARD_STEPS}
      aria-label={`שלב ${step} מתוך ${WIZARD_STEPS}`}
    >
      {Array.from({ length: WIZARD_STEPS }, (_, index) => (
        <span
          key={index}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            index < step ? 'bg-[var(--l-primary)]' : 'bg-[var(--l-ring)]',
          )}
        />
      ))}
    </div>
  )
}

/** The white card each step's content sits on. */
export function WizardCard({ className, children }) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/95 p-6 shadow-[0_1px_3px_rgba(14,46,28,0.06)] ring-1 ring-[var(--l-ring)] backdrop-blur-sm sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
