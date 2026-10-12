import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { BellOff, Check, CircleAlert, Loader2 } from 'lucide-react'
import { optOut } from '@/lib/smsApi'
import { LANDING_VARS } from './landingPalettes'

/**
 * The page an invitation SMS links to.
 *
 * NO SIGN-IN, and nothing is asked for. Whoever arrives here was messaged
 * without ever having had an account, and the one thing they came to do
 * must not be behind a form.
 *
 * It asks before acting rather than opting someone out on arrival,
 * because SMS apps, messaging clients and security scanners fetch links
 * to build previews. A page that acted on load would remove people who
 * only received the message.
 *
 * It never reports an unknown token as an error. The server answers every
 * token the same way on purpose, and there is nothing a person reading
 * this could do with the difference.
 */
export function UnsubscribePage() {
  const { token } = useParams()
  const [done, setDone] = useState(false)

  const confirm = useMutation({
    mutationFn: () => optOut(token),
    onSuccess: () => setDone(true),
  })

  return (
    <div
      style={LANDING_VARS}
      className="flex min-h-screen items-center justify-center bg-[var(--l-via)] px-5 py-12"
    >
      <main className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-[0_1px_3px_rgba(14,46,28,0.08)] ring-1 ring-[var(--l-ring)]">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--l-soft)] text-[var(--l-primary)]"
          aria-hidden="true"
        >
          {done ? <Check size={22} /> : <BellOff size={22} />}
        </span>

        {done ? (
          <>
            <h1 className="mt-4 text-[19px] font-bold text-[var(--l-ink)]">הוסרת מהרשימה</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              לא נשלח אליך הודעות נוספות מ-Equalmind. אפשר לסגור את הדף.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              ההסרה חלה על כל ההודעות מהמערכת, גם אם מקום העבודה יטען את הרשימה מחדש.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-[19px] font-bold text-[var(--l-ink)]">
              הסרה מרשימת ההודעות
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
              לאישור ההסרה יש ללחוץ על הכפתור. לא נשלח אליך הודעות נוספות.
            </p>

            <button
              type="button"
              disabled={confirm.isPending}
              onClick={() => confirm.mutate()}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
            >
              {confirm.isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <BellOff size={16} aria-hidden="true" />
              )}
              הסירו אותי
            </button>

            {confirm.isError && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 text-start text-sm text-red-700"
              >
                <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                {confirm.error?.message ?? 'הפעולה נכשלה. אפשר לנסות שוב.'}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
