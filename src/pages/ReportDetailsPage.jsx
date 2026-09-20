import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Info,
  Loader2,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardCard, WizardShell } from '@/components/report/WizardShell'
import { LocalityPicker } from '@/components/ui/LocalityPicker'
import { fetchBehaviors, submitReport, uploadPhoto } from '@/lib/reportsApi'
import { reportDetailsSchema, toReportPayload } from '@/schemas/report'
import { fieldErrors } from '@/schemas/auth'
import { findSpace } from '@/lib/spaces'
import { paths } from '@/routes/paths'

const EMPTY = {
  locality: null,
  whenMode: 'unknown',
  occurredAt: '',
  occurredText: '',
  notes: '',
}

/** Step three: the remaining details, then file the report. */
export function ReportDetailsPage() {
  const { space: key, behaviorId } = useParams()
  const space = findSpace(key)

  const [form, setForm] = useState(EMPTY)
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})

  // Same queryKey as step two, so arriving here from the list is a cache hit
  // and arriving by a pasted URL simply fetches.
  const catalogue = useQuery({
    queryKey: ['behaviors', key],
    queryFn: () => fetchBehaviors(key),
    enabled: Boolean(space),
    staleTime: 10 * 60_000,
  })

  const behavior = useMemo(
    () => catalogue.data?.behaviors.find((b) => b.id === behaviorId) ?? null,
    [catalogue.data, behaviorId],
  )

  // Object URLs leak until revoked, and a form can be re-picked many times.
  useEffect(() => {
    if (!photo) return setPreview(null)
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const file = useMutation({
    mutationFn: async () => {
      // The photo uploads only once the rest is valid, so abandoning the form
      // never leaves an orphaned asset on Cloudinary.
      const media = photo ? await uploadPhoto(photo) : null
      return submitReport(toReportPayload({ ...form, behaviorId }, media?.publicId))
    },
  })

  if (!space) return <Navigate to={paths.app} replace />

  const title = `דיווח ${space.possessive}`

  if (catalogue.isPending) {
    return (
      <WizardShell title={title} step={3} backTo={paths.space(key)}>
        <WizardCard className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--l-muted)]">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          טוען…
        </WizardCard>
      </WizardShell>
    )
  }

  // A behaviour id that is not in the catalogue is a stale or hand-typed URL.
  if (!catalogue.isError && !behavior) return <Navigate to={paths.space(key)} replace />

  if (file.isSuccess) return <Filed space={space} title={title} />

  function submit(event) {
    event.preventDefault()

    const result = reportDetailsSchema.safeParse({ ...form, behaviorId })
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      return
    }

    setErrors({})
    file.mutate()
  }

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  return (
    <WizardShell title={title} step={3} backTo={paths.space(key)}>
      <WizardCard>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--l-ink)]">כמעט סיימנו…</h2>
          <p className="mt-1 text-sm text-[var(--l-muted)]">הוספת פרטים אחרונים</p>
        </div>

        <div className="mt-5 rounded-xl bg-[var(--l-soft)]/60 p-4">
          <p className="text-xs font-semibold text-[var(--l-muted)]">הדיווח שנבחר:</p>
          <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-[var(--l-ink)]">
            {behavior?.name}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-6" noValidate>
          <LocalityPicker
            value={form.locality}
            onChange={(locality) => set({ locality })}
            error={errors.locality}
            disabled={file.isPending}
          />

          <WhenField form={form} set={set} disabled={file.isPending} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--l-ink)]">
              פרטים נוספים{' '}
              <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
            </span>
            <textarea
              rows={4}
              maxLength={1000}
              value={form.notes}
              disabled={file.isPending}
              onChange={(event) => set({ notes: event.target.value })}
              placeholder="הוסף/י פרטים נוספים שיכולים לעזור…"
              className="w-full resize-y rounded-xl border border-[var(--l-ring)] bg-white px-4 py-3 text-[15px] leading-relaxed text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]"
            />
          </label>

          <PhotoField
            photo={photo}
            preview={preview}
            onPick={setPhoto}
            disabled={file.isPending}
          />

          <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              כדי לשלוח את הדיווח, יש לבחור את היישוב (רשות מקומית) או להשתמש בלחצן
              ״המיקום שלי״ לזיהוי אוטומטי.
            </span>
          </p>

          {file.isError && (
            <p role="alert" className="text-sm text-red-700">
              {file.error?.message ?? 'שליחת הדיווח נכשלה. נסה/י שוב.'}
            </p>
          )}

          <button
            type="submit"
            disabled={file.isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-60"
          >
            {file.isPending ? (
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
            {file.isPending ? 'שולח…' : 'שליחת דיווח'}
          </button>
        </form>
      </WizardCard>
    </WizardShell>
  )
}

/* ------------------------------------------------------------------- when */

function WhenField({ form, set, disabled }) {
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

/* ------------------------------------------------------------------ photo */

function PhotoField({ photo, preview, onPick, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--l-ink)]">
        <ImageIcon size={15} className="text-[var(--l-muted)]" aria-hidden="true" />
        תמונה <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
      </span>

      {photo ? (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--l-ring)] bg-white p-3">
          <img
            src={preview}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
          <span className="flex-1 truncate text-sm text-[var(--l-ink)]" dir="ltr">
            {photo.name}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(null)}
            aria-label="הסרת התמונה"
            className="shrink-0 rounded-full p-1.5 text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-ink)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--l-ring)] bg-white py-7 transition-colors hover:border-[var(--l-primary)] hover:bg-[var(--l-soft)]/30',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <Upload size={20} className="text-[var(--l-muted)]" aria-hidden="true" />
          <span className="text-sm text-[var(--l-muted)]">העלאת תמונה (אופציונלי)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            disabled={disabled}
            className="sr-only"
            onChange={(event) => onPick(event.target.files?.[0] ?? null)}
          />
        </label>
      )}

      <p className="text-xs text-[var(--l-muted)]">
        נתוני המיקום והמכשיר שמוטבעים בתמונה נמחקים לפני השמירה.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- filed */

function Filed({ space, title }) {
  return (
    <WizardShell title={title} step={3}>
      <WizardCard className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 size={44} className="text-[var(--l-primary)]" aria-hidden="true" />

        <div>
          <h2 className="text-xl font-bold text-[var(--l-ink)]">הדיווח נשלח</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--l-muted)]">
            תודה. הדיווח אנונימי כלפי הארגון — הארגון רואה את תוכן
            הדיווח בלבד, לעולם לא מי שלח אותו.
          </p>
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            to={paths.space(space.key)}
            className="inline-flex h-11 items-center rounded-xl bg-[var(--l-primary)] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
          >
            דיווח נוסף
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
