import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  ShieldAlert,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import { RosterUploadModal } from '@/components/org/RosterUploadModal'
import { paths } from '@/routes/paths'
import { fieldErrors } from '@/schemas/auth'
import { EMPLOYEE_CSV, orgOnboardingSchema } from '@/schemas/orgAdmin'
import { completeOnboarding, loadInviteContext } from '@/lib/orgAdminApi'
import { LANDING_VARS } from './landingPalettes'

const EMPTY = {
  fullName: '',
  mobile: '',
  contactEmail: '',
  password: '',
  confirmPassword: '',
  organization: null,
  orgAddress: '',
  industry: '',
  companyNumber: '',
  employeeCount: '',
  extraNotes: '',
}

/**
 * Where an invitation email lands: the full onboarding form.
 *
 * The link carries tokens in the URL fragment, which the Supabase client
 * consumes on load. That leaves a session for an account with no password
 * yet, so this page both sets one and collects the organisation details.
 *
 * It is NOT wrapped in RedirectIfAuthenticated - the invitee arrives already
 * holding a session, and that guard would bounce them into the app before
 * they had a password.
 */
export function InviteAcceptPage() {
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const [status, setStatus] = useState('checking') // checking | ready | invalid
  const [context, setContext] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [csv, setCsv] = useState(null)
  const [csvError, setCsvError] = useState(null)
  const [done, setDone] = useState(null)
  const [rosterOpen, setRosterOpen] = useState(false)

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    let active = true
    loadInviteContext()
      .then((ctx) => {
        if (!active) return
        if (!ctx) return setStatus('invalid')
        setContext(ctx)
        setForm((f) => ({ ...f, ...ctx.prefill, contactEmail: ctx.email }))
        setStatus('ready')
      })
      .catch(() => active && setStatus('invalid'))
    return () => {
      active = false
    }
  }, [])

  const submit = useMutation({
    mutationFn: (details) =>
      completeOnboarding({ organizationId: context?.organizationId, details, csvFile: csv }),
    onSuccess: (result) => setDone(result),
  })

  function handleFile(file) {
    setCsvError(null)
    if (!file) return setCsv(null)
    if (file.size > EMPLOYEE_CSV.maxBytes) return setCsvError('הקובץ גדול מדי. הגודל המרבי הוא 2MB.')
    if (!/\.csv$/i.test(file.name)) return setCsvError('יש להעלות קובץ CSV.')
    setCsv(file)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const result = orgOnboardingSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setErrors({})
    submit.mutate(result.data)
  }

  if (done) {
    return (
      <Shell narrow>
        <Completed
          done={done}
          onLoadRoster={() => setRosterOpen(true)}
          onContinue={() => navigate(paths.app, { replace: true })}
        />
        <RosterUploadModal open={rosterOpen} onClose={() => setRosterOpen(false)} />
      </Shell>
    )
  }

  if (status === 'checking') {
    return (
      <Shell narrow>
        <p className="text-center text-sm text-[var(--l-muted)]">טוען…</p>
      </Shell>
    )
  }

  if (status === 'invalid') {
    return (
      <Shell narrow>
        <ShieldAlert size={36} className="mx-auto text-amber-600" aria-hidden="true" />
        <h1 className="mt-4 text-center text-xl font-bold text-[var(--l-ink)]">
          קישור ההזמנה אינו תקף
        </h1>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-[var(--l-muted)]">
          ייתכן שפג תוקפו או שכבר נעשה בו שימוש. יש לפנות אלינו לקבלת הזמנה חדשה.
        </p>
      </Shell>
    )
  }

  return (
    <div style={LANDING_VARS} className="min-h-screen bg-[var(--l-via)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <header>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--l-ink)]">
            <Building2 size={26} className="text-[var(--l-primary)]" aria-hidden="true" />
            רישום אדמין ארגוני
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--l-muted)]">
            מלא/י את כל הפרטים הנדרשים לרישום הארגון ובחר/י סיסמה לחשבון.
          </p>
        </header>

        <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <Section icon={UserRound} title="פרטי מנהל/ת המערכת">
            <Field
              label="שם מלא"
              name="fullName"
              required
              autoComplete="name"
              value={form.fullName}
              error={errors.fullName}
              onChange={set('fullName')}
            />
            <Field
              label="מספר נייד"
              name="mobile"
              required
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              placeholder="050-1234567"
              value={form.mobile}
              error={errors.mobile}
              onChange={set('mobile')}
            />
            <Field
              label={'כתובת דוא"ל'}
              name="contactEmail"
              required
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="email"
              hint="הכתובת שאליה נשלחה ההזמנה."
              value={form.contactEmail}
              error={errors.contactEmail}
              onChange={set('contactEmail')}
            />
          </Section>

          <Section icon={KeyRound} title="בחירת סיסמה">
            <Field
              label="סיסמה"
              name="password"
              required
              type="password"
              dir="ltr"
              autoComplete="new-password"
              hint="לפחות 8 תווים."
              value={form.password}
              error={errors.password}
              onChange={set('password')}
            />
            <Field
              label="אימות סיסמה"
              name="confirmPassword"
              required
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={set('confirmPassword')}
            />
          </Section>

          <Section icon={Building2} title="פרטי הארגון/הלקוח">
            <OrgAutocomplete
              label="שם הארגון"
              required
              value={form.organization}
              error={errors.organization}
              hint="יש לבחור מתוך מרשם החברות והעמותות."
              onChange={(organization) =>
                setForm((f) => ({
                  ...f,
                  organization,
                  companyNumber: organization?.registryId ?? '',
                }))
              }
            />
            <Field
              label="כתובת מלאה – רחוב, מספר, מיקוד, ת.ד"
              name="orgAddress"
              placeholder="רחוב, מספר, מיקוד, ת.ד"
              value={form.orgAddress}
              error={errors.orgAddress}
              onChange={set('orgAddress')}
            />
            <Field
              label="ענף/סוג עיסוק"
              name="industry"
              required
              placeholder="למשל: טכנולוגיה, בריאות, חינוך"
              value={form.industry}
              error={errors.industry}
              onChange={set('industry')}
            />
            <Field
              label="ח.פ/עוסק מורשה"
              name="companyNumber"
              dir="ltr"
              readOnly
              placeholder="מתמלא אוטומטית מהמרשם"
              hint="מתקבל מהמרשם לפי הארגון שנבחר."
              value={form.companyNumber}
              error={errors.companyNumber}
              onChange={set('companyNumber')}
            />
            <Field
              label="מספר עובדים ועובדות"
              name="employeeCount"
              dir="ltr"
              inputMode="numeric"
              placeholder="למשל: 50"
              value={form.employeeCount}
              error={errors.employeeCount}
              onChange={set('employeeCount')}
            />
            <Field
              label="מאפיינים נוספים"
              name="extraNotes"
              as="textarea"
              placeholder="מידע נוסף על הארגון"
              value={form.extraNotes}
              error={errors.extraNotes}
              onChange={set('extraNotes')}
            />
          </Section>

          <CsvSection
            csv={csv}
            error={csvError}
            inputRef={fileInput}
            onPick={handleFile}
            onClear={() => {
              setCsv(null)
              if (fileInput.current) fileInput.current.value = ''
            }}
          />

          {submit.error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {submit.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submit.isPending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-60"
          >
            {submit.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            סיום הרשמה
          </button>
        </form>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <fieldset className="rounded-2xl border border-[var(--l-ring)] bg-white p-6">
      <legend className="flex items-center gap-2 px-2 text-[15px] font-bold text-[var(--l-ink)]">
        <Icon size={18} className="text-[var(--l-primary)]" aria-hidden="true" />
        {title}
      </legend>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </fieldset>
  )
}

function CsvSection({ csv, error, inputRef, onPick, onClear }) {
  const required = EMPLOYEE_CSV.required.map((c) => '"' + c + '"').join(', ')
  const optional = EMPLOYEE_CSV.optional.map((c) => '"' + c + '"').join(', ')

  return (
    <fieldset className="rounded-2xl border border-[var(--l-ring)] bg-white p-6">
      <legend className="flex items-center gap-2 px-2 text-[15px] font-bold text-[var(--l-ink)]">
        <FileSpreadsheet size={18} className="text-[var(--l-primary)]" aria-hidden="true" />
        העלאת רשימת עובדים (אופציונלי)
      </legend>

      <p className="mt-3 text-sm leading-relaxed text-[var(--l-muted)]">
        ניתן להעלות קובץ CSV עם פרטי העובדים. העמודות הנדרשות הן: {required}. עמודות
        אופציונליות: {optional}.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={EMPLOYEE_CSV.accept}
        className="sr-only"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />

      {csv ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--l-soft)] px-4 py-3">
          <FileSpreadsheet size={18} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--l-ink)]">
            {csv.name}
          </span>
          <span className="shrink-0 text-xs text-[var(--l-muted)]">
            {Math.max(1, Math.round(csv.size / 1024))} KB
          </span>
          <button
            type="button"
            onClick={onClear}
            aria-label="הסרת הקובץ"
            className="shrink-0 rounded-full p-1 text-[var(--l-muted)] transition-colors hover:bg-white hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--l-ring)] px-4 py-6 text-sm font-medium text-[var(--l-primary)] transition-colors hover:border-[var(--l-primary)] hover:bg-[var(--l-soft)]"
        >
          <Upload size={17} aria-hidden="true" />
          בחירת קובץ CSV
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </fieldset>
  )
}

