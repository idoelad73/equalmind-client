import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { loginSchema } from '@/schemas/auth'

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      setErrors(z_fieldErrors(result.error))
      return
    }
    setErrors({})
    // TODO: POST /api/auth/login, then useAuthStore.setSession(...)
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">התחברות</h1>
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Field
          label="אימייל"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(email) => setForm((f) => ({ ...f, email }))}
        />
        <Field
          label="סיסמה"
          type="password"
          value={form.password}
          error={errors.password}
          onChange={(password) => setForm((f) => ({ ...f, password }))}
        />
        <Button type="submit" size="lg" className="mt-2">
          התחבר
        </Button>
      </form>
    </div>
  )
}

function Field({ label, type, value, error, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:border-brand-500"
        aria-invalid={Boolean(error)}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  )
}

// Flatten a ZodError into { fieldName: firstMessage }.
function z_fieldErrors(error) {
  return Object.fromEntries(
    error.issues.map((issue) => [issue.path[0], issue.message]),
  )
}
