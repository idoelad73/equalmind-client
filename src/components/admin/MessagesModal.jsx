import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookPlus,
  Building2,
  Check,
  CircleAlert,
  Clock,
  Inbox,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Tag,
  UserRound,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { approveMessage, denyMessage, fetchMessages } from '@/lib/messagesApi'
import { invalidateAfterReview } from '@/lib/reviewCache'
import { fetchBehaviors } from '@/lib/reportsApi'
import { NEW_CATEGORY } from '@/schemas/report'
import { Field, HookFormFields } from '@/components/admin/HookFormFields'
import { field, hookToForm } from '@/lib/hookForm'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'
import { LANDING_VARS } from '@/pages/landingPalettes'

const TABS = [
  { key: 'pending', label: 'ממתינות' },
  { key: 'approved', label: 'אושרו' },
  { key: 'denied', label: 'נדחו' },
]

const TARGETS = {
  employee: 'עובד/ת',
  my_org: 'הארגון שלי',
  local_authority: 'רשות מקומית',
  business: 'בית עסק',
}

const SPACES = {
  work: 'מרחב עבודה',
  community: 'מרחב קהילה',
  consumption: 'מרחב צריכה',
}

/**
 * Hebrew for each column messages.edits can mention. Two columns map to
 * one word on purpose - locality_name and locality_code are one thing to
 * a reader, and so are the two ways of saying when.
 */
const EDIT_LABELS = {
  behavior_name: 'נוסח',
  space: 'מרחב',
  target_type: 'על מי',
  target_name: 'שם',
  target_worker_id: 'שיוך לעובד/ת',
  locality_name: 'יישוב',
  locality_code: 'יישוב',
  occurred_at: 'מועד',
  occurred_text: 'מועד',
  notes: 'פרטים',
}

/**
 * Review Hooks filed outside the catalogue.
 *
 * Each card shows the proposed wording first and largest, because that is
 * what is being decided on. Everything else - who, where, when - is context
 * for that one judgement, so it sits underneath in smaller type rather than
 * competing with it.
 */
