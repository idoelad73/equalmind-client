import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Check,
  CircleAlert,
  Loader2,
  MessageSquare,
  Send,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SmsTemplateField } from '@/components/org/SmsTemplateField'
import { counterFor } from '@/lib/smsText'
import { fetchTemplate, notifyRoster, saveTemplate } from '@/lib/rosterApi'
import { LANDING_VARS } from '@/pages/landingPalettes'

const STATUS = {
  sent: { label: 'נשלח', className: 'text-[var(--l-primary)]' },
  skipped: { label: 'לא נשלח', className: 'text-amber-700' },
  failed: { label: 'נכשל', className: 'text-red-700' },
  planned: { label: 'ימתין לשליחה', className: 'text-slate-500' },
}

/**
 * Send the registration invitation to everyone on the roster who has not
 * registered yet.
 *
 * The dialog opens on a dry run, never on a send. It shows the exact body,
 * the segment count and the recipient count, because those three numbers
 * together are the cost - and this is the one action in the product that
 * reaches people who are not users and never agreed to anything.
 */
export function NotifyModal({ open, onClose, imported = null }) {
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const dialogRef = useRef(null)

  const template = useQuery({ queryKey: ['sms-template'], queryFn: fetchTemplate, enabled: open })

  // Dry run: what would be sent, to how many, at what cost.
  // staleTime 0: the dialog often opens straight after an import, so the
  // recipient count must be recomputed rather than served from cache.
  const plan = useQuery({
    queryKey: ['notify-plan'],
    queryFn: () => notifyRoster({ dryRun: true }),
    enabled: open,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const save = useMutation({
    mutationFn: () => saveTemplate(draft.trim() || null),
    onSuccess: () => {
      setDirty(false)
      template.refetch()
      plan.refetch()
    },
  })

  const send = useMutation({
    mutationFn: async () => {
      // Saved first, so what was reviewed is what goes out.
      if (dirty) await saveTemplate(draft.trim() || null)
      return notifyRoster({ dryRun: false })
    },
  })

  useEffect(() => {
    if (open) return
    setDraft('')
    setDirty(false)
    save.reset()
    send.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Seed the editor once, from whatever the organisation has stored.
  useEffect(() => {
    if (!open || dirty || template.data === undefined) return
    setDraft(template.data.template ?? '')
  }, [open, dirty, template.data])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && !send.isPending && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, send.isPending])

  if (!open) return null

  const counter = counterFor(draft)
  const result = send.data
  const recipients = plan.data?.recipients ?? 0
  const loading = template.isPending || plan.isPending

  return createPortal(
    <div
      style={LANDING_VARS}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !send.isPending && onClose()
      }
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-title"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--l-soft)] text-[var(--l-primary)]">
            <MessageSquare size={19} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="notify-title" className="text-[17px] font-bold text-slate-900">
              שליחת הזמנות לעובדים
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              הודעה אחת לכל מי שטרם נרשם/ה
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={send.isPending}
            aria-label="סגירה"
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              טוען…
            </p>
          ) : result ? (
            <Result result={result} />
          ) : (
            <>
              {imported && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3 text-sm text-slate-900">
                  <Check
                    size={15}
                    className="shrink-0 text-[var(--l-primary)]"
                    aria-hidden="true"
                  />
                  הרשימה נטענה: {imported.added ?? 0} עובדים נוספו
                  {imported.already_listed ? `, ${imported.already_listed} כבר היו ברשימה` : ''}.
                </p>
              )}

              <Recipients plan={plan.data} />

              <div className="mt-5">
                <SmsTemplateField
                  value={draft}
                  disabled={send.isPending || save.isPending}
                  organizationName={template.data?.organization}
                  onChange={(next) => {
                    setDraft(next)
                    setDirty(true)
                  }}
                  hint="אפשר לערוך את ההודעה. השינוי נשמר לארגון ויחול גם על שליחות עתידיות."
                />
              </div>

              <Preview
                organizationName={template.data?.organization}
                stored={template.data}
                draft={draft}
                dirty={dirty}
              />

              {dirty && (
                <button
                  type="button"
                  disabled={save.isPending || counter.overLimit}
                  onClick={() => save.mutate()}
                  className="mt-3 text-sm font-semibold text-[var(--l-primary)] hover:underline disabled:opacity-50"
                >
                  {save.isPending ? 'שומר…' : 'שמירת ההודעה בלבד'}
                </button>
              )}

              {send.isError && (
                <p role="alert" className="mt-4 flex items-start gap-2 text-sm text-red-700">
                  <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {send.error?.message ?? 'השליחה נכשלה.'}
                </p>
              )}
            </>
          )}
        </div>

        {!result && !loading && (
          <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              disabled={send.isPending || recipients === 0 || counter.overLimit}
              onClick={() => send.mutate()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
            >
              {send.isPending ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
              {send.isPending
                ? 'שולח…'
                : recipients === 0
                  ? 'אין למי לשלוח'
                  : `שליחה ל-${recipients}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={send.isPending}
              className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              ביטול
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* --------------------------------------------------------- who and cost */

function Recipients({ plan }) {
  if (!plan) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
        <Users size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
        <p className="flex-1 text-sm text-slate-800">
          {plan.recipients === 0 ? (
            'כל מי שברשימה כבר נרשם/ה או קיבל/ה הזמנה.'
          ) : (
            <>
              <strong className="font-semibold">{plan.recipients}</strong> עובדים יקבלו
              הודעה, סה״כ <strong className="font-semibold">{plan.totalSegments}</strong>{' '}
              מקטעים.
            </>
          )}
        </p>
      </div>

      {plan.unreachable > 0 && (
        <p className="text-xs leading-relaxed text-slate-500">
          {plan.unreachable} ברשימה ללא מספר שמור — לא ניתן לשלוח אליהם. טעינה מחדש של
          הקובץ תשלים את המספרים.
        </p>
      )}

      {(plan.allowlist || plan.provider === 'mock') && (
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {plan.provider === 'mock'
            ? 'מצב בדיקה: ההודעות נרשמות אך אינן נשלחות בפועל.'
            : 'מצב בדיקה: הודעות יישלחו רק למספרים שברשימת ההיתר.'}
        </p>
      )}
    </div>
  )
}

/** Exactly what a handset will show, with the placeholders filled. */
function Preview({ organizationName, stored, draft, dirty }) {
  // The server rendered the stored template; an edited draft is rendered
  // here so the preview keeps up with typing.
  const body = dirty
    ? (draft.trim() || stored?.defaultTemplate || '')
        .replace(/\{org\}/g, organizationName ?? '')
        .replace(/\{url\}/g, 'https://…')
    : (stored?.preview ?? '')

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-slate-700">תצוגה מקדימה</p>
      <div className="mt-1.5 rounded-xl rounded-ss-sm bg-[var(--l-soft)]/70 px-4 py-3">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-900">
          {body}
        </p>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- the result */

function Result({ result }) {
  const { summary, results } = result

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3">
        <Check size={17} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">
          נשלחו {summary.sent ?? 0} הודעות
          {summary.skipped ? `, ${summary.skipped} לא נשלחו` : ''}
          {summary.failed ? `, ${summary.failed} נכשלו` : ''}.
        </p>
      </div>

      <ul className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
        {results.map((row, index) => (
          <li key={index} className="flex items-center gap-2 px-3 py-2">
            <span className="flex-1 truncate text-sm text-slate-800">{row.name ?? '—'}</span>
            <span className="shrink-0 font-mono text-xs text-slate-400" dir="ltr">
              {row.masked}
            </span>
            <span
              className={cn(
                'w-24 shrink-0 text-end text-xs font-semibold',
                STATUS[row.status]?.className,
              )}
            >
              {STATUS[row.status]?.label ?? row.status}
            </span>
          </li>
        ))}
      </ul>

      {results.some((r) => r.status === 'failed') && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          מי שהשליחה אליו נכשלה לא סומן כמי שהוזמן, כך שניתן לנסות שוב.
        </p>
      )}
    </div>
  )
}
