import { useEffect, useId, useRef, useState } from 'react'
import { Building2, Check, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchOrganizations } from '@/lib/registryApi'

/**
 * Organisation picker backed by the Israeli registries (data.gov.il).
 *
 * Selecting a row - rather than typing a name - is what makes the answer
 * useful: it carries the registration number, so the organisation can be
 * checked against the registry later. A typed name proves nothing.
 *
 * `required` means a selection is mandatory and free text is rejected.
 * `allowManual` lets the user proceed with a typed name when the registry has
 * no entry, which it will not for municipalities and government bodies -
 * neither registry covers them.
 */
export function OrgAutocomplete({
  label = 'שם הארגון',
  value,               // { name, registryId, source } | null
  onChange,
  required = false,
  allowManual = false,
  error,
  hint,
  placeholder = 'התחל/י להקליד שם ארגון…',
}) {
  const id = useId()
  const boxRef = useRef(null)
  const inputRef = useRef(null)

  const [text, setText] = useState(value?.name ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [degraded, setDegraded] = useState(false)

  const selected = Boolean(value?.registryId)

  // Reflect an externally supplied value (prefill on the invite form).
  useEffect(() => {
    if (value?.name && value.name !== text) setText(value.name)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.name])

  // Debounced lookup. A selected row is not re-queried - the user is done.
  useEffect(() => {
    if (selected || text.trim().length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)

    const timer = setTimeout(async () => {
      const { results: rows, degraded: down } = await searchOrganizations(text)
      if (cancelled) return
      setResults(rows)
      setDegraded(down)
      setLoading(false)
      setOpen(true)
      setActive(-1)
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
      setLoading(false)
    }
  }, [text, selected])

  // Close when focus or a click leaves the component.
  useEffect(() => {
    function onDocClick(event) {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function choose(row) {
    setText(row.name)
    setOpen(false)
    setActive(-1)
    onChange({
      name: row.name,
      registryId: row.id,
      source: row.source,
      city: row.city ?? null,
      status: row.status ?? null,
    })
  }

  function clear() {
    setText('')
    setResults([])
    onChange(null)
    inputRef.current?.focus()
  }

  function handleType(next) {
    setText(next)
    // Editing after a selection invalidates it: the name no longer
    // corresponds to a registry row.
    if (selected) onChange(allowManual ? { name: next, registryId: null, source: null } : null)
    else if (allowManual) onChange(next ? { name: next, registryId: null, source: null } : null)
  }

  function handleKey(event) {
    if (!open || !results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const listId = `${id}-list`

  return (
    <div ref={boxRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--l-ink)]">
        {label}{' '}
        <span className="font-normal text-[var(--l-muted)]">
          ({required ? 'חובה' : 'אופציונלי'})
        </span>
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(e) => handleType(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={handleKey}
          className={cn(
            'h-12 w-full rounded-xl border bg-white pe-10 ps-3 text-[15px] outline-none transition-colors',
            error
              ? 'border-red-400 focus:border-red-500'
              : selected
                ? 'border-[var(--l-primary)]'
                : 'border-[var(--l-ring)] focus:border-[var(--l-primary)]',
          )}
        />

        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
          {loading ? (
            <Loader2 size={17} className="animate-spin text-[var(--l-muted)]" aria-hidden="true" />
          ) : selected ? (
            <Check size={17} className="text-[var(--l-primary)]" aria-hidden="true" />
          ) : (
            <Search size={17} className="text-[var(--l-muted)]" aria-hidden="true" />
          )}
        </span>

        {text && (
          <button
            type="button"
            onClick={clear}
            aria-label="ניקוי"
            className="absolute inset-y-0 end-9 flex items-center text-[var(--l-muted)] hover:text-[var(--l-ink)]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-[var(--l-ring)] bg-white py-1 shadow-lg"
        >
          {results.map((row, index) => (
            <li key={`${row.source}-${row.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(row)}
                className={cn(
                  'flex w-full items-start gap-3 px-3 py-2.5 text-start transition-colors',
                  index === active ? 'bg-[var(--l-soft)]' : 'hover:bg-slate-50',
                )}
              >
                <Building2
                  size={16}
                  className="mt-0.5 shrink-0 text-[var(--l-primary)]"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[var(--l-ink)]">
                    {row.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--l-muted)]">
                    {row.source === 'nonprofits' ? 'עמותה' : 'חברה'} · {row.id}
                    {row.city ? ` · ${row.city}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && value?.registryId && (
        <p className="text-xs text-[var(--l-primary)]">
          נבחר מהמרשם · מספר {value.registryId}
          {value.city ? ` · ${value.city}` : ''}
        </p>
      )}

      {degraded && (
        <p className="text-xs text-amber-700">
          מרשם החברות אינו זמין כרגע.
          {allowManual ? ' אפשר להקליד את שם הארגון ידנית.' : ' נסה/י שוב בעוד מספר רגעים.'}
        </p>
      )}

      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[var(--l-muted)]">{hint}</span>
      ) : null}
    </div>
  )
}
