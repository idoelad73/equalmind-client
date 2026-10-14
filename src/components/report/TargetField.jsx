import { Building2, Landmark, Store, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkerPicker } from '@/components/report/WorkerPicker'

/**
 * Who a Hook is about.
 *
 * Shared by the custom Hook form and the work-space catalogue form, so the
 * rule for choosing a person is written once. The two forms differ only in
 * which options they offer: a work Hook is about a colleague or about the
 * employer, while a custom Hook can also be about a local authority or a
 * business.
 *
 * The employee option opens WorkerPicker, which lists the organisation's
 * own people - roster rows included, so somebody the employer uploaded but
 * who never signed up can still be named. The id is what the server trusts;
 * the name beside it is re-read server-side from the same list, so a client
 * cannot attach one person's id to another's name.
 */
export const ALL_TARGETS = [
  { type: 'employee', label: 'עובד/ת', icon: UserRound },
  { type: 'my_org', label: 'הארגון שלי', icon: Building2 },
  { type: 'local_authority', label: 'רשות מקומית', icon: Landmark },
  { type: 'business', label: 'עסק', icon: Store },
]

/** A work-space Hook is about a person at work, or about the employer. */
export const WORK_TARGETS = ALL_TARGETS.filter((t) =>
  t.type === 'employee' || t.type === 'my_org',
)

export function TargetField({
  form,
  set,
  errors = {},
  disabled,
  targets = ALL_TARGETS,
  legend = 'על מי?',
  required = true,
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-[var(--l-ink)]">
        {legend}{' '}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </legend>

      {targets.map(({ type, label, icon: Icon }) => {
        const selected = form.targetType === type
        return (
          <div
            key={type}
            className={cn(
              'rounded-xl border transition-colors',
              selected
                ? 'border-[var(--l-primary)] bg-[var(--l-soft)]/40'
                : 'border-[var(--l-ring)] bg-white hover:border-[var(--l-primary)]',
            )}
          >
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input
                type="radio"
                name="targetType"
                value={type}
                checked={selected}
                disabled={disabled}
                // A name typed or picked for one target is wrong for another.
                onChange={() => set({ targetType: type, targetName: '', targetWorkerId: '' })}
                className="h-4 w-4 accent-[var(--l-primary)]"
              />
              <Icon size={16} className="text-[var(--l-muted)]" aria-hidden="true" />
              <span className="text-[15px] font-medium text-[var(--l-ink)]">{label}</span>
            </label>

            {selected && type === 'employee' && (
              <WorkerPicker
                workerId={form.targetWorkerId}
                name={form.targetName}
                onPick={(worker) => set({ targetWorkerId: worker.id, targetName: worker.fullName })}
                onType={(targetName) => set({ targetName, targetWorkerId: '' })}
                error={errors.targetName}
                disabled={disabled}
              />
            )}

            {selected && type === 'business' && (
              <NameInput
                value={form.targetName}
                onChange={(targetName) => set({ targetName })}
                placeholder="שם העסק (אופציונלי)"
                disabled={disabled}
              />
            )}
          </div>
        )
      })}

      <FieldError message={errors.targetType} />
    </fieldset>
  )
}

function NameInput({ value, onChange, placeholder, hint, error, disabled }) {
  return (
    <div className="flex flex-col gap-1 px-4 pb-3">
      <input
        type="text"
        maxLength={120}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 w-full rounded-xl border bg-white px-4 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]',
          error ? 'border-red-400' : 'border-[var(--l-ring)]',
        )}
      />
      {hint && <p className="text-xs text-[var(--l-muted)]">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs text-red-700">{message}</p>
}
