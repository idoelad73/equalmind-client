import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import { Building2, Check, CircleAlert, Loader2, Mail, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'
import { OrgAutocomplete } from '@/components/ui/OrgAutocomplete'
import { inviteRepresentative } from '@/lib/orgAdminApi'
import { emailSchema } from '@/schemas/auth'
import { LANDING_VARS } from '@/pages/landingPalettes'

/**
 * Invite someone to represent their organisation. Equalmind staff only.
 *
 * One field, required, and nothing else: the representative declares the
 * organisation themselves on the form the invitation opens. Asking here for
 * details they are about to type anyway would only create two versions of
 * them to disagree.
 */
export function InviteRepresentativeModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState(null)
  const [error, setError] = useState(null)
  const [orgError, setOrgError] = useState(null)
  const dialogRef = useRef(null)
  const inputRef = useRef(null)

  const invite = useMutation({
    mutationFn: () =>
      inviteRepresentative(email.trim().toLowerCase(), organization, name.trim()),
  })

  useEffect(() => {
    if (open) return
    setEmail('')
    setName('')
    setOrganization(null)
    setError(null)
    setOrgError(null)
    invite.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && !invite.isPending && onClose()
    document.addEventListener('keydown', onKey)
    // Focus the one field, since it is the only thing to do here.
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, invite.isPending])

  if (!open) return null

  function submit(event) {
    event.preventDefault()

    const parsed = emailSchema.safeParse(email)
    const emailProblem = parsed.success
      ? null
      : (parsed.error.issues[0]?.message ?? 'כתובת אימייל לא תקינה')

    // A typed name is not a selection: without a registry number there is
    // nothing to resolve the organisation by, and a near-duplicate row under
    // a slightly different spelling is exactly what migration 012 removed.
    const orgProblem = organization?.registryId ? null : 'יש לבחור ארגון מתוך המרשם'

    // Both reported at once, so a second attempt is not needed to discover
    // the second mistake.
    setError(emailProblem)
    setOrgError(orgProblem)
    if (emailProblem || orgProblem) return

    invite.mutate()
  }

  return createPortal(
    <div
      style={LANDING_VARS}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !invite.isPending && onClose()
      }
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-rep-title"
        tabIndex={-1}
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="relative overflow-hidden bg-gradient-to-b from-[var(--l-from)] to-white">
          <CommunityBackdrop />

          <div className="relative flex items-start gap-3.5 px-6 pt-6 pb-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--l-primary)] shadow-[0_1px_2px_rgba(14,46,28,0.08)] ring-1 ring-[var(--l-ring)] backdrop-blur-sm">
              <Building2 size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="flex-1 pt-0.5">
              <h2
                id="invite-rep-title"
                className="text-[19px] font-extrabold tracking-tight text-[var(--l-ink)]"
              >
                הזמנת נציג ארגון
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--l-muted)]">
                ההזמנה תיפתח עבורו בטופס הרשמה של נציג.ת ארגון.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={invite.isPending}
              aria-label="סגירה"
              className="shrink-0 rounded-full bg-white/70 p-1.5 text-[var(--l-muted)] backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--l-ink)] disabled:opacity-40"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {invite.isSuccess ? (
          <Sent
            email={invite.data.email}
            organization={invite.data.organization?.name}
            onClose={onClose}
            onAgain={() => {
              setOrganization(null)
              setEmail('')
              setName('')
              invite.reset()
            }}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5 px-6 py-6" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--l-ink)]">
                כתובת אימייל <span className="font-normal text-[var(--l-muted)]">(חובה)</span>
              </span>

              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--l-muted)]"
                  aria-hidden="true"
                />
                <input
                  ref={inputRef}
                  type="email"
                  dir="ltr"
                  inputMode="email"
                  autoComplete="off"
                  value={email}
                  disabled={invite.isPending}
                  aria-invalid={Boolean(error)}
                  placeholder="name@company.co.il"
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError(null)
                  }}
                  className={cn(
                    'h-11 w-full rounded-xl border bg-white pe-10 ps-4 text-left text-[15px] text-[var(--l-ink)] outline-none transition-colors',
                    error
                      ? 'border-red-400'
                      : 'border-[var(--l-ring)] focus:border-[var(--l-primary)]',
                  )}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--l-ink)]">
                שם הנציג.ה <span className="font-normal text-[var(--l-muted)]">(אופציונלי)</span>
              </span>
              <input
                type="text"
                maxLength={80}
                autoComplete="off"
                value={name}
                disabled={invite.isPending}
                placeholder="לפנייה אישית במייל ההזמנה"
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--l-ring)] bg-white px-4 text-[15px] text-[var(--l-ink)] outline-none transition-colors focus:border-[var(--l-primary)]"
              />
            </label>

            <OrgAutocomplete
              label="מקום העבודה"
              required
              value={organization}
              error={orgError}
              hint="יש לבחור מתוך מרשם החברות והעמותות."
              onChange={(next) => {
                setOrganization(next)
                setOrgError(null)
              }}
            />

            <p className="rounded-xl bg-[var(--l-soft)]/50 p-3.5 text-[13px] leading-relaxed text-[var(--l-ink)]/80">
              ההזמנה מעניקה הרשאת נציג.ת ארגון עבור הארגון שנבחר כאן. שאר הפרטים —
              כתובת, ענף, מספר עובדים — ימולאו על ידי הנציג.ה בטופס שייפתח.
            </p>

            {invite.isError && (
              <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
                <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {invite.error?.message ?? 'שליחת ההזמנה נכשלה.'}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={invite.isPending || !email.trim() || !organization?.registryId}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
              >
                {invite.isPending ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send size={16} aria-hidden="true" />
                )}
                {invite.isPending ? 'שולח…' : 'שליחת הזמנה'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={invite.isPending}
                className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)]/50 disabled:opacity-50"
              >
                ביטול
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

function Sent({ email, organization, onClose, onAgain }) {
  return (
    <div className="px-6 py-8 text-center">
      <Check size={38} className="mx-auto text-[var(--l-primary)]" aria-hidden="true" />

      <p className="mt-3 text-[15px] font-semibold text-[var(--l-ink)]">ההזמנה נשלחה</p>
      <p className="mt-1 text-sm text-[var(--l-muted)]" dir="ltr">
        {email}
      </p>
      {organization && (
        <p className="mt-0.5 text-sm font-medium text-[var(--l-ink)]">{organization}</p>
      )}

      {/* Supabase's built-in sender only reaches project team addresses, and
          a message it silently drops looks exactly like one it delivered.
          Saying so here is cheaper than the admin discovering it days later. */}
      <p className="mx-auto mt-4 max-w-sm rounded-xl bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
        אם לא הוגדר שרת SMTP ייעודי, Supabase שולחת רק לכתובות של חברי הפרויקט.
        כדאי לוודא מול הנציג.ה שההזמנה התקבלה.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex h-11 items-center rounded-xl bg-[var(--l-primary)] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
        >
          הזמנה נוספת
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-xl border border-[var(--l-ring)] px-5 text-[15px] font-semibold text-[var(--l-ink)] transition-colors hover:bg-[var(--l-soft)]/50"
        >
          סגירה
        </button>
      </div>
    </div>
  )
}
