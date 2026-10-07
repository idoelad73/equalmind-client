import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, Info, Landmark, Loader2, Plus, Store, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardCard, WizardShell } from '@/components/report/WizardShell'
import { Filed, WhenField } from '@/components/report/ReportParts'
import { LocalityPicker } from '@/components/ui/LocalityPicker'
import { fetchBehaviors, submitCustomReport } from '@/lib/reportsApi'
import { customReportSchema, NEW_CATEGORY, toCustomReportPayload } from '@/schemas/report'
import { fieldErrors } from '@/schemas/auth'
import { findSpace } from '@/lib/spaces'
import { paths } from '@/routes/paths'

const SUBTITLE = 'הוספת Hook חדש'

const TARGETS = [
  { type: 'employee', label: 'עובד/ת', icon: UserRound },
  { type: 'my_org', label: 'הארגון שלי', icon: Building2 },
  { type: 'local_authority', label: 'רשות מקומית', icon: Landmark },
  { type: 'business', label: 'עסק', icon: Store },
]

const EMPTY = {
  description: '',
  category: '',
  newCategory: '',
  targetType: '',
  targetName: '',
  locality: null,
  whenMode: 'unknown',
  occurredAt: '',
  occurredText: '',
  notes: '',
}

/**
 * "The Hook is not on the list, I want to add one."
 *
 * Reached from step one, the full-list modal or step two. There is no
 * catalogue row, so this form asks for what that row would have supplied:
 * a one-line description, and who the Hook is about.
 */
export function CustomReportPage() {
  const { space: key } = useParams()
  const space = findSpace(key)

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  // Same queryKey as steps one and two, so coming from there is a cache hit.
  const catalogue = useQuery({
    queryKey: ['behaviors', key],
    queryFn: () => fetchBehaviors(key),
    enabled: Boolean(space),
    staleTime: 10 * 60_000,
  })

  const file = useMutation({
    mutationFn: () => submitCustomReport(toCustomReportPayload(key, form)),
  })

  if (!space) return <Navigate to={paths.app} replace />

  const title = `Hook ${space.possessive}`

  if (file.isSuccess) return <Filed space={space} title={title} subtitle={SUBTITLE} />

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  function submit(event) {
    event.preventDefault()

    const result = customReportSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      return
    }

    setErrors({})
    file.mutate()
  }

  return (
    <WizardShell title={title} subtitle={SUBTITLE} backTo={paths.space(key)}>
      <WizardCard>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--l-ink)]">
            יצירת <bdi>Hook</bdi> חדש
          </h2>
          <p className="mt-1 text-sm text-[var(--l-muted)]">
            הוספ/י <bdi>Hook</bdi> שלא קיים במערכת
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-6" noValidate>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--l-ink)]">
              תאר/י במשפט את ה-<bdi>Hook</bdi> להוספה{' '}
              <span className="text-red-600" aria-hidden="true">*</span>
            </span>
            <textarea
              rows={2}
              maxLength={200}
              value={form.description}
              disabled={file.isPending}
              onChange={(event) => set({ description: event.target.value })}
              placeholder="לדוגמה: מעיר/ה בציניות על משימה שעשיתי"
              aria-invalid={Boolean(errors.description)}
              className={inputClass(errors.description)}
            />
            <FieldError message={errors.description} />
          </label>

          <CategoryField
            categories={catalogue.data?.categories ?? []}
            loading={catalogue.isPending}
            form={form}
            set={set}
            errors={errors}
            disabled={file.isPending}
          />

          <TargetField
            form={form}
            set={set}
            errors={errors}
            disabled={file.isPending}
          />

          <WhenField form={form} set={set} disabled={file.isPending} />

          <LocalityPicker
            label="מיקום"
            value={form.locality}
            onChange={(locality) => set({ locality })}
            error={errors.locality}
            disabled={file.isPending}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--l-ink)]">
              מה היה? איפה? מי עוד נכח/ה? איך זה הרגיש?{' '}
              <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
            </span>
            <textarea
              rows={4}
              maxLength={1000}
              value={form.notes}
              disabled={file.isPending}
              onChange={(event) => set({ notes: event.target.value })}
              placeholder="ספר/י לנו עוד…"
              className={inputClass()}
            />
          </label>

          <Reminder />

          {file.isError && (
            <p role="alert" className="text-sm text-red-700">
              {file.error?.message ?? 'שליחת ה-Hook נכשלה. נסה/י שוב.'}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Link
              to={paths.space(key)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-[var(--l-ring)] text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft)]/50"
            >
              ביטול
            </Link>
            <button
              type="submit"
              disabled={file.isPending}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-60"
            >
              {file.isPending ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={17} aria-hidden="true" />
              )}
              {file.isPending ? 'שולח…' : <bdi>Hook it!</bdi>}
            </button>
          </div>
        </form>
      </WizardCard>
    </WizardShell>
  )
}

