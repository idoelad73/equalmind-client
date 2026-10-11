import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Check, Keyboard, Loader2, Search, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchWorkers } from '@/lib/reportsApi'

/**
 * "About whom" for an employee Hook: the reporter's colleagues, searchable,
 * with typing a name as the fallback.
 *
 * The reporter's own organisation only. The server decides how much they
 * see (getWorkers / workerAccessFor):
 *   mode 'full'    employer-linked: the whole list, filtered as you type
 *   mode 'search'  self-declared: names suggested once two letters are typed
 * Everyone else gets the plain name box.
 *
 * Picking sets workerId (the server re-reads the name from its own list);
 * typing sets name and clears workerId. Never both.
 */
export function WorkerPicker({ workerId, name, onPick, onType, error, disabled }) {
  const [term, setTerm] = useState('')
  const [manual, setManual] = useState(false)

  const list = useQuery({
    queryKey: ['workers'],
    queryFn: () => fetchWorkers(),
    staleTime: 5 * 60_000,
  })

  const workers = list.data?.workers ?? []
  const query = term.trim()

  const shown = useMemo(
    () =>
      query
        ? workers.filter((w) =>
            [w.fullName, w.department, w.jobTitle].some((field) => field?.includes(query)),
          )
        : workers,
    [workers, query],
  )

  if (list.isPending) {
    return (
      <p className="flex items-center gap-2 px-4 pb-3 text-sm text-[var(--l-muted)]">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        טוען את רשימת העובדים…
      </p>
    )
  }

  if (list.data?.mode === 'search') {
    return (
      <SearchMode
        organization={list.data.organization}
        minLength={list.data.minLength ?? 2}
        workerId={workerId}
        name={name}
        onPick={onPick}
        onType={onType}
        error={error}
        disabled={disabled}
      />
    )
  }

  const hasList = list.data?.available && workers.length > 0
  const why = noListReason(list)

  if (!hasList || manual) {
    return (
      <div className="flex flex-col gap-1 px-4 pb-3">
        <input
          type="text"
          maxLength={120}
          value={name}
          disabled={disabled}
          autoFocus={manual}
          onChange={(event) => onType(event.target.value)}
          placeholder="הקלד/י את שם העובד/ת"
          aria-label="שם העובד/ת"
          aria-invalid={Boolean(error)}
          className={fieldClass(error)}
        />
        <p className="text-xs text-[var(--l-muted)]">
          {hasList ? 'השם לא מוצג למנהלי הארגון.' : `${why} אפשר להקליד שם. השם לא מוצג למנהלי הארגון.`}
        </p>
        {hasList && (
          <button
            type="button"
            onClick={() => setManual(false)}
            className="self-start text-xs font-semibold text-[var(--l-primary)] hover:underline"
          >
            חזרה לרשימת העובדים
          </button>
        )}
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 pb-3">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[var(--l-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={term}
          disabled={disabled}
          autoFocus
          onChange={(event) => setTerm(event.target.value)}
          placeholder={`חיפוש בין ${workers.length} עובדי ${list.data.organization ?? 'הארגון'}…`}
          aria-label="חיפוש עובד/ת"
          className={cn(fieldClass(error), 'pe-9')}
        />
      </div>

      <ul
        role="listbox"
        aria-label="עובדי הארגון"
        className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-[var(--l-ring)] bg-white"
      >
        {shown.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-[var(--l-muted)]">
            לא נמצא/ה עובד/ת בשם הזה.
          </li>
        ) : (
          shown.map((worker) => {
            const selected = worker.id === workerId
            const detail = [worker.department, worker.jobTitle].filter(Boolean).join(' · ')
            return (
              <li key={worker.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(worker)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-[var(--l-ring)]/60 px-4 py-2.5 text-start transition-colors last:border-b-0',
                    selected ? 'bg-[var(--l-soft)]' : 'hover:bg-[var(--l-soft)]/40',
                  )}
                >
                  <UserRound size={15} className="shrink-0 text-[var(--l-muted)]" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-[var(--l-ink)]">
                      {worker.fullName}
                    </span>
                    {detail && (
                      <span className="block truncate text-xs text-[var(--l-muted)]">{detail}</span>
                    )}
                  </span>
                  {selected && (
                    <Check size={16} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })
        )}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--l-muted)]">השם לא מוצג למנהלי הארגון.</p>
        <button
          type="button"
          onClick={() => {
            setManual(true)
            onType('')
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--l-primary)] hover:underline"
        >
          <Keyboard size={13} aria-hidden="true" />
          לא ברשימה? הקלד/י שם
        </button>
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  )
}

