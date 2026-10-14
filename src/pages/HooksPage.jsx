import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookPlus,
  Check,
  CircleAlert,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { createHook, deleteHook, fetchHooks, updateHook } from '@/lib/hooksApi'
import { invalidateAfterReview } from '@/lib/reviewCache'
import { BackToHome } from '@/components/ui/BackToHome'
import { EqualmindMark } from '@/components/brand/EqualmindMark'
import { CommunityBackdrop } from '@/components/decor/CommunityBackdrop'
import { LANDING_VARS } from '@/pages/landingPalettes'
import { Field, HookFormFields } from '@/components/admin/HookFormFields'
import {
  REVIEW_LABELS,
  REVIEW_OPTIONS,
  SPACE_OPTIONS,
  field,
  formToApproval,
  formToBody,
  hookFormError,
  hookToForm,
} from '@/lib/hookForm'
import { approveMessage } from '@/lib/messagesApi'

const PAGE = 25

const SPACE_LABELS = Object.fromEntries(SPACE_OPTIONS.map((s) => [s.value, s.label]))

const TARGET_LABELS = {
  employee: 'עובד/ת',
  my_org: 'הארגון',
  local_authority: 'רשות מקומית',
  business: 'בית עסק',
}

/**
 * Every Hook in the system. Equalmind staff only.
 *
 * The server decides who may see this - the endpoint is behind
 * requireSystemAdmin and answers 403 otherwise - so an error here is
 * reported rather than silently rendered as an empty list. "No Hooks" and
 * "not allowed to see Hooks" must not look the same.
 */
export function HooksPage() {
  const queryClient = useQueryClient()

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [space, setSpace] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [offset, setOffset] = useState(0)

  const [editing, setEditing] = useState(null) // a hook row, or 'new'
  const [confirming, setConfirming] = useState(null)

  // Typing is not a request per keystroke. The page resets with the term
  // for the same reason the other filters do below: staying on page four
  // of a result set that no longer has four pages shows nothing, and reads
  // as "no matches".
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.trim())
      setOffset(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  // Changing a filter is an event, so the page resets there rather than in
  // an effect watching for it - an effect would re-render a second time to
  // do what the event could have done once.
  const filterSetter = (setter) => (value) => {
    setter(value)
    setOffset(0)
  }

  const params = useMemo(
    () => ({ q: debouncedQ, space, status, from, to, limit: PAGE, offset }),
    [debouncedQ, space, status, from, to, offset],
  )

  const hooks = useQuery({
    queryKey: ['hooks', params],
    queryFn: () => fetchHooks(params),
    retry: false,
    placeholderData: (previous) => previous,
  })

  // Saving here can approve a Hook, and deleting one can remove it from
  // the queue - so the same three caches are re-read as after a decision
  // in הודעות מערכת. One helper, so neither side can be a line short.
  const refresh = () => invalidateAfterReview(queryClient)

  const remove = useMutation({
    mutationFn: (id) => deleteHook(id),
    onSuccess: () => {
      setConfirming(null)
      refresh()
    },
  })

  const total = hooks.data?.total ?? 0
  const rows = hooks.data?.reports ?? []
  const filtered = Boolean(debouncedQ || space || status || from || to)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <BackToHome className="-ms-3 mb-1" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--l-ink)]">HOOKS של משתמשים</h1>
            <p className="mt-1 text-sm text-[var(--l-muted)]">
              כל ה-Hooks במערכת
              {hooks.data && (
                <>
                  {' · '}
                  <strong className="font-semibold tabular-nums">{total}</strong>
                  {filtered ? ' תוצאות' : ' סה״כ'}
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--l-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)]"
          >
            <Plus size={16} aria-hidden="true" />
            הוספת Hook
          </button>
        </div>
      </div>

      <Filters
        q={q}
        setQ={setQ}
        space={space}
        setSpace={filterSetter(setSpace)}
        status={status}
        setStatus={filterSetter(setStatus)}
        from={from}
        setFrom={filterSetter(setFrom)}
        to={to}
        setTo={filterSetter(setTo)}
        onClear={() => {
          setQ('')
          setSpace('')
          setStatus('')
          setFrom('')
          setTo('')
          setOffset(0)
        }}
        active={filtered}
      />

      {hooks.isError ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200"
        >
          <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {hooks.error?.status === 403
            ? 'הדף זמין לצוות Equalmind בלבד.'
            : (hooks.error?.message ?? 'טעינת הרשימה נכשלה.')}
        </p>
      ) : hooks.isPending ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--l-muted)]">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          טוען…
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl bg-white p-10 text-center text-sm text-[var(--l-muted)] ring-1 ring-[var(--l-ring)]">
          {filtered ? 'אין Hooks שמתאימים לחיפוש.' : 'אין Hooks במערכת.'}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {rows.map((hook) => (
              <HookRow
                key={hook.id}
                hook={hook}
                onEdit={() => setEditing(hook)}
                onDelete={() => setConfirming(hook)}
              />
            ))}
          </ul>

          <Pager total={total} offset={offset} onOffset={setOffset} />
        </>
      )}

      {editing && (
        <HookDialog
          hook={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}

      {confirming && (
        <ConfirmDelete
          hook={confirming}
          busy={remove.isPending}
          error={remove.error?.message}
          onCancel={() => setConfirming(null)}
          onConfirm={() => remove.mutate(confirming.id)}
        />
      )}
    </section>
  )
}

