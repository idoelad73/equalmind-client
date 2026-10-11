import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Check, Download, MessageSquare, Phone, Upload, X } from 'lucide-react'
import { LANDING_VARS } from '@/pages/landingPalettes'

/**
 * The rows an upload could not load, and what to do about them.
 *
 * Opens straight after an upload that left anything behind, for an org admin
 * and for Equalmind staff alike - both load rosters through RosterUploadModal.
 * It comes BEFORE invitations on purpose: the people missing from the list
 * are exactly the ones an invitation would not reach, so the natural next
 * step is to fix the file and load it again, then invite everyone at once.
 * Inviting now is still offered, as the secondary choice.
 *
 * No phone numbers here, not even the invalid ones: the line number and the
 * name are enough to find the row in the admin's own file, and the response
 * never carries plaintext numbers (see postRoster).
 */
export function RosterIssuesModal({ open, result, organization, onReload, onInvite, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !result) return null

  const issues = rosterIssues(result)
  const loaded = (result.summary?.added ?? 0) + (result.summary?.already_listed ?? 0)
  const phoneProblems = issues.some((i) => i.kind === 'phone')

  function downloadReport() {
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      ['שורה', 'שם', 'מחלקה', 'תפקיד', 'הבעיה'].join(','),
      ...issues.map((i) =>
        [i.line, quote(i.fullName), quote(i.department), quote(i.jobTitle), quote(i.reason)].join(','),
      ),
    ].join('\n')
    // BOM so Excel opens the Hebrew as UTF-8.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'roster-issues.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return createPortal(
    <div
      style={LANDING_VARS}
      // Above the upload dialog it was opened from (z-50).
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-issues-title"
        tabIndex={-1}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle size={19} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="roster-issues-title" className="text-[17px] font-bold text-slate-900">
              {issues.length === 1 ? 'שורה אחת לא נטענה' : `${issues.length} שורות לא נטענו`}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              דוח טעינת רשימת העובדים{organization ? ` · ${organization}` : ''}
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

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loaded > 0 && (
            <p className="flex items-center gap-2 rounded-xl bg-[var(--l-soft)]/60 px-4 py-3 text-sm text-slate-800">
              <Check size={16} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
              {loaded === 1 ? 'עובד/ת אחד/ת ברשימה' : `${loaded} עובדים ברשימה`} — הם נטענו
              כרגיל.
            </p>
          )}

          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            <strong className="font-semibold">מה עושים עכשיו:</strong> מתקנים את השורות האלה
            בקובץ המקורי וטוענים אותו שוב. שורות שכבר נטענו לא ישוכפלו — הן יסומנו
            ״כבר ברשימה״. אחרי הטעינה המתוקנת אפשר לשלוח הזמנות לכולם יחד.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th scope="col" className="w-14 px-3 py-2 text-start font-semibold">שורה</th>
                  <th scope="col" className="px-3 py-2 text-start font-semibold">שם</th>
                  <th scope="col" className="hidden px-3 py-2 text-start font-semibold sm:table-cell">מחלקה</th>
                  <th scope="col" className="px-3 py-2 text-start font-semibold">הבעיה</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue, index) => (
                  <tr key={`${issue.line}-${index}`}>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{issue.line}</td>
                    <td className="px-3 py-2.5 text-slate-900">{issue.fullName ?? '—'}</td>
                    <td className="hidden px-3 py-2.5 text-slate-600 sm:table-cell">
                      {issue.department ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-amber-800">{issue.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {phoneProblems && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-sky-50 p-4 text-[13px] leading-relaxed text-sky-950 ring-1 ring-sky-200">
              <Phone size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">מספר נייד תקין</p>
                <p className="mt-1">
                  05X ועוד 7 ספרות — 10 ספרות עם ה־0, למשל <bdi dir="ltr">050-1234567</bdi>.
                  באקסל כדאי להגדיר את עמודת הטלפון כ״טקסט״, אחרת ה־0 בתחילת המספר נמחק
                  (זה בסדר — אנחנו מוסיפים אותו), אבל ספרה חסרה באמצע אי אפשר לנחש.
                </p>
              </div>
            </div>
          )}

          {issues.some((i) => i.kind === 'conflict') && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              ״כבר מופיע ברשימה של ארגון אחר״: אדם יכול להשתייך לארגון אחד בלבד. אם המספר
              נכון, פנו אלינו ונבדוק.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onReload}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--l-primary)] px-4 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
          >
            <Upload size={16} aria-hidden="true" />
            טעינת קובץ מתוקן
          </button>
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download size={15} aria-hidden="true" />
            הורדת הדוח
          </button>
          {loaded > 0 && onInvite && (
            <button
              type="button"
              onClick={onInvite}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <MessageSquare size={15} aria-hidden="true" />
              להזמין עכשיו את מי שנטען
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Every row that did not end up on the roster: skipped while reading the
 * file, or refused because the number belongs to another organisation.
 */
export function rosterIssues(result) {
  if (!result) return []
  const skipped = (result.skipped ?? []).map((row) => ({
    line: row.line,
    fullName: row.fullName,
    department: row.department,
    jobTitle: row.jobTitle,
    reason: row.reason,
    kind: /נייד|טלפון/.test(row.reason ?? '') ? 'phone' : 'missing',
  }))
  const conflicts = (result.results ?? [])
    .filter((row) => row.status === 'conflict')
    .map((row) => ({
      line: row.line,
      fullName: row.fullName,
      department: row.department,
      jobTitle: row.jobTitle,
      reason: row.detail,
      kind: 'conflict',
    }))
  return [...skipped, ...conflicts].sort((a, b) => a.line - b.line)
}
