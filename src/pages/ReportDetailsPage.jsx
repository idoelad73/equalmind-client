import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Image as ImageIcon, Info, Loader2, MapPin, Send, Upload, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WizardCard, WizardShell } from '@/components/report/WizardShell'
import { Filed, WhenField } from '@/components/report/ReportParts'
import { LocalityPicker } from '@/components/ui/LocalityPicker'
import { TargetField, WORK_TARGETS } from '@/components/report/TargetField'
import { BusinessPicker } from '@/components/report/BusinessPicker'
import { fetchBehaviors, submitReport, uploadPhoto } from '@/lib/reportsApi'
import { reportDetailsSchemaFor, toReportPayload } from '@/schemas/report'
import { fieldErrors } from '@/schemas/auth'
import { findSpace } from '@/lib/spaces'
import { paths } from '@/routes/paths'

const EMPTY = {
  locality: null,
  whenMode: 'unknown',
  occurredAt: '',
  occurredText: '',
  notes: '',
  // Collected in the work space only - see WORK_TARGETS below.
  targetType: '',
  targetName: '',
  targetWorkerId: '',
  // Collected in the consumption space only: the business replaces the
  // locality as the required "where" there.
  business: null,
  staffName: '',
  placeText: '',
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

  const title = `Hook ${space.possessive}`

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

  if (file.isSuccess) return <Filed space={space} title={title} step={3} />

  function submit(event) {
    event.preventDefault()

    // Per space: work asks who it is about, consumption which business.
    // The server applies the same rules from the behaviour row.
    const result = reportDetailsSchemaFor(key).safeParse({ ...form, behaviorId })
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      return
    }

    setErrors({})
    file.mutate()
  }

  const set = (patch) => setForm((current) => ({ ...current, ...patch }))

  // A work Hook is about a person or about the employer. The other spaces
  // describe a place, so they ask nothing of the sort.
  const asksWhoItIsAbout = key === 'work'
  // A consumption Hook is about a business: that is the required field,
  // and the business's own town stands in for the locality picker.
  const consumption = key === 'consumption'

  return (
    <WizardShell title={title} step={3} backTo={paths.space(key)}>
      <WizardCard>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--l-ink)]">כמעט סיימנו…</h2>
          <p className="mt-1 text-sm text-[var(--l-muted)]">הוספת פרטים אחרונים</p>
        </div>

        <div className="mt-5 rounded-xl bg-[var(--l-soft)]/60 p-4">
          <p className="text-xs font-semibold text-[var(--l-muted)]">ה-<bdi>Hook</bdi> שנבחר:</p>
          <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-[var(--l-ink)]">
            {behavior?.name}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-6" noValidate>
          {asksWhoItIsAbout && (
            <TargetField
              form={form}
              set={set}
              errors={errors}
              disabled={file.isPending}
              targets={WORK_TARGETS}
              legend="על מי/מה?"
            />
          )}

          {consumption ? (
            <>
              <BusinessPicker
                value={form.business}
                onChange={(business) => set({ business })}
                error={errors.business}
                disabled={file.isPending}
              />

              <TextField
                icon={UserRound}
                label="שם הנציג/ה או העובד/ת"
                placeholder="מי היה/תה במגע איתך"
                maxLength={120}
                value={form.staffName}
                onChange={(staffName) => set({ staffName })}
                disabled={file.isPending}
              />

              <TextField
                icon={MapPin}
                label="איפה פיזית זה קרה?"
                placeholder="מיקום, כתובת או תיאור המקום, למשל: בקופה"
                maxLength={200}
                value={form.placeText}
                onChange={(placeText) => set({ placeText })}
                disabled={file.isPending}
              />
            </>
          ) : (
            <LocalityPicker
              value={form.locality}
              onChange={(locality) => set({ locality })}
              error={errors.locality}
              disabled={file.isPending}
            />
          )}

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
              {consumption ? (
                <>כדי לשלוח את ה-<bdi>Hook</bdi>, יש למלא את שם העסק.</>
              ) : (
                <>
                  כדי לשלוח את ה-<bdi>Hook</bdi>, יש לבחור את היישוב (רשות מקומית) או להשתמש
                  בלחצן ״המיקום שלי״ לזיהוי אוטומטי.
                </>
              )}
            </span>
          </p>

          {file.isError && (
            <p role="alert" className="text-sm text-red-700">
              {file.error?.message ?? 'שליחת ה-Hook נכשלה. נסה/י שוב.'}
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
            {file.isPending ? 'שולח…' : 'שליחת Hook'}
          </button>
        </form>
      </WizardCard>
    </WizardShell>
  )
}

/* -------------------------------------------------------------- text field */

/** An optional one-line field with an icon in its label. */
function TextField({ icon: Icon, label, placeholder, maxLength, value, onChange, disabled }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--l-ink)]">
        <Icon size={15} className="text-[var(--l-muted)]" aria-hidden="true" />
        {label} <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
      </span>
      <input
        type="text"
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[var(--l-ring)] bg-white px-4 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]"
      />
    </label>
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