/* ------------------------------------------------------------- filters */

function Filters({
  q, setQ, space, setSpace, status, setStatus,
  from, setFrom, to, setTo, onClear, active,
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-[var(--l-ring)]">
      <label className="relative min-w-[16rem] flex-1">
        <span className="mb-1 block text-xs font-medium text-slate-600">חיפוש חופשי</span>
        <Search
          size={15}
          className="pointer-events-none absolute bottom-3 start-3 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="נוסח ה-Hook או שם מי שהוא עליו…"
          className={cn(field, 'h-10 ps-9')}
        />
      </label>

      <Field label="מרחב">
        <select
          value={space}
          onChange={(event) => setSpace(event.target.value)}
          className={cn(field, 'h-10')}
        >
          <option value="">כל המרחבים</option>
          {SPACE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="סטטוס">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={cn(field, 'h-10')}
        >
          {REVIEW_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      {/* The window is on when it happened, falling back to when it was
          filed - so a Hook that never said when is still findable. */}
      <Field label="מתאריך">
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={cn(field, 'h-10')}
          dir="ltr"
        />
      </Field>

      <Field label="עד תאריך">
        <input
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className={cn(field, 'h-10')}
          dir="ltr"
        />
      </Field>

      {active && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--l-muted)] transition-colors hover:bg-slate-100 hover:text-[var(--l-ink)]"
        >
          <X size={15} aria-hidden="true" />
          ניקוי
        </button>
      )}
    </div>
  )
}

/* ----------------------------------------------------------- one row */

