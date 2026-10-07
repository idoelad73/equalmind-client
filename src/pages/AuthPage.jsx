import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoogleMark } from '@/components/auth/GoogleMark'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import { LocalityPicker } from '@/components/ui/LocalityPicker'
import { loginSchema, registerSchema, fieldErrors } from '@/schemas/auth'
import { login, register, loginWithGoogle } from '@/lib/authApi'
import { useAuthStore } from '@/store/authStore'
import { LANDING_VARS } from './landingPalettes'
import { paths } from '@/routes/paths'

const COPY = {
  login: {
    title: 'התחברות',
    lead: 'כתובת אימייל וסיסמה.',
    submit: 'התחברות',
    swapText: 'אין לך עדיין חשבון?',
    swapCta: 'להרשמה',
    swapTo: paths.register,
  },
  register: {
    title: 'הרשמה',
    lead: 'ההרשמה אנונימית. אנחנו לא מבקשים שם, טלפון או פרטים מזהים.',
    submit: 'יצירת חשבון',
    swapText: 'יש לך כבר חשבון?',
    swapCta: 'להתחברות',
    swapTo: paths.login,
  },
}

export function AuthPage({ mode = 'login' }) {
  const copy = COPY[mode]
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const [form, setForm] = useState({
    email: '',
    emailConfirm: '',
    password: '',
    residence: null,
    organization: null,
    fullName: '',
    phone: '',
    address: '',
    gender: undefined,
  })
  const [errors, setErrors] = useState({})

  const submit = useMutation({
    mutationFn: (credentials) =>
      mode === 'register' ? register(credentials) : login(credentials),
    onSuccess: (session) => {
      setSession(session)
      navigate(paths.app, { replace: true })
    },
  })

  const google = useMutation({ mutationFn: loginWithGoogle })

  function handleSubmit(event) {
    event.preventDefault()
    const schema = mode === 'register' ? registerSchema : loginSchema
    const result = schema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error))
      return
    }
    setErrors({})
    // Login ignores everything past the credentials; register carries the
    // rest through to signup metadata.
    submit.mutate(result.data)
  }

  const busy = submit.isPending || google.isPending
  const failure = submit.error?.message || google.error?.message

  return (
    <div style={LANDING_VARS} className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-14">
        <Link
          to={paths.landing}
          className="mb-10 self-center text-3xl font-extrabold tracking-tight text-[var(--l-primary)]"
        >
          Equalmind
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--l-ink)]">
          {copy.title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--l-muted)]">
          {copy.lead}
        </p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Field
            label="כתובת אימייל"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            error={errors.email}
            hint={
              mode === 'register'
                ? 'אפשר להשתמש בכתובת שאינה מזהה אותך.'
                : undefined
            }
            onChange={(email) => setForm((f) => ({ ...f, email }))}
          />
          {mode === 'register' && (
            <Field
              label="אימות כתובת אימייל"
              name="emailConfirm"
              type="email"
              inputMode="email"
              autoComplete="off"
              value={form.emailConfirm}
              error={errors.emailConfirm}
              hint="אין אימות במייל, לכן חשוב להקליד שוב ולוודא שאין שגיאת כתיב."
              onChange={(emailConfirm) => setForm((f) => ({ ...f, emailConfirm }))}
            />
          )}
          <Field
            label="סיסמה"
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={form.password}
            error={errors.password}
            hint={mode === 'register' ? 'לפחות 8 תווים.' : undefined}
            onChange={(password) => setForm((f) => ({ ...f, password }))}
          />

          {mode === 'register' && (
            <>
              <LocalityPicker
                label="מקום מגורים"
                value={form.residence}
                error={errors.residence}
                placeholder="התחל/י להקליד שם יישוב…"
                // The current position answers "where did this happen",
                // not "where do you live", so no geolocation button here.
                showDetect={false}
                onChange={(residence) => setForm((f) => ({ ...f, residence }))}
              />

              <OrgAutocomplete
                label="מקום העבודה"
                value={form.organization}
                allowManual
                hint="אופציונלי. עוזר לשייך Hooks למרחב הנכון, וניתן לשנות בכל עת בפרופיל."
                onChange={(organization) => setForm((f) => ({ ...f, organization }))}
              />

              <fieldset className="flex flex-col gap-4 rounded-xl border border-[var(--l-ring)] p-4">
                <legend className="px-1.5 text-sm font-medium text-[var(--l-ink)]">
                  פרטים נוספים{' '}
                  <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
                </legend>

                <p className="-mt-1 text-xs leading-relaxed text-[var(--l-muted)]">
                  אפשר לדלג על כולם. הם אינם נחשפים לארגון ואינם מופיעים לצד
                  ה-<bdi>Hooks</bdi> — מספר נייד משמש לשיוך לארגון שלך ולעדכונים בעתיד.
                </p>

                <Field
                  label="שם מלא"
                  name="fullName"
                  value={form.fullName}
                  error={errors.fullName}
                  autoComplete="name"
                  onChange={(fullName) => setForm((f) => ({ ...f, fullName }))}
                />

                <Field
                  label="מספר נייד"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  error={errors.phone}
                  hint="אם הארגון שלך העלה רשימת עובדים, המספר ישייך אותך אליו."
                  onChange={(phone) => setForm((f) => ({ ...f, phone }))}
                />

                <Field
                  label="כתובת"
                  name="address"
                  value={form.address}
                  error={errors.address}
                  autoComplete="street-address"
                  onChange={(address) => setForm((f) => ({ ...f, address }))}
                />

                <GenderField
                  value={form.gender}
                  error={errors.gender}
                  onChange={(gender) => setForm((f) => ({ ...f, gender }))}
                />
              </fieldset>
            </>
          )}

          {failure && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {failure}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-60"
          >
            {submit.isPending && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            {copy.submit}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--l-ring)]" />
          <span className="text-xs font-medium text-[var(--l-muted)]">או</span>
          <span className="h-px flex-1 bg-[var(--l-ring)]" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => google.mutate()}
          className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--l-ring)] bg-white text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <GoogleMark />
          המשך עם Google
        </button>

        {mode === 'register' && (
          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-[var(--l-muted)]">
            <ShieldCheck
              size={14}
              className="mt-0.5 shrink-0 text-[var(--l-primary)]"
              aria-hidden="true"
            />
            <span>
              ה-<bdi>Hooks</bdi> שלך אנונימיים כלפי הארגון. הארגון לעולם לא יידע
              מי שלח <bdi>Hook</bdi> — וגם לא מי שדווח עליו.
            </span>
          </p>
        )}

        <p className="mt-10 text-center text-sm text-[var(--l-muted)]">
          {copy.swapText}{' '}
          <Link
            to={copy.swapTo}
            className="inline-flex items-center gap-1 font-semibold text-[var(--l-primary)] hover:underline"
          >
            {copy.swapCta}
            <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', value, error, hint, autoComplete, inputMode, onChange }) {
  const id = `field-${name}`
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--l-ink)]">{label}</span>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        dir="ltr"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="h-12 rounded-xl border border-[var(--l-ring)] px-3 text-start text-[15px] outline-none transition-colors focus:border-[var(--l-primary)]"
      />
      {error ? (
        <span id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-xs text-[var(--l-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

/* --------------------------------------------------------------- gender */

const GENDERS = [
  { value: 'female', label: 'נקבה' },
  { value: 'male', label: 'זכר' },
  { value: 'not_relevant', label: 'לא רלוונטי' },
]

/**
 * Radios rather than a select: three options, all of which should be visible
 * without opening anything. "לא רלוונטי" is a real answer and sits level with
 * the other two - it is not the absence of one. Leaving the whole group
 * untouched is what means "did not say", which is why none is preselected.
 */
function GenderField({ value, error, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-[var(--l-ink)]">מגדר</legend>

      <div className="mt-2 flex flex-wrap gap-2">
        {GENDERS.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors',
                selected
                  ? 'border-[var(--l-primary)] bg-[var(--l-soft)] font-semibold text-[var(--l-primary)]'
                  : 'border-[var(--l-ring)] text-[var(--l-ink)] hover:bg-[var(--l-soft)]/40',
              )}
            >
              <input
                type="radio"
                name="gender"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="h-3.5 w-3.5 accent-[var(--l-primary)]"
              />
              {option.label}
            </label>
          )
        })}

        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-sm text-[var(--l-muted)] underline-offset-2 hover:underline"
          >
            ניקוי
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  )
}
