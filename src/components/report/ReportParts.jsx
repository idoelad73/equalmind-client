import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardCard, WizardShell } from '@/components/report/WizardShell'
import { paths } from '@/routes/paths'

/*
 * Pieces shared by the catalogue details step and the custom Hook form.
 */

/* ------------------------------------------------------------------- when */

export function WhenField({ form, set, disabled }) {
  const options = [
    { mode: 'now', label: 'עכשיו', icon: Clock },
    { mode: 'exact', label: 'בחר/י תאריך ושעה', icon: CalendarClock },
  ]

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--l-ink)]">
        מתי <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
      </span>

      <div className="flex flex-wrap gap-2">
        {options.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            aria-pressed={form.whenMode === mode}
            onClick={() => set({ whenMode: form.whenMode === mode ? 'unknown' : mode })}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
              form.whenMode === mode
                ? 'border-[var(--l-primary)] bg-[var(--l-soft)] text-[var(--l-primary)]'
                : 'border-[var(--l-ring)] bg-white text-[var(--l-ink)] hover:border-[var(--l-primary)]',
            )}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}

        <input
          type="text"
          maxLength={120}
          disabled={disabled}
          value={form.occurredText}
          onChange={(event) =>
            set({ occurredText: event.target.value, whenMode: event.target.value ? 'text' : 'unknown' })
          }
          placeholder="או הקלד/י מתי זה קרה…"
          aria-label="מתי זה קרה"
          className="h-10 min-w-48 flex-1 rounded-lg border border-[var(--l-ring)] bg-white px-3 text-sm text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]"
        />
      </div>

      {form.whenMode === 'exact' && (
        <input
          type="datetime-local"
          disabled={disabled}
          value={form.occurredAt}
          max={new Date().toISOString().slice(0, 16)}
          onChange={(event) => set({ occurredAt: event.target.value })}
          aria-label="תאריך ושעה"
          className="h-11 w-full rounded-xl border border-[var(--l-ring)] bg-white px-4 text-[15px] text-[var(--l-ink)] outline-none focus:border-[var(--l-primary)]"
        />
      )}
    </div>
  )
}

/* --------------------------------------------------------------- filed */

export function Filed({ space, title, step, subtitle }) {
  return (
    <WizardShell title={title} step={step} subtitle={subtitle}>
      <WizardCard className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 size={44} className="text-[var(--l-primary)]" aria-hidden="true" />

        <div>
          <h2 className="text-xl font-bold text-[var(--l-ink)]">ה-<bdi>Hook</bdi> נשלח</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--l-muted)]">
            תודה. ה-<bdi>Hook</bdi> אנונימי כלפי הארגון — הארגון רואה את תוכן
            ה-<bdi>Hook</bdi> בלבד, לעולם לא מי שלח אותו.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            to={paths.space(space.key)}
            className="inline-flex h-11 items-center rounded-xl bg-[var(--l-primary)] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
          >
            <bdi>Hook</bdi> נוסף
          </Link>
          <Link
            to={paths.app}
            className="inline-flex h-11 items-center rounded-xl border border-[var(--l-ring)] px-5 text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft)]/50"
          >
            חזרה לבית
          </Link>
        </div>
      </WizardCard>
    </WizardShell>
  )
}