/* -------------------------------------------------------------- category */

/**
 * The space's existing categories, plus "אחר" with a name of its own.
 *
 * Asked here because a catalogue behaviour cannot exist without a category,
 * and the reporter knows best what kind of moment it was. The reviewer can
 * still change it at approval.
 */
function CategoryField({ categories, loading, form, set, errors, disabled }) {
  const options = [
    ...categories.map((c) => ({ value: c.key, label: c.label })),
    { value: NEW_CATEGORY, label: categories.length ? 'אחר' : 'קטגוריה חדשה' },
  ]

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-[var(--l-ink)]">
        קטגוריה <span className="text-red-600" aria-hidden="true">*</span>
      </legend>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[var(--l-muted)]">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          טוען קטגוריות…
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = form.category === option.value
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => set({ category: option.value })}
                className={cn(
                  'inline-flex h-10 items-center rounded-lg border px-3.5 text-sm font-medium transition-colors',
                  selected
                    ? 'border-[var(--l-primary)] bg-[var(--l-soft)] text-[var(--l-primary)]'
                    : 'border-[var(--l-ring)] bg-white text-[var(--l-ink)] hover:border-[var(--l-primary)]',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}

      {form.category === NEW_CATEGORY && (
        <>
          <input
            type="text"
            maxLength={80}
            value={form.newCategory}
            disabled={disabled}
            onChange={(event) => set({ newCategory: event.target.value })}
            placeholder="שם הקטגוריה, לדוגמה: תחבורה ציבורית"
            aria-label="שם הקטגוריה החדשה"
            aria-invalid={Boolean(errors.newCategory)}
            className={cn(inputClass(errors.newCategory), 'h-10 py-0')}
          />
          <FieldError message={errors.newCategory} />
        </>
      )}

      <FieldError message={errors.category} />
    </fieldset>
  )
}

/* ---------------------------------------------------------------- target */

function TargetField({ form, set, errors, disabled }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-[var(--l-ink)]">
        על מי? <span className="text-red-600" aria-hidden="true">*</span>
      </legend>

      {TARGETS.map(({ type, label, icon: Icon }) => {
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
                onChange={() => set({ targetType: type })}
                className="h-4 w-4 accent-[var(--l-primary)]"
              />
              <Icon size={16} className="text-[var(--l-muted)]" aria-hidden="true" />
              <span className="text-[15px] font-medium text-[var(--l-ink)]">{label}</span>
            </label>

            {selected && type === 'employee' && (
              <NameInput
                value={form.targetName}
                onChange={(targetName) => set({ targetName })}
                placeholder="הקלד/י את שם העובד/ת"
                hint="השם לא מוצג למנהלי הארגון."
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
        className={cn(inputClass(error), 'h-10 py-0')}
      />
      {hint && <p className="text-xs text-[var(--l-muted)]">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

/* -------------------------------------------------------------- reminder */

/**
 * Worded to match what the system actually does: a Hook is anonymous to the
 * organisation, not to Equalmind (see the header of migration 011).
 */
function Reminder() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-sky-50 p-4 text-[13px] leading-relaxed text-sky-950 ring-1 ring-sky-200">
      <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-bold">חשוב לזכור</p>
        <ol className="mt-1 list-decimal ps-4">
          <li>
            ה-<bdi>Hooks</bdi> אנונימיים כלפי הארגון — הארגון לעולם לא יידע מי
            תרם אותם.
          </li>
          <li>
            ה-<bdi>FLAGS</bdi> אישיים, ורק מי שמקבל אותם יכול לראות אותם.
          </li>
        </ol>
        <p className="mt-2">
          למה? כי הכוונה של איקואלמיינד היא לחזק התנהגויות חיוביות ולעזור
          לא.נשים להשתפר כשצריך — לא ׳להעניש׳ אותם.
        </p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- shared */

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs text-red-700">{message}</p>
}

function inputClass(error) {
  return cn(
    'w-full resize-y rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]',
    error ? 'border-red-400' : 'border-[var(--l-ring)]',
  )
}
