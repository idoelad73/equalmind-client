import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Building2, CheckCircle2, ChevronRight, Loader2, ShieldCheck, UserRound } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import { paths } from '@/routes/paths'
import { fieldErrors } from '@/schemas/auth'
import { orgRequestSchema } from '@/schemas/orgAdmin'
import { submitOrgRequest } from '@/lib/orgAdminApi'
import { LANDING_VARS } from './landingPalettes'

const EMPTY = {
  fullName: '',
  mobile: '',
  contactEmail: '',
  organization: null,
  orgAddress: '',
  industry: '',
  companyNumber: '',
  employeeCount: '',
  extraNotes: '',
}

/**
 * Interest form for organisations. Deliberately not a signup: an org admin
 * account is created by invitation, after Equalmind has verified who the
 * organisation is and who may speak for it.
 */
export function OrgRequestPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = useMutation({ mutationFn: submitOrgRequest })

  function handleSubmit(event) {
    event.preventDefault()
    const result = orgRequestSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus(),
      )
      return
    }
    setErrors({})
    submit.mutate(result.data)
  }

  if (submit.isSuccess) return <Received onDone={() => navigate(paths.landing)} />

  return (
    <div style={LANDING_VARS} className="min-h-screen bg-[var(--l-via)]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          to={paths.landing}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--l-primary)] hover:underline"
        >
          <ChevronRight size={16} aria-hidden="true" />
          חזרה
        </Link>

        <header className="mt-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--l-ink)]">
            <Building2 size={26} className="text-[var(--l-primary)]" aria-hidden="true" />
            רישום ארגון
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--l-muted)]">
            השאירו פרטים ונחזור אליכם. חשבון מנהל.ת מערכת נפתח על ידינו לאחר
            אימות הארגון — לא בהרשמה עצמית.
          </p>
        </header>

        <div className="mt-6 flex gap-3 rounded-xl bg-[var(--l-soft)] px-4 py-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[var(--l-primary)]"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-[var(--l-ink)]">
            מנהל.ת מערכת רואה את הנתונים של הארגון, ולכן ההרשאה ניתנת רק לאחר
            אימות. בשלב הזה לא נוצר חשבון ולא נדרשת סיסמה.
          </p>
        </div>

        <form className="mt-8 flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
          <Section icon={UserRound} title="פרטי איש/אשת הקשר">
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
              hint="לכתובת הזו תישלח ההזמנה, אם הארגון יאושר."
              value={form.contactEmail}
              error={errors.contactEmail}
              onChange={set('contactEmail')}
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
              inputMode="numeric"
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

          {submit.error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {submit.error.message}
            </p>
          )}

          <div className="flex items-center justify-between gap-4">
            <Link
              to={paths.landing}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--l-ring)] bg-white px-5 text-[15px] font-medium text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft)]"
            >
              <ChevronRight size={16} aria-hidden="true" />
              חזור
            </Link>

            <button
              type="submit"
              disabled={submit.isPending}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--l-primary)] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-60"
            >
              {submit.isPending && (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              )}
              שליחת בקשה
            </button>
          </div>
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

function Received({ onDone }) {
  return (
    <div
      style={LANDING_VARS}
      className="flex min-h-screen items-center justify-center bg-[var(--l-via)] px-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--l-ring)] bg-white p-8 text-center">
        <CheckCircle2
          size={40}
          className="mx-auto text-[var(--l-primary)]"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-xl font-bold text-[var(--l-ink)]">הבקשה התקבלה</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--l-muted)]">
          נחזור אליכם לאימות פרטי הארגון. לאחר האימות תישלח הזמנה לפתיחת חשבון
          מנהל.ת מערכת.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--l-primary)] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
        >
          חזרה לדף הבית
        </button>
      </div>
    </div>
  )
}