function HookRow({ hook, onEdit, onDelete }) {
  const when = hook.occurred_at
    ? new Date(hook.occurred_at).toLocaleString('he-IL', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : (hook.occurred_text ??
      `נרשם ${new Date(hook.created_at).toLocaleDateString('he-IL')}`)

  return (
    <li className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-[var(--l-ring)]">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed font-semibold text-[var(--l-ink)]">
          {hook.behavior_name}
        </p>

        <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--l-soft)]/70 px-2 py-0.5 font-medium text-[var(--l-primary)]">
            {SPACE_LABELS[hook.space] ?? hook.space}
          </span>

          {hook.target_type && (
            <span>
              {TARGET_LABELS[hook.target_type] ?? hook.target_type}
              {hook.target_name ? ` · ${hook.target_name}` : ''}
            </span>
          )}

          {hook.locality_name && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" aria-hidden="true" />
              {hook.locality_name}
            </span>
          )}

          <span>{when}</span>

          {hook.organization_name && <span>{hook.organization_name}</span>}
          {!hook.behavior_id && (
            <span className="text-amber-700">מחוץ לקטלוג</span>
          )}

          {hook.review_status && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 font-medium',
                hook.review_status === 'approved' && 'bg-[var(--l-soft)] text-[var(--l-primary)]',
                hook.review_status === 'denied' && 'bg-slate-100 text-slate-600',
                hook.review_status === 'pending' && 'bg-orange-50 text-orange-700',
              )}
            >
              {REVIEW_LABELS[hook.review_status]}
            </span>
          )}
        </dl>

        {hook.notes && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {hook.notes}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="עריכה"
          title="עריכה"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-primary)]"
        >
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="מחיקה"
          title="מחיקה"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------- paging */

function Pager({ total, offset, onOffset }) {
  if (total <= PAGE) return null

  const page = Math.floor(offset / PAGE) + 1
  const pages = Math.ceil(total / PAGE)

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        disabled={offset === 0}
        onClick={() => onOffset(Math.max(0, offset - PAGE))}
        className="rounded-lg px-3 py-1.5 font-medium text-[var(--l-muted)] transition-colors hover:bg-slate-100 disabled:opacity-40"
      >
        הקודם
      </button>
      <span className="tabular-nums text-[var(--l-muted)]">
        {page} מתוך {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onOffset(offset + PAGE)}
        className="rounded-lg px-3 py-1.5 font-medium text-[var(--l-muted)] transition-colors hover:bg-slate-100 disabled:opacity-40"
      >
        הבא
      </button>
    </div>
  )
}

/* --------------------------------------------------------- add / edit */