export function MessagesModal({ open, onClose }) {
  const [tab, setTab] = useState('pending')
  const dialogRef = useRef(null)
  const queryClient = useQueryClient()

  const list = useQuery({
    queryKey: ['messages', tab],
    queryFn: () => fetchMessages(tab),
    enabled: open,
    retry: false,
  })

  const decide = useMutation({
    mutationFn: ({ id, action, changes }) =>
      action === 'approve' ? approveMessage(id, changes) : denyMessage(id),
    onSuccess: (_data, { action, space }) => {
      list.refetch()
      invalidateAfterReview(queryClient, { space: action === 'approve' ? space : undefined })
    },
  })

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setTab('pending')
      decide.reset()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const messages = list.data?.messages ?? []

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
        aria-labelledby="messages-title"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        {/* The product's own backdrop, the same figures the landing page and
            the report wizard use. It lives behind the header only - the queue
            below needs flat white so Hebrew free text stays easy to read. */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[var(--l-from)] to-white">
          <CommunityBackdrop />

          <div className="relative flex items-start gap-3.5 px-6 pt-6 pb-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[var(--l-primary)] shadow-[0_1px_2px_rgba(14,46,28,0.08)] ring-1 ring-[var(--l-ring)] backdrop-blur-sm">
              <Inbox size={21} strokeWidth={2} aria-hidden="true" />
            </span>

            <div className="flex-1 pt-0.5">
              <h2 id="messages-title" className="text-[19px] font-extrabold tracking-tight text-[var(--l-ink)]">
                הודעות מערכת
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--l-muted)]">
                Hooks חדשים שהוצעו על ידי משתמשים וממתינים לאישור
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="shrink-0 rounded-full bg-white/70 p-1.5 text-[var(--l-muted)] backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--l-ink)]"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-[var(--l-ring)] bg-white px-6 py-2.5">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === item.key
                  ? 'bg-[var(--l-soft)] text-[var(--l-primary)]'
                  : 'text-[var(--l-muted)] hover:bg-[var(--l-soft)]/50',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--l-via)] px-6 py-5">
          {list.isPending ? (
            <p className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              טוען…
            </p>
          ) : list.isError ? (
            <p className="flex items-center justify-center gap-2 py-12 text-sm text-red-700">
              <CircleAlert size={15} aria-hidden="true" />
              לא הצלחנו לטעון את ההודעות.
            </p>
          ) : messages.length === 0 ? (
            <div className="py-14 text-center">
              <Inbox size={26} className="mx-auto text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-500">
                {tab === 'pending' ? 'אין הודעות הממתינות לטיפול.' : 'אין הודעות להצגה.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {messages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  busy={decide.isPending}
                  onDecide={(action, changes) =>
                    decide.mutate({
                      // The REPORT's id: the queue is reports, and the
                      // decision row may not exist yet.
                      id: message.id,
                      action,
                      changes,
                      space: message.space,
                    })
                  }
                />
              ))}
            </ul>
          )}

          {decide.isError && (
            <p role="alert" className="mt-4 text-center text-sm text-red-700">
              {decide.error?.message ?? 'הפעולה נכשלה.'}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------- one card */

function MessageCard({ message, busy, onDecide }) {
  const pending = message.status === 'pending'
  const [approving, setApproving] = useState(false)

  return (
    <li className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(14,46,28,0.06)] ring-1 ring-[var(--l-ring)]">
      {/* The proposed wording, first and largest: it is the thing being
          decided, and everything else on the card is context for it. */}
      <p className="text-[17px] leading-relaxed font-semibold text-[var(--l-ink)]">
        {message.new_hook_text}
      </p>

      <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
        <Fact icon={UserRound} value={message.user_name ?? 'לא ידוע'} />
        {message.space && <Fact icon={Building2} value={SPACES[message.space] ?? message.space} />}
        {message.target_type && (
          <Fact
            icon={MessageSquare}
            value={
              message.target_name
                ? `${TARGETS[message.target_type]} · ${message.target_name}`
                : (TARGETS[message.target_type] ?? message.target_type)
            }
          />
        )}
        {message.category_label && (
          <Fact
            icon={Tag}
            value={
              message.category_is_new
                ? `${message.category_label} (קטגוריה חדשה)`
                : message.category_label
            }
          />
        )}
        {/* "ללא קטגוריה" at filing: the reviewer has to choose one to approve. */}
        {!message.category_label && message.space && (
          <Fact icon={Tag} value="ללא קטגוריה — יש לבחור באישור" />
        )}
        {message.locality_name && <Fact icon={MapPin} value={message.locality_name} />}
        <Fact
          icon={Clock}
          value={new Date(message.date).toLocaleString('he-IL', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        />
      </dl>

      {message.notes && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
          {message.notes}
        </p>
      )}

      {pending && approving ? (
        <ApprovePanel
          message={message}
          busy={busy}
          onCancel={() => setApproving(false)}
          onConfirm={(changes) => onDecide('approve', changes)}
        />
      ) : pending ? (
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => setApproving(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--l-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
          >
            <Check size={15} aria-hidden="true" />
            אישור
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDecide('deny')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            <X size={15} aria-hidden="true" />
            דחייה
          </button>
        </div>
      ) : (
        <p
          className={cn(
            'mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
            message.status === 'approved'
              ? 'bg-[var(--l-soft)] text-[var(--l-primary)]'
              : 'bg-slate-100 text-slate-600',
          )}
        >
          {message.status === 'approved' ? <Check size={13} /> : <X size={13} />}
          {message.status === 'approved' ? 'אושר' : 'נדחה'}
          {message.handled_at &&
            ` · ${new Date(message.handled_at).toLocaleDateString('he-IL')}`}
          {message.status === 'approved' && message.behavior_id && ' · נוסף לרשימת ההתנהגויות'}
        </p>
      )}

      <EditedNote edits={message.edits} />
    </li>
  )
}

/**
 * What the reviewer changed, on a Hook that has already been decided.
 *
 * Shown because the alternative is an edit to somebody else's account of
 * something that happened to them, leaving no trace on the screen where
 * it was made. The values themselves are in messages.edits; this is the
 * summary line that says to go and look.
 */
function EditedNote({ edits }) {
  if (!edits) return null

  const fields = [...new Set(Object.keys(edits).map((k) => EDIT_LABELS[k] ?? k))]
  if (!fields.length) return null

  return (
    <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
      <Pencil size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
      נערך באישור: {fields.join(', ')}
    </p>
  )
}

/* ------------------------------------------------------------ approval */

/**
 * The whole Hook, laid open for the reviewer.
 *
 * The fields are the shared HookFormFields - the same component the Hooks
 * list's edit dialog uses - so the two staff screens that edit a Hook cannot
 * drift apart. What is particular to approval is added on top: the
 * catalogue category (in the component's first section), what "ready"
 * means, and what is sent.
 *
 * Two different things are being edited here and it is worth knowing
 * which is which. The wording and the category become a row in
 * public.behaviors - a catalogue entry everyone will see from now on.
 * Everything in the second section edits THIS REPORT: one person's account
 * of something that happened to them. The server records the previous value
 * of every field it changes (messages.edits, migration 029), so a
 * correction is a correction and not a quiet rewrite.
 *
 * The form always sends its full contents and lets the server work out
 * what actually differs. Sending only the fields the component thinks
 * changed is one bookkeeping mistake away from silently dropping an edit.
 */
function ApprovePanel({ message, busy, onCancel, onConfirm }) {
  // Only a Hook whose wording is NOT in the catalogue needs a category:
  // approving that one creates a behaviors row, and a row cannot exist
  // without a category. A Hook filed against an existing behaviour adds
  // nothing, so demanding a category for it left the button permanently
  // disabled - the reviewer could read it but never act on it.
  const needsCatalogue = message.needs_catalogue !== false

  const [form, setForm] = useState(() => ({
    // The shared fields' shape (lib/hookForm.js). The queue calls the
    // wording new_hook_text where a report calls it behavior_name.
    ...hookToForm({ ...message, behavior_name: message.new_hook_text }),
    category: message.category_key ?? (message.category_is_new ? NEW_CATEGORY : ''),
    newCategory: message.category_is_new ? (message.category_label ?? '') : '',
  }))

  // The categories belong to a space, so changing it invalidates whatever
  // was chosen - better cleared than silently wrong.
  const set = (patch) =>
    setForm((prev) => ({
      ...prev,
      ...patch,
      ...('space' in patch && patch.space !== prev.space ? { category: '', newCategory: '' } : null),
    }))

  const catalogue = useQuery({
    queryKey: ['behaviors', form.space],
    queryFn: () => fetchBehaviors(form.space),
    enabled: Boolean(form.space),
    staleTime: 10 * 60_000,
  })
  const categories = catalogue.data?.categories ?? []

  const name = form.behaviorName.trim()
  const newCategory = form.newCategory.trim()
  const targetName = form.targetName.trim()

  const ready =
    name.length >= 3 &&
    Boolean(form.space) &&
    (!needsCatalogue ||
      (form.category === NEW_CATEGORY ? newCategory.length >= 2 : Boolean(form.category))) &&
    // Mirrors reports_employee_has_name: a Hook about an employee with no
    // name is about nobody, and the database refuses it.
    (form.targetType !== 'employee' || targetName.length > 0)

  function confirm() {
    onConfirm({
      name,
      // Sent only when it means something. For a Hook already in the
      // catalogue the server ignores it anyway, but sending a category it
      // will not use invites someone to believe it was applied.
      ...(needsCatalogue
        ? form.category === NEW_CATEGORY
          ? { categoryLabel: newCategory }
          : { categoryKey: form.category }
        : null),
      space: form.space,
      ...(form.targetType ? { targetType: form.targetType } : null),
      targetName: targetName || null,
      localityName: form.locality?.name ?? null,
      localityCode: form.locality?.code ?? null,
      // Either a timestamp or the free text, never both - that is how the
      // report stores it, and the reviewer picks which one applies.
      occurredAt:
        form.whenMode === 'exact' && form.occurredAt
          ? new Date(form.occurredAt).toISOString()
          : null,
      occurredText: form.whenMode === 'text' ? form.occurredText.trim() || null : null,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[var(--l-soft)]/50 p-4 ring-1 ring-[var(--l-ring)]">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--l-ink)]">
        <BookPlus size={15} className="text-[var(--l-primary)]" aria-hidden="true" />
        {needsCatalogue ? 'אישור, הוספה לרשימה ועריכה' : 'אישור ועריכת ה-Hook'}
      </p>

      <HookFormFields
        form={form}
        set={set}
        disabled={busy}
        firstLegend={
          needsCatalogue ? 'נוסף לרשימת ההתנהגויות' : 'ההתנהגות כבר ברשימה'
        }
        wordingLabel="נוסח ההתנהגות"
        detailsLegend="פרטי ה-Hook — עריכה משנה את הדיווח עצמו"
      >
        {needsCatalogue && (
          <>
          <Field label="קטגוריה">
            <select
              value={form.category}
              disabled={busy || !form.space || catalogue.isPending}
              onChange={(event) => set({ category: event.target.value })}
              className={cn(field, 'h-10')}
            >
              <option value="" disabled>
                {catalogue.isPending ? 'טוען…' : 'בחר/י קטגוריה'}
              </option>
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
              <option value={NEW_CATEGORY}>קטגוריה חדשה…</option>
            </select>
          </Field>

          {form.category === NEW_CATEGORY && (
            <input
              type="text"
              maxLength={80}
              value={form.newCategory}
              disabled={busy}
              onChange={(event) => set({ newCategory: event.target.value })}
              placeholder="שם הקטגוריה החדשה"
              aria-label="שם הקטגוריה החדשה"
              className={cn(field, 'h-10')}
            />
          )}
          </>
        )}
      </HookFormFields>

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={busy || !ready}
          onClick={confirm}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--l-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={15} aria-hidden="true" />
          )}
          {needsCatalogue ? 'אישור והוספה' : 'אישור'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-white disabled:opacity-50"
        >
          ביטול
        </button>
      </div>
    </div>
  )
}

function Fact({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={12} className="shrink-0 text-slate-400" aria-hidden="true" />
      {value}
    </span>
  )
}
