/**
 * The fields a Hook is made of, as staff edit them.
 *
 * Shared by the review queue's approval panel and the Hooks list's
 * add/edit dialogs, so the two forms cannot drift into asking for
 * different things about the same row. They differ only in what surrounds
 * them: approval also decides a catalogue category, and the list does not.
 *
 * `form` is a plain object of strings; the caller converts to and from the
 * API's shape. Keeping that conversion out of here is what lets one set of
 * fields serve a PATCH, a POST and an approval.
 */

export const SPACE_OPTIONS = [
  { value: 'work', label: 'מרחב עבודה' },
  { value: 'community', label: 'מרחב קהילה' },
  { value: 'consumption', label: 'מרחב צריכה' },
]

/** The review states, the same three the queue's tabs show. */
export const REVIEW_OPTIONS = [
  { value: '', label: 'כל הסטטוסים' },
  { value: 'pending', label: 'ממתינים לאישור' },
  { value: 'approved', label: 'אושרו' },
  { value: 'denied', label: 'נדחו' },
  // Not a status: the Hooks whose wording is already in the catalogue, so
  // approving one adds nothing. They still wait to be read.
  { value: 'none', label: 'כבר ברשימת ההתנהגויות' },
]

export const REVIEW_LABELS = {
  pending: 'ממתין לאישור',
  approved: 'אושר',
  denied: 'נדחה',
}

export const TARGET_OPTIONS = [
  { value: '', label: 'לא צוין' },
  { value: 'employee', label: 'עובד/ת' },
  { value: 'my_org', label: 'הארגון שלי' },
  { value: 'local_authority', label: 'רשות מקומית' },
  { value: 'business', label: 'בית עסק' },
]

export const field =
  'w-full rounded-lg border border-[var(--l-ring)] bg-white px-3 text-sm text-[var(--l-ink)] outline-none focus:border-[var(--l-primary)]'

/** An <input type="datetime-local"> value for a stored timestamp. */
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** A report row to the flat form state these fields read. */
export function hookToForm(hook = {}) {
  return {
    behaviorName: hook.behavior_name ?? '',
    space: hook.space ?? '',
    targetType: hook.target_type ?? '',
    targetName: hook.target_name ?? '',
    // { code, name } or null - the shape LocalityPicker reads and writes,
    // the same as the review queue's approval form.
    locality: hook.locality_name
      ? { code: hook.locality_code ?? null, name: hook.locality_name }
      : null,
    whenMode: hook.occurred_at ? 'exact' : hook.occurred_text ? 'text' : 'none',
    occurredAt: toLocalInput(hook.occurred_at),
    occurredText: hook.occurred_text ?? '',
    notes: hook.notes ?? '',
  }
}

/**
 * Form state to the request body.
 *
 * Empty strings become null, which the server reads as "clear this", not
 * as "leave it alone" - the two are different instructions and the API
 * keeps them apart deliberately.
 *
 * `original` is the row being edited, when there is one. Any field that
 * still matches it is LEFT OUT rather than sent unchanged, which matters
 * for one field in particular: <input type="datetime-local"> has minute
 * precision, so a timestamp read as 11:48:34 comes back as 11:48:00.
 * Sending it would rewrite the second somebody filed a report, on a save
 * that changed nothing. Comparing the input strings is exact - if the
 * field was never touched, it never leaves.
 */
export function formToBody(form, original = null) {
  const text = (v) => (v.trim() ? v.trim() : null)

  const body = {
    behaviorName: form.behaviorName.trim(),
    space: form.space,
    targetType: form.targetType || null,
    targetName: text(form.targetName),
    // Name and code travel together, so a town is never stored half-known.
    localityName: form.locality?.name ?? null,
    localityCode: form.locality?.code ?? null,
    occurredAt:
      form.whenMode === 'exact' && form.occurredAt
        ? new Date(form.occurredAt).toISOString()
        : null,
    occurredText: form.whenMode === 'text' ? text(form.occurredText) : null,
    notes: text(form.notes),
  }

  if (!original) return body

  // The same conversion the dialog opened with, so "unchanged" means the
  // control still holds what it was given.
  const before = hookToForm(original)
  const untouched = {
    behaviorName: before.behaviorName === form.behaviorName,
    space: before.space === form.space,
    targetType: before.targetType === form.targetType,
    targetName: before.targetName === form.targetName,
    localityName: sameLocality(before.locality, form.locality),
    localityCode: sameLocality(before.locality, form.locality),
    occurredAt: before.whenMode === form.whenMode && before.occurredAt === form.occurredAt,
    occurredText: before.whenMode === form.whenMode && before.occurredText === form.occurredText,
    notes: before.notes === form.notes,
  }

  return Object.fromEntries(Object.entries(body).filter(([key]) => !untouched[key]))
}

const sameLocality = (a, b) =>
  (a?.name ?? null) === (b?.name ?? null) && (a?.code ?? null) === (b?.code ?? null)

/** What the server will refuse, caught here so the button can say why. */
export function hookFormError(form) {
  if (form.behaviorName.trim().length < 3) return 'יש לנסח את ה-Hook במשפט'
  if (!form.space) return 'יש לבחור מרחב'
  if (form.targetType === 'employee' && !form.targetName.trim()) {
    return 'Hook על עובד/ת חייב לכלול שם'
  }
  return null
}

/**
 * The same form, shaped for POST /messages/:id/approve.
 *
 * That endpoint applies the corrections AND moves the status in one
 * transaction, so "save and approve" is one request rather than a PATCH
 * followed by an approve that might not happen. It calls the wording
 * `name`; everything else matches.
 *
 * No category is sent: this path is only offered for a Hook whose
 * behaviour is already in the catalogue, where approving adds nothing.
 * One that needs a catalogue row is approved from הודעות מערכת, which is
 * where the category is chosen.
 */
export function formToApproval(form) {
  const { behaviorName, ...rest } = formToBody(form)
  return { ...rest, name: behaviorName }
}
