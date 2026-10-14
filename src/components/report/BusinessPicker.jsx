import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Check, Loader2, LocateFixed, MapPin, Search, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { currentPosition, searchPlaces } from '@/lib/reportsApi'

const MIN = 2

/**
 * "שם העסק (חובה)" for the consumption form.
 *
 * One box: what is typed IS the business name, and from two letters on,
 * matching businesses are suggested underneath. Picking one adds its
 * address and town (value.id is set); typing again makes it a plain name.
 * The search is a help, never a gate - a business it does not know, or an
 * outage, still leaves a typed name that files fine.
 *
 * "Use my location" only ranks nearby branches first. The position goes to
 * our server, which rounds it to ~1km before searching, and is not stored.
 */
export function BusinessPicker({ value, onChange, error, disabled }) {
  const [open, setOpen] = useState(false)
  const [near, setNear] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState(null)

  const typed = value?.name ?? ''
  const picked = Boolean(value?.id)
  const debounced = useDebounced(typed.trim(), 250)
  const ready = debounced.length >= MIN && !picked

  const search = useQuery({
    queryKey: ['places', debounced, near?.lat, near?.lon],
    queryFn: () => searchPlaces(debounced, near),
    enabled: ready,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  })

  const results = ready ? (search.data?.results ?? []) : []
  const showList = open && ready && typed.trim().length >= MIN

  async function locate() {
    setLocating(true)
    setLocateError(null)
    try {
      setNear(await currentPosition())
      setOpen(true)
    } catch (err) {
      setLocateError(err.message)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--l-ink)]">
        <Store size={15} className="text-[var(--l-muted)]" aria-hidden="true" />
        שם העסק <span className="font-normal text-red-600">(חובה)</span>
      </span>

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
          aria-controls="business-suggestions"
          aria-autocomplete="list"
          aria-label="שם העסק"
          aria-invalid={Boolean(error)}
          maxLength={120}
          value={typed}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          // Delayed so a click on a suggestion lands before the list closes.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            const name = event.target.value
            onChange(name ? { name } : null)
            setOpen(true)
          }}
          placeholder="הקלד/י שם עסק או מקום לחיפוש…"
          className={cn(
            'h-11 w-full rounded-xl border bg-white pe-9 ps-9 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]',
            error ? 'border-red-400' : 'border-[var(--l-ring)]',
          )}
        />
        {picked && (
          <Check
            size={16}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--l-primary)]"
            aria-label="נבחר מהחיפוש"
          />
        )}

        {showList && (
          <ul
            id="business-suggestions"
            role="listbox"
            className="absolute inset-x-0 top-12 z-20 max-h-72 overflow-y-auto rounded-xl border border-[var(--l-ring)] bg-white shadow-lg"
          >
            {search.isFetching && !results.length ? (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--l-muted)]">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                מחפש…
              </li>
            ) : search.data?.degraded ? (
              <li className="px-4 py-3 text-sm text-[var(--l-muted)]">
                החיפוש אינו זמין כרגע — אפשר להשאיר את השם כפי שהוקלד.
              </li>
            ) : results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-[var(--l-muted)]">
                לא נמצא עסק בשם הזה — אפשר להשאיר את השם כפי שהוקלד.
              </li>
            ) : (
              results.map((place) => (
                <li key={place.id} role="option" aria-selected={place.id === value?.id}>
                  <button
                    type="button"
                    // mousedown, not click: it fires before the input's blur.
                    onMouseDown={(event) => {
                      event.preventDefault()
                      onChange(place)
                      setOpen(false)
                    }}
                    className="flex w-full items-start gap-3 border-b border-[var(--l-ring)]/60 px-4 py-2.5 text-start transition-colors last:border-b-0 hover:bg-[var(--l-soft)]/40"
                  >
                    <Store size={15} className="mt-0.5 shrink-0 text-[var(--l-muted)]" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--l-ink)]">{place.name}</span>
                      {place.address && (
                        <span className="block truncate text-xs text-[var(--l-muted)]">{place.address}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {picked && value.address && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--l-muted)]">
          <MapPin size={12} aria-hidden="true" />
          {value.address}
        </p>
      )}

      <button
        type="button"
        onClick={locate}
        disabled={disabled || locating}
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors disabled:opacity-60',
          near
            ? 'border-[var(--l-primary)] bg-[var(--l-soft)]/60 text-[var(--l-primary)]'
            : 'border-[var(--l-ring)] bg-white text-[var(--l-ink)] hover:border-[var(--l-primary)]',
        )}
      >
        {locating ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <LocateFixed size={15} aria-hidden="true" />
        )}
        {near ? 'מחפש ליד המיקום שלך' : 'השתמש/י במיקום שלי לחיפוש מדויק יותר'}
      </button>

      {locateError && <p className="text-xs text-amber-800">{locateError}</p>}
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