function HookDialog({ hook, onClose, onSaved }) {
  const [form, setForm] = useState(() => hookToForm(hook ?? {}))
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  // Saving an edit can also clear the Hook from the queue, but only when
  // there is something to clear and nothing to decide:
  //
  //   pending, already in the catalogue  approving adds nothing, so the
  //                                      save can carry it - one request,
  //                                      one transaction, status included.
  //   pending, needs a catalogue row     a category has to be chosen, and
  //                                      this dialog does not ask for one.
  //                                      Saved only; approve it from the
  //                                      queue.
  //   already decided                    saved only; re-approving would be
  //                                      a conflict.
  const canApprove =
    Boolean(hook) && hook.review_status === 'pending' && hook.needs_catalogue === false

  const save = useMutation({
    mutationFn: () => {
      if (!hook) return createHook(formToBody(form))
      if (canApprove) return approveMessage(hook.id, formToApproval(form))
      // The row is passed on an edit so untouched fields are left out of
      // the PATCH entirely - see formToBody.
      return updateHook(hook.id, formToBody(form, hook))
    },
    onSuccess: onSaved,
  })

  const problem = hookFormError(form)

  return (
    <Modal
      title={hook ? 'עריכת Hook' : 'הוספת Hook'}
      subtitle={
        !hook
          ? 'Hook שנוסף כאן נרשם ללא מדווח/ת ובלי שיוך לארגון'
          : canApprove
            ? 'השמירה גם מאשרת את ה-Hook ומסירה אותו מהודעות המערכת'
            : 'עריכה משנה את הדיווח עצמו'
      }
      onClose={onClose}
      busy={save.isPending}
      footer={
        <>
          <button
            type="button"
            disabled={save.isPending || Boolean(problem)}
            title={problem ?? undefined}
            onClick={() => save.mutate()}
            // Same buttons as the review queue's approval form.
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[var(--l-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--l-primary-hover)] disabled:opacity-50"
          >
            {save.isPending ? (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            ) : (
              <Check size={15} aria-hidden="true" />
            )}
            {!hook
              ? 'הוספת ה-Hook'
              : canApprove
                ? 'שמירת השינויים ואישור'
                : 'שמירת השינויים'}
          </button>
          <button
            type="button"
            disabled={save.isPending}
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            ביטול
          </button>
        </>
      }
    >
      {/* The same panel as the review queue's approval form - tint, ring,
          icon heading and two sections - because it is the same Hook being
          edited, and staff move between the two screens. */}
      <div className="flex flex-col gap-4 rounded-xl bg-[var(--l-soft)]/50 p-4 ring-1 ring-[var(--l-ring)]">
        <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--l-ink)]">
          {hook ? (
            <Pencil size={15} className="text-[var(--l-primary)]" aria-hidden="true" />
          ) : (
            <BookPlus size={15} className="text-[var(--l-primary)]" aria-hidden="true" />
          )}
          {hook ? <>עריכת ה-<bdi>Hook</bdi></> : <>הוספת <bdi>Hook</bdi></>}
        </p>

        <HookFormFields
          form={form}
          set={set}
          disabled={save.isPending}
          detailsLegend={hook ? 'פרטי ה-Hook — עריכה משנה את הדיווח עצמו' : 'פרטי ה-Hook'}
        />
      </div>

      {problem && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {problem}
        </p>
      )}

      {save.isError && (
        <p role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700">
          <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {save.error?.message ?? 'השמירה נכשלה.'}
        </p>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------ delete */

function ConfirmDelete({ hook, busy, error, onCancel, onConfirm }) {
  return (
    <Modal
      title="מחיקת Hook"
      subtitle="הפעולה אינה הפיכה"
      tone="danger"
      onClose={onCancel}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-[15px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
            מחיקה
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex h-11 items-center rounded-xl px-4 text-[15px] font-medium text-[var(--l-muted)] transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            ביטול
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-700">
        למחוק את ה-Hook הבא? הפעולה אינה הפיכה.
      </p>
      <p className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[15px] font-medium text-[var(--l-ink)]">
        {hook.behavior_name}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        החלטת האישור בהודעות המערכת נשמרת גם אחרי המחיקה — רשומת ביקורת שנעלמת
        יחד עם מה שהיא מתעדת אינה רשומה.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </Modal>
  )
}

/* ------------------------------------------------------------- shell */

/**
 * The dialog shell, branded to match the review queue.
 *
 * Portalled to <body>: the page sits inside the app layout, whose sidebar
 * uses backdrop-blur - and backdrop-filter creates a containing block for
 * fixed descendants, so a dialog rendered in place would be positioned
 * against that element instead of the viewport. LANDING_VARS is re-applied
 * on the portal root because custom properties do not cross a portal, and
 * without them every --l- colour below resolves to nothing.
 */
function Modal({ title, subtitle, tone = 'brand', onClose, busy, footer, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const danger = tone === 'danger'

  return createPortal(
    <div
      style={LANDING_VARS}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--l-ink)]/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        {/* The product's own backdrop, behind the header only - the form
            below needs flat white so Hebrew stays easy to read. */}
        <div
          className={cn(
            'relative shrink-0 overflow-hidden bg-gradient-to-b to-white',
            danger ? 'from-red-50' : 'from-[var(--l-from)]',
          )}
        >
          {!danger && <CommunityBackdrop />}

          <div className="relative px-6 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <EqualmindMark size={28} className="shrink-0 rounded-[6px]" />
              <span className="text-[15px] font-extrabold tracking-tight text-[var(--l-ink)]">
                Equalmind
              </span>

              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                aria-label="סגירה"
                className="ms-auto rounded-full bg-white/70 p-1.5 text-[var(--l-muted)] backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--l-ink)] disabled:opacity-40"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <h2
              className={cn(
                'mt-3 text-[20px] font-extrabold tracking-tight',
                danger ? 'text-red-800' : 'text-[var(--l-ink)]',
              )}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm leading-relaxed text-[var(--l-muted)]">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center gap-2.5 border-t border-[var(--l-ring)] bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
