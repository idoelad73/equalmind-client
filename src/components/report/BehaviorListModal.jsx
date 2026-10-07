import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { List, Plus, Search, X } from 'lucide-react'
import { LANDING_VARS } from '@/pages/landingPalettes'

/**
 * "Not sure? Let's see the full list" - every behaviour in the space, flat,
 * under its category heading, in the catalogue's own order.
 *
 * For someone who cannot tell which category a moment belongs to, so the
 * first step's question is skipped rather than guessed at. The search box
 * narrows the same list; it does not change what a category means.
 */
export function BehaviorListModal({ open, onClose, categories, behaviors, onPick, onAddNew }) {
  const [term, setTerm] = useState('')
  const dialogRef = useRef(null)
  const query = term.trim()

  useEffect(() => {
    if (!open) return setTerm('')
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const groups = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          items: behaviors.filter(
            (b) => b.categoryKey === category.key && (!query || b.name.includes(query)),
          ),
        }))
        .filter((group) => group.items.length),
    [categories, behaviors, query],
  )

  if (!open) return null

  return createPortal(
    <div
      style={LANDING_VARS}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="behavior-list-title"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-[var(--l-ring)] px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--l-soft)] text-[var(--l-primary)]">
            <List size={19} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="behavior-list-title" className="text-lg font-bold text-[var(--l-ink)]">
              כל ההתנהגויות
            </h2>
            <p className="mt-0.5 text-sm text-[var(--l-muted)]">
              חפש/י או דפדפ/י ברשימה המלאה
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-full p-1.5 text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-ink)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-[var(--l-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="חפש/י התנהגות…"
              aria-label="חיפוש התנהגות"
              className="h-11 w-full rounded-xl border border-[var(--l-ring)] bg-white pe-4 ps-10 text-[15px] text-[var(--l-ink)] outline-none transition-colors placeholder:text-[var(--l-muted)]/70 focus:border-[var(--l-primary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {groups.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--l-muted)]">
              לא נמצאה התנהגות מתאימה.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <section key={group.key}>
                  <h3 className="sticky top-0 z-10 rounded-lg bg-[var(--l-soft)] px-3 py-2 text-sm font-bold text-[var(--l-ink)] shadow-[0_1px_0_rgba(14,46,28,0.06)]">
                    {group.label}
                  </h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {group.items.map((behavior) => (
                      <li key={behavior.id}>
                        <button
                          type="button"
                          onClick={() => onPick(behavior)}
                          className="w-full rounded-xl border border-[var(--l-ring)] bg-white px-4 py-3.5 text-start text-[15px] leading-relaxed text-[var(--l-ink)] transition-all hover:border-[var(--l-primary)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]"
                        >
                          {behavior.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--l-ring)] px-6 py-4">
          <AddNewButton onClick={onAddNew} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** "The Hook is not on the list" - shared by step one and the modal. */
export function AddNewButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--l-primary)]/40 bg-white px-4 py-3 text-sm font-semibold text-[var(--l-primary)] transition-colors hover:bg-[var(--l-soft)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]"
    >
      <Plus size={16} aria-hidden="true" />
      ה-<bdi>Hook</bdi> לא ברשימה, אני רוצה להוסיף אחד
    </button>
  )
}
