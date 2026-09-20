import { useEffect, useId, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Loader2, MapPin, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { detectLocality, searchLocalities } from '@/lib/reportsApi'

const DEBOUNCE_MS = 250

/**
 * Locality picker: type to search the CBS list, or let the browser detect it.
 *
 * `value` is `{ code, name } | null`. `code` is the official CBS code and may
 * be null when geolocation named a place that is not on the list - the report
 * still carries the name, so a missing code degrades the data rather than
 * blocking the report.
 */
export function LocalityPicker({ value, onChange, error, disabled = false }) {
  const id = useId()
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [geoError, setGeoError] = useState(null)
  const boxRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term])

  // Close when focus leaves the whole widget, not just the input - clicking
  // an option blurs the input before the click lands.
  useEffect(() => {
    function onPointerDown(event) {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const search = useQuery({
    queryKey: ['localities', debounced],
    queryFn: () => searchLocalities(debounced),
    enabled: debounced.length >= 1 && !disabled,
    staleTime: 5 * 60_000,
  })

  const detect = useMutation({
    mutationFn: detectLocality,
    onMutate: () => setGeoError(null),
    onSuccess: (data) => {
      onChange({ code: data.locality.code, name: data.locality.name })
      setTerm('')
      setOpen(false)
    },
    onError: (err) => setGeoError(err.message),
  })

  const results = search.data?.results ?? []
  const degraded = search.data?.degraded

  function pick(locality) {
    onChange({ code: locality.code, name: locality.name })
    setTerm('')
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event) {
    if (!open || !results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      pick(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={boxRef}>
      <span className="text-sm font-medium text-[var(--l-ink)]">
        היישוב <span className="font-normal text-[var(--l-muted)]">(חובה)</span>
      </span>

      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--l-primary)] bg-[var(--l-soft)]/50 px-4 py-3">
          <Check size={16} className="shrink-0 text-[var(--l-primary)]" aria-hidden="true" />
          <span className="flex-1 text-[15px] font-medium text-[var(--l-ink)]">
            {value.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="שינוי יישוב"
            className="shrink-0 rounded-full p-1 text-[var(--l-muted)] transition-colors hover:bg-white hover:text-[var(--l-ink)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--l-muted)]"
              aria-hidden="true"
            />
            <input
              id={id}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-invalid={Boolean(error)}
              autoComplete="off"
              disabled={disabled}
              value={term}
              placeholder="בחר/י יישוב מהרשימה…"
              onChange={(event) => {
                setTerm(event.target.value)
                setOpen(true)
                setActive(-1)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              className={cn(
                'h-11 w-full rounded-xl border bg-white pe-4 ps-10 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70',
                error ? 'border-red-400' : 'border-[var(--l-ring)] focus:border-[var(--l-primary)]',
              )}
            />

            {open && debounced.length >= 1 && (
              <ul
                id={`${id}-list`}
                role="listbox"
                className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--l-ring)] bg-white py-1 shadow-lg"
              >
                {search.isFetching && (
                  <li className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--l-muted)]">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    מחפש…
                  </li>
                )}

                {!search.isFetching && degraded && (
                  <li className="px-4 py-3 text-sm text-amber-700">
                    רשימת היישובים אינה זמינה כרגע. נסה/י שוב בעוד מספר רגעים.
                  </li>
                )}

                {!search.isFetching && !degraded && results.length === 0 && (
                  <li className="px-4 py-3 text-sm text-[var(--l-muted)]">
                    לא נמצא יישוב מתאים.
                  </li>
                )}

                {results.map((locality, index) => (
                  <li key={locality.code} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => pick(locality)}
                      className={cn(
                        'flex w-full items-baseline gap-2 px-4 py-2.5 text-start text-[15px] transition-colors',
                        index === active
                          ? 'bg-[var(--l-soft)] text-[var(--l-ink)]'
                          : 'text-[var(--l-ink)]',
                      )}
                    >
                      <span className="font-medium">{locality.name}</span>
                      {locality.district && (
                        <span className="text-xs text-[var(--l-muted)]">
                          נפת {locality.district}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-[var(--l-ring)]" />
            <span className="text-xs text-[var(--l-muted)]">או</span>
            <span className="h-px flex-1 bg-[var(--l-ring)]" />
          </div>

          <button
            type="button"
            disabled={disabled || detect.isPending}
            onClick={() => detect.mutate()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--l-ring)] bg-white text-[15px] font-medium text-[var(--l-ink)] transition-colors hover:border-[var(--l-primary)] hover:bg-[var(--l-soft)]/40 disabled:opacity-60"
          >
            {detect.isPending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <MapPin size={16} className="text-[var(--l-primary)]" aria-hidden="true" />
            )}
            המיקום שלי (זיהוי אוטומטי של היישוב)
          </button>
        </>
      )}

      {geoError && (
        <p role="alert" className="text-sm text-amber-700">
          {geoError}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
