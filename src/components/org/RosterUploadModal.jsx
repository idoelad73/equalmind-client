import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchRoster, inspectCsvHeader, uploadRoster } from '@/lib/rosterApi'
import { LANDING_VARS } from '@/pages/landingPalettes'

const TEMPLATE = '﻿full_name,phone\n"דנה כהן",050-1234567\n"יוסי לוי",052-1234567\n'

const STATUS = {
  added: { label: 'נוסף', className: 'text-[var(--l-primary)]' },
  already_listed: { label: 'כבר ברשימה', className: 'text-slate-500' },
  conflict: { label: 'התנגשות', className: 'text-amber-700' },
}

/**
 * Upload an employee roster, in two steps.
 *
 * The organisation is confirmed before a file can even be chosen. It is
 * read from the admin's own membership, never chosen from a list: an admin
 * who could name the organisation could seed another company's roster. So
 * this step is a confirmation, not a decision - but it is an explicit one,
 * because the upload attaches real people to an employer.
 */
export function RosterUploadModal({ open, onClose, onRequestNotify }) {
  const [step, setStep] = useState('confirm')
  const [file, setFile] = useState(null)
  const [header, setHeader] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [notify, setNotify] = useState(false)
  const dialogRef = useRef(null)

  const roster = useQuery({ queryKey: ['roster'], queryFn: fetchRoster, enabled: open })

  const upload = useMutation({
    mutationFn: () => uploadRoster(file, setProgress),
    onSuccess: (data) => {
      roster.refetch()
      // Hand straight over to the invitation dialog, where the wording and
      // the recipient count get approved before anything is sent.
      if (notify) onRequestNotify?.(data.summary)
    },
  })

  // Reset between openings, so a previous result never shows over a new file
  // and the organisation is always confirmed afresh.
  useEffect(() => {
    if (open) return
    setStep('confirm')
    setFile(null)
    setHeader(null)
    setProgress(0)
    setNotify(false)
    upload.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const organization = roster.data?.organization ?? null

  async function pick(next) {
    upload.reset()
    setProgress(0)
    setFile(next ?? null)
    setHeader(next ? inspectCsvHeader(await next.text()) : null)
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'roster-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const headerBad = header && !header.hasPhone
  const result = upload.data

  // Rendered into <body>, not where it sits in the tree. The navbar that
  // opens it has `backdrop-blur`, and a backdrop-filter makes an element a
  // containing block for fixed-position descendants - so inline, this dialog
  // centred itself against a 64px header instead of the viewport.
  //
  // The palette has to be re-applied here for the same reason: LANDING_VARS
  // is set on the AppLayout element, and a portal escapes it. Without this,
  // --l-primary is undefined, so the confirm button renders white-on-white
  // and looks like it is not there at all.
  return createPortal(
    <div
      style={LANDING_VARS}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-title"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        {/* ---- header ---- */}
        <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--l-soft)] text-[var(--l-primary)]">
            {step === 'confirm' ? (
              <BadgeCheck size={19} aria-hidden="true" />
            ) : (
              <FileSpreadsheet size={19} aria-hidden="true" />
            )}
          </span>
          <div className="flex-1">
            <h2 id="roster-title" className="text-[17px] font-bold text-slate-900">
              טעינת רשימת עובדים
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {step === 'confirm'
                ? 'שלב 1 מתוך 2 — אישור הארגון'
                : 'שלב 2 מתוך 2 — בחירת הקובץ'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {step === 'confirm' ? (
          <ConfirmStep
            roster={roster}
            organization={organization}
            onConfirm={() => setStep('upload')}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* the confirmed organisation, still visible */}
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={upload.isPending || Boolean(result)}
                className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3 text-start transition-colors enabled:hover:bg-[var(--l-soft)] disabled:cursor-default"
              >
                <BadgeCheck
                  size={16}
                  className="shrink-0 text-[var(--l-primary)]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">ארגון מאושר</p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {organization?.name ?? '—'}
                  </p>
                </div>
                {!upload.isPending && !result && (
                  <ChevronRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
                )}
              </button>

              {roster.data?.count > 0 && !result && (
                <p className="mt-2 text-xs text-slate-500">
                  ברשימה כעת {roster.data.count} עובדים, מתוכם {roster.data.claimed} כבר
                  נרשמו. טעינה נוספת מוסיפה לרשימה ולא מוחקת אותה.
                </p>
              )}

              {result ? (
                <Results result={result} onAnother={() => pick(null)} />
              ) : (
                <>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragging(false)
                      pick(e.dataTransfer.files?.[0])
                    }}
                    className={cn(
                      'mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
                      dragging
                        ? 'border-[var(--l-primary)] bg-[var(--l-soft)]/50'
                        : 'border-slate-300 hover:border-[var(--l-primary)] hover:bg-slate-50',
                      upload.isPending && 'pointer-events-none opacity-60',
                    )}
                  >
                    <Upload size={22} className="text-slate-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-700">
                      גרור/י קובץ CSV לכאן, או לחץ/י לבחירה
                    </span>
                    <span className="text-xs text-slate-500">עד 2MB</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      disabled={upload.isPending}
                      onChange={(event) => pick(event.target.files?.[0])}
                    />
                  </label>

                  {file && (
                    <div
                      className={cn(
                        'mt-3 flex items-center gap-2.5 rounded-xl px-4 py-3 ring-1',
                        headerBad ? 'bg-red-50 ring-red-200' : 'bg-white ring-slate-200',
                      )}
                    >
                      <FileSpreadsheet
                        size={16}
                        className={cn('shrink-0', headerBad ? 'text-red-500' : 'text-slate-400')}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900" dir="ltr">
                          {file.name}
                        </p>
                        <p className={cn('text-xs', headerBad ? 'text-red-700' : 'text-slate-500')}>
                          {headerBad
                            ? 'לא נמצאה עמודת טלפון בשורת הכותרות.'
                            : `עמודות: ${header?.columns.join(', ')}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => pick(null)}
                        aria-label="הסרת הקובץ"
                        className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 transition-colors hover:ring-[var(--l-primary)]">
                    <input
                      type="checkbox"
                      checked={notify}
                      disabled={upload.isPending}
                      onChange={(event) => setNotify(event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--l-primary)]"
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <MessageSquare size={14} className="text-slate-400" aria-hidden="true" />
                        מעבר לשליחת הזמנות לאחר הטעינה
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        ייפתח חלון שבו אפשר לערוך את נוסח ההודעה ולאשר את השליחה.
                        לא נשלחת הודעה ללא אישור.
                      </span>
                    </span>
                  </label>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">מבנה הקובץ</p>
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--l-primary)] hover:underline"
                      >
                        <Download size={13} aria-hidden="true" />
                        הורדת תבנית
                      </button>
                    </div>
                    <pre
                      dir="ltr"
                      className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-left font-mono text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200"
                    >{`full_name,phone
"דנה כהן",050-1234567
"יוסי לוי",052-1234567`}</pre>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      שתי עמודות בלבד. אין עמודת ארגון — הרשימה נטענת לארגון שאושר
                      למעלה. מאקסל: קובץ ← שמירה בשם ← CSV UTF-8.
                    </p>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <ShieldCheck
                      size={14}
                      className="mt-0.5 shrink-0 text-[var(--l-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      מספרי הטלפון נשמרים אצלנו מוצפנים בלבד ואינם ניתנים לשחזור מתוך
                      מסד הנתונים.
                    </span>
                  </p>

                  {upload.isError && (
                    <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700">
                      <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {upload.error?.message ?? 'טעינת הרשימה נכשלה.'}
                    </p>
                  )}
                </>
              )}
            </div>

            {!result && (
              <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  disabled={!file || headerBad || upload.isPending}
                  onClick={() => upload.mutate()}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
                >
                  {upload.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {progress < 100 ? `מעלה… ${progress}%` : 'מעבד…'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} aria-hidden="true" />
                      טען רשימה
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={upload.isPending}
                  className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                >
                  ביטול
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------- step one */

function ConfirmStep({ roster, organization, onConfirm, onClose }) {
  if (roster.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        טוען את פרטי הארגון…
      </div>
    )
  }

  // No organisation means onboarding was never completed. Saying so plainly
  // beats an upload that would fail with something unhelpful.
  if (roster.isError || !organization?.name) {
    return (
      <div className="px-6 py-10 text-center">
        <CircleAlert size={26} className="mx-auto text-amber-500" aria-hidden="true" />
        <p className="mt-3 text-[15px] font-medium text-slate-900">
          לא נמצא ארגון מקושר לחשבון שלך
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          יש להשלים את פרטי הארגון לפני טעינת רשימת עובדים.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex h-11 items-center rounded-xl border border-slate-300 px-5 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          סגירה
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="text-sm leading-relaxed text-slate-600">
          הרשימה תיטען לארגון הבא. יש לוודא שזהו הארגון הנכון — העובדים ברשימה
          ישויכו אליו.
        </p>

        <div className="mt-4 rounded-xl bg-[var(--l-soft)]/50 p-5 text-center ring-1 ring-[var(--l-ring)]">
          <Building2
            size={22}
            className="mx-auto text-[var(--l-primary)]"
            aria-hidden="true"
          />
          <p className="mt-2.5 text-lg leading-snug font-bold text-balance text-slate-900">
            {organization.name}
          </p>
          {organization.registryId && (
            <p className="mt-1 font-mono text-xs text-slate-500" dir="ltr">
              {organization.registryId}
            </p>
          )}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          שם הארגון נקרא מהמערכת ואינו ניתן לעריכה כאן. אם הוא שגוי, יש לפנות
          אלינו לפני טעינת הרשימה.
        </p>

        {roster.data?.count > 0 && (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200">
            כבר קיימת רשימה עם {roster.data.count} עובדים, מתוכם{' '}
            {roster.data.claimed} נרשמו לאפליקציה. טעינה נוספת מוסיפה לרשימה
            הקיימת ואינה מוחקת אותה.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
        >
          <BadgeCheck size={16} aria-hidden="true" />
          שם הארגון מאושר
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          ביטול
        </button>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- results */

function Results({ result, onAnother }) {
  const { summary, skipped, attached, results } = result
  const problems = results.filter((r) => r.status === 'conflict')

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2.5 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3">
        <Check size={17} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">
          נוספו {summary.added ?? 0} עובדים
          {summary.already_listed ? `, ${summary.already_listed} כבר היו ברשימה` : ''}
          {attached ? `. ${attached} מהם כבר רשומים ושויכו מיד` : ''}.
        </p>
      </div>

      {(skipped.length > 0 || problems.length > 0) && (
        <div className="mt-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle size={13} aria-hidden="true" />
            {skipped.length + problems.length} שורות דורשות תשומת לב
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {[...problems, ...skipped].slice(0, 12).map((row, index) => (
              <li key={index} className="text-xs leading-relaxed text-amber-900">
                שורה {row.line}
                {row.fullName ? ` · ${row.fullName}` : ''} — {row.detail ?? row.reason}
              </li>
            ))}
            {skipped.length + problems.length > 12 && (
              <li className="text-xs text-amber-800">ועוד…</li>
            )}
          </ul>
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-3 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {results.map((row, index) => (
            <li key={index} className="flex items-center gap-2 px-3 py-2">
              <span className="flex-1 truncate text-sm text-slate-800">{row.fullName ?? '—'}</span>
              <span className="shrink-0 font-mono text-xs text-slate-400" dir="ltr">
                {row.masked}
              </span>
              <span
                className={cn(
                  'w-20 shrink-0 text-end text-xs font-semibold',
                  STATUS[row.status]?.className,
                )}
              >
                {STATUS[row.status]?.label ?? row.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAnother}
        className="mt-4 text-sm font-semibold text-[var(--l-primary)] hover:underline"
      >
        טעינת קובץ נוסף
      </button>
    </div>
  )
}

