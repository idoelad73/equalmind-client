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
import {
  fetchOrganizations,
  fetchRoster,
  inspectCsvHeader,
  uploadRoster,
} from '@/lib/rosterApi'
import { LANDING_VARS } from '@/pages/landingPalettes'
import { RosterIssuesModal, rosterIssues } from '@/components/org/RosterIssuesModal'

// Opens straight in Excel (the BOM makes it read the Hebrew as UTF-8), and
// the hyphenated numbers stay text there, so the leading 0 survives.
const TEMPLATE =
  '﻿שם,טלפון,מחלקה,תפקיד\n"דנה כהן",050-1234567,פיתוח,מהנדסת\n"יוסי לוי",052-1234567,כספים,חשב\n'

// All four are required - mirrors REQUIRED_COLUMNS in server/lib/rosterImport.js.
const COLUMNS = [
  { name: 'שם', required: true },
  { name: 'טלפון', required: true, note: 'נייד ישראלי' },
  { name: 'מחלקה', required: true },
  { name: 'תפקיד', required: true },
]

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
export function RosterUploadModal({ open, onClose, onRequestNotify, asStaff = false }) {
  const [step, setStep] = useState('confirm')
  const [file, setFile] = useState(null)
  const [header, setHeader] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [notify, setNotify] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)
  const dialogRef = useRef(null)
  // Staff have no organisation of their own, so they pick one. For an org
  // admin this stays null and the server uses their membership.
  const [orgId, setOrgId] = useState(null)

  // Staff list the organisations to choose from; an org admin never sees
  // this call, and would get a 403 if they made it.
  const organizations = useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
    enabled: open && asStaff,
    retry: false,
  })

  // Waits for a choice when acting as staff: without one the request has
  // no scope and the server would rightly refuse it.
  const roster = useQuery({
    queryKey: ['roster', orgId],
    queryFn: () => fetchRoster(orgId),
    enabled: open && (!asStaff || Boolean(orgId)),
  })

  const upload = useMutation({
    mutationFn: () => uploadRoster(file, setProgress, orgId),
    onSuccess: (data) => {
      roster.refetch()
      // Rows left behind come first: the report asks for a fixed file, and
      // inviting now would skip exactly the people still missing. The report
      // can still hand over to invitations if the admin chooses.
      if (rosterIssues(data).length) {
        setIssuesOpen(true)
        return
      }
      if (notify) requestNotify(data)
    },
  })

  // Hand over to the invitation dialog, where the wording and the recipient
  // count get approved before anything is sent. orgId is null for an org
  // admin, which is correct: the server uses their own membership.
  // importedAt scopes the dialog's "new" option to the rows this upload
  // added - without it, "new" would mean "never invited", which on a roster
  // nobody has been messaged yet is everybody.
  function requestNotify(data) {
    onRequestNotify?.(data.summary, orgId, data.importedAt ?? null)
  }

  // Reset between openings, so a previous result never shows over a new file
  // and the organisation is always confirmed afresh.
  useEffect(() => {
    if (open) return
    setStep('confirm')
    setOrgId(null)
    setFile(null)
    setHeader(null)
    setProgress(0)
    setNotify(false)
    setIssuesOpen(false)
    upload.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // While the report is on top, Escape belongs to it.
    if (!open || issuesOpen) return
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, issuesOpen])

  if (!open) return null

  const organization = roster.data?.organization ?? null

  async function pick(next) {
    upload.reset()
    setProgress(0)
    setFile(next ?? null)
    if (!next) return setHeader(null)
    // CSV headers are checked here for a fast answer; a workbook is checked
    // by the server when it is loaded.
    setHeader(
      /\.xlsx$/i.test(next.name) ? { xlsx: true } : inspectCsvHeader(await next.text()),
    )
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'roster-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const missing = header && !header.xlsx ? header.missing : []
  const headerBad = missing.length > 0
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
            asStaff={asStaff}
            organizations={organizations}
            orgId={orgId}
            onPickOrg={setOrgId}
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
                <Results
                  result={result}
                  onAnother={() => pick(null)}
                  onShowIssues={() => setIssuesOpen(true)}
                />
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
                      גרור/י קובץ אקסל או CSV לכאן, או לחץ/י לבחירה
                    </span>
                    <span className="text-xs text-slate-500">xlsx או csv, עד 2MB</span>
                    <input
                      type="file"
                      accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                            ? `חסרה עמודת ${missing.join(', ')} בשורת הכותרות.`
                            : header?.xlsx
                              ? 'קובץ אקסל — העמודות ייבדקו בעת הטעינה.'
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
                    <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {COLUMNS.map((column) => (
                        <li
                          key={column.name}
                          className="rounded-lg bg-white px-2.5 py-2 text-center ring-1 ring-slate-200"
                        >
                          <span className="block text-sm font-semibold text-slate-800">
                            {column.name}
                          </span>
                          <span
                            className={cn(
                              'block text-[11px]',
                              column.required ? 'text-[var(--l-primary)]' : 'text-slate-400',
                            )}
                          >
                            {column.required ? 'חובה' : 'אופציונלי'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      שורה ראשונה עם שמות העמודות, וכל ארבע העמודות חובה. שורה
                      שחסר בה אחד השדות, או שהמספר בה אינו נייד תקין, לא תיטען
                      והסיבה תוצג. אין עמודת ארגון — הרשימה נטענת לארגון שאושר
                      למעלה.
                    </p>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <ShieldCheck
                      size={14}
                      className="mt-0.5 shrink-0 text-[var(--l-primary)]"
                      aria-hidden="true"
                    />
                    {/* Accurate since migration 015, which stores the number
                        itself alongside its hash. The old wording ("encrypted
                        only, unrecoverable") stopped being true there. */}
                    <span>
                      הרשימה משמשת רק לשיוך עובדים לארגון ולשליחת הזמנות שאישרת.
                      היא נגישה רק למנהלי הארגון ולצוות <bdi>Equalmind</bdi>, ואינה
                      מוצגת למשתמשים אחרים.
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

      <RosterIssuesModal
        open={issuesOpen}
        result={result}
        organization={organization?.name}
        onClose={() => setIssuesOpen(false)}
        // Back to an empty drop zone for the corrected file. Re-uploading is
        // safe: rows already loaded come back as "already listed".
        onReload={() => {
          setIssuesOpen(false)
          pick(null)
        }}
        onInvite={
          onRequestNotify
            ? () => {
                setIssuesOpen(false)
                requestNotify(result)
              }
            : undefined
        }
      />
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------- step one */

function ConfirmStep({
  roster,
  organization,
  asStaff,
  organizations,
  orgId,
  onPickOrg,
  onConfirm,
  onClose,
}) {
  // Staff choose before anything else happens. Until they do there is no
  // organisation to describe, so the rest of the step has nothing to say.
  if (asStaff && !orgId) {
    return (
      <OrganisationPicker
        organizations={organizations}
        onPick={onPickOrg}
        onClose={onClose}
      />
    )
  }

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
          {asStaff
            ? 'הרשימה תיטען לארגון שנבחר. אפשר לחזור ולבחור ארגון אחר.'
            : 'שם הארגון נקרא מהמערכת ואינו ניתן לעריכה כאן. אם הוא שגוי, יש לפנות אלינו לפני טעינת הרשימה.'}
        </p>

        {asStaff && (
          <button
            type="button"
            onClick={() => onPickOrg(null)}
            className="mt-2 text-sm font-semibold text-[var(--l-primary)] hover:underline"
          >
            בחירת ארגון אחר
          </button>
        )}

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

function Results({ result, onAnother, onShowIssues }) {
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
          {/* The full report, if it was closed - it is where the fix
              instructions and the download live. */}
          <button
            type="button"
            onClick={onShowIssues}
            className="mt-2 text-xs font-semibold text-amber-900 underline hover:no-underline"
          >
            לדוח המלא ולהנחיות התיקון
          </button>
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-3 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          {results.map((row, index) => (
            <li key={index} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-slate-800">{row.fullName ?? '—'}</span>
                {(row.department || row.jobTitle) && (
                  <span className="block truncate text-[11px] text-slate-500">
                    {[row.department, row.jobTitle].filter(Boolean).join(' · ')}
                  </span>
                )}
              </span>
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

/* ------------------------------------------------------ the staff picker */

/**
 * Which organisation the roster is for. Equalmind staff only.
 *
 * Lists organisations that already exist rather than offering the company
 * registry: a roster belongs to an organisation we have verified, and
 * creating one here would be a different, much weightier action than
 * loading a list of names into it.
 */
function OrganisationPicker({ organizations, onPick, onClose }) {
  if (organizations.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        טוען ארגונים…
      </div>
    )
  }

  if (organizations.isError) {
    return (
      <div className="px-6 py-10 text-center">
        <CircleAlert size={24} className="mx-auto text-red-500" aria-hidden="true" />
        <p className="mt-3 text-sm text-slate-700">
          לא הצלחנו לטעון את רשימת הארגונים.
        </p>
      </div>
    )
  }

  const list = organizations.data ?? []

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-sm leading-relaxed text-[var(--l-muted)]">
          לאיזה ארגון לטעון את הרשימה?
        </p>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            אין ארגונים פעילים במערכת.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {list.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  onClick={() => onPick(org.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[var(--l-ring)] bg-white px-4 py-3.5 text-start transition-all hover:-translate-y-0.5 hover:border-[var(--l-primary)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]"
                >
                  <Building2
                    size={17}
                    className="shrink-0 text-[var(--l-primary)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-slate-900">
                      {org.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {org.roster_count} ברשימה · {org.attached} משויכים
                    </span>
                  </span>
                  {org.registry_id && (
                    <span className="shrink-0 font-mono text-xs text-slate-400" dir="ltr">
                      {org.registry_id}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)]/50"
        >
          ביטול
        </button>
      </div>
    </>
  )
}