/* ------------------------------------------------------------ search mode */

/**
 * One box: what is typed is the name, and from `minLength` letters on,
 * matching colleagues are suggested underneath. Picking a suggestion fills
 * the box and sets the id; typing again makes it a plain name again.
 *
 * Debounced, so a name typed at speed is one request, not one per letter -
 * the endpoint is rate limited, and that limit is part of what keeps this
 * mode from being a way to copy the staff list.
 */
function SearchMode({ organization, minLength, workerId, name, onPick, onType, error, disabled }) {
  const [open, setOpen] = useState(false)
  const typed = name.trim()
  const debounced = useDebounced(typed, 250)
  const ready = debounced.length >= minLength && !workerId

  const search = useQuery({
    queryKey: ['workers', 'search', debounced],
    queryFn: () => fetchWorkers(debounced),
    enabled: ready,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const suggestions = ready ? (search.data?.workers ?? []) : []
  const showList = open && ready && typed.length >= minLength

  return (
    <div className="relative flex flex-col gap-1 px-4 pb-3">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[var(--l-muted)]"
          aria-hidden="true"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls="worker-suggestions"
          aria-autocomplete="list"
          maxLength={120}
          value={name}
          disabled={disabled}
          autoFocus
          onFocus={() => setOpen(true)}
          // Delayed so a click on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            onType(event.target.value)
            setOpen(true)
          }}
          placeholder={`הקלד/י את שם העובד/ת${organization ? ` ב־${organization}` : ''}`}
          aria-label="שם העובד/ת"
          aria-invalid={Boolean(error)}
          className={cn(fieldClass(error), 'pe-9')}
        />
        {workerId && (
          <Check
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--l-primary)]"
            aria-label="נבחר/ה מהרשימה"
          />
        )}
      </div>

      {showList && (
        <ul
          id="worker-suggestions"
          role="listbox"
          className="absolute inset-x-4 top-11 z-20 max-h-64 overflow-y-auto rounded-xl border border-[var(--l-ring)] bg-white shadow-lg"
        >
          {search.isFetching && !suggestions.length ? (
            <li className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--l-muted)]">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              מחפש…
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--l-muted)]">
              לא נמצא/ה. אפשר להשאיר את השם כפי שהוקלד.
            </li>
          ) : (
            suggestions.map((worker) => (
              <li key={worker.id} role="option" aria-selected={worker.id === workerId}>
                <button
                  type="button"
                  // mousedown, not click: it fires before the input's blur.
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onPick(worker)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 border-b border-[var(--l-ring)]/60 px-4 py-2.5 text-start text-[15px] text-[var(--l-ink)] transition-colors last:border-b-0 hover:bg-[var(--l-soft)]/40"
                >
                  <UserRound size={15} className="shrink-0 text-[var(--l-muted)]" aria-hidden="true" />
                  {worker.fullName}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <p className="text-xs text-[var(--l-muted)]">
        {typed.length < minLength
          ? `הקלד/י לפחות ${minLength} אותיות כדי לחפש, או את השם המלא.`
          : workerId
            ? 'נבחר/ה מרשימת הארגון.'
            : 'אפשר לבחור מההצעות או להשאיר את השם כפי שהוקלד.'}{' '}
        השם לא מוצג למנהלי הארגון.
      </p>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  )
}

function useDebounced(value, ms) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return settled
}

/**
 * Why there is no list to pick from - each case is fixed differently, so
 * one generic sentence would leave the user (and us) guessing.
 */
function noListReason(list) {
  if (list.isError) return 'לא הצלחנו לטעון את רשימת העובדים.'
  const { reason, organization } = list.data ?? {}
  if (reason === 'empty') {
    return `טרם הועלתה רשימת עובדים ל${organization ? `־${organization}` : 'ארגון שלך'}.`
  }
  return 'הפרופיל שלך אינו משויך לארגון.'
}

function fieldClass(error) {
  return cn(
    'h-10 w-full rounded-xl border bg-white px-4 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]',
    error ? 'border-red-400' : 'border-[var(--l-ring)]',
  )
}