function Shell({ children, narrow }) {
  return (
    <div
      style={LANDING_VARS}
      className="flex min-h-screen items-center justify-center bg-[var(--l-via)] px-6 py-12"
    >
      <div
        className={`w-full rounded-2xl border border-[var(--l-ring)] bg-white p-8 ${
          narrow ? 'max-w-md' : 'max-w-2xl'
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- done */

/**
 * Onboarding finished. The roster result is shown here rather than on the
 * next page, because this is the only moment the admin knows which file they
 * just sent - a summary they land on later means nothing to them.
 */
function Completed({ done, onLoadRoster, onContinue }) {
  const summary = done.roster?.summary
  const skipped = done.roster?.skipped ?? []

  return (
    <div className="text-center">
      <CheckCircle2
        size={44}
        className="mx-auto text-[var(--l-primary)]"
        aria-hidden="true"
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--l-ink)]">
        הארגון נוצר
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[var(--l-muted)]">
        החשבון שלך מוכן. אפשר לטעון רשימת עובדים עכשיו או בכל שלב מאוחר יותר,
        מהתפריט העליון.
      </p>

      {summary && (
        <div className="mt-5 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3 text-sm text-[var(--l-ink)]">
          נטענו {summary.added ?? 0} עובדים לרשימה
          {skipped.length ? `, ${skipped.length} שורות דולגו` : ''}.
        </div>
      )}

      {done.rosterError && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3.5 text-start text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            הארגון נוצר, אך טעינת רשימת העובדים נכשלה: {done.rosterError} אפשר
            לנסות שוב מהכפתור למטה.
          </span>
        </p>
      )}

      <div className="mt-7 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onLoadRoster}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
        >
          <FileSpreadsheet size={17} aria-hidden="true" />
          {summary ? 'טעינת רשימה נוספת' : 'טען רשימת עובדים'}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--l-ring)] text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft)]/50"
        >
          המשך לאפליקציה
        </button>
      </div>
    </div>
  )
}
