import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { GoogleMark } from '@/components/auth/GoogleMark'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
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
    organization: null,
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
    const { email, password, organization } = result.data
    submit.mutate({ email, password, organization })
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
            <OrgAutocomplete
              label="מקום העבודה"
              value={form.organization}
              allowManual
              hint="אופציונלי. עוזר לשייך דיווחים למרחב הנכון, וניתן לשנות בכל עת בפרופיל."
              onChange={(organization) => setForm((f) => ({ ...f, organization }))}
            />
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
              הדיווחים שלך אינם נשמרים לצד החשבון. גם מי שרואה את מסד הנתונים
              אינו יכול לקשר בין דיווח לבין המשתמש שכתב אותו.
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
