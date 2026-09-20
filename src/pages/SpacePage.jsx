import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Armchair,
  Building2,
  ChevronLeft,
  CircleAlert,
  Loader2,
  Search,
  Tag,
  Users,
} from 'lucide-react'
import { WizardCard, WizardShell } from '@/components/report/WizardShell'
import { fetchBehaviors } from '@/lib/reportsApi'
import { findSpace } from '@/lib/spaces'
import { paths } from '@/routes/paths'

/**
 * Icons are keyed on category_key rather than the Hebrew label, so rewording
 * a category in the database cannot silently change which icon appears.
 */
const CATEGORY_ICONS = {
  public_spaces: Users,
  physical_infrastructure: Armchair,
  municipal_services: Building2,
}

/** Steps one and two: pick a category, then a behaviour within it. */
export function SpacePage() {
  const { space: key } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const space = findSpace(key)
  const category = params.get('c')

  const catalogue = useQuery({
    queryKey: ['behaviors', key],
    queryFn: () => fetchBehaviors(key),
    enabled: Boolean(space),
    staleTime: 10 * 60_000,
  })

  // An unknown space in the URL is a broken link, not a page.
  if (!space) return <Navigate to={paths.app} replace />

  const title = `דיווח ${space.possessive}`

  if (catalogue.isPending) {
    return (
      <WizardShell title={title} step={1} backTo={paths.app}>
        <WizardCard className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--l-muted)]">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          טוען…
        </WizardCard>
      </WizardShell>
    )
  }

  if (catalogue.isError) {
    return (
      <WizardShell title={title} step={1} backTo={paths.app}>
        <WizardCard className="flex flex-col items-center gap-3 py-10 text-center">
          <CircleAlert size={22} className="text-red-600" aria-hidden="true" />
          <p className="text-[15px] text-[var(--l-ink)]">
            לא הצלחנו לטעון את רשימת ההתנהגויות.
          </p>
          <button
            type="button"
            onClick={() => catalogue.refetch()}
            className="text-sm font-semibold text-[var(--l-primary)] hover:underline"
          >
            נסה/י שוב
          </button>
        </WizardCard>
      </WizardShell>
    )
  }

  const { categories, behaviors } = catalogue.data

  if (!behaviors.length) {
    return (
      <WizardShell title={title} step={1} backTo={paths.app}>
        <WizardCard className="py-10 text-center">
          <p className="text-[15px] font-medium text-[var(--l-ink)]">
            עדיין אין התנהגויות ב{space.label}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--l-muted)]">
            הרשימה מנוהלת במסד הנתונים ותופיע כאן ברגע שתתמלא.
          </p>
        </WizardCard>
      </WizardShell>
    )
  }

  return category ? (
    <BehaviorStep
      title={title}
      space={space}
      category={categories.find((c) => c.key === category)}
      behaviors={behaviors}
      onBack={() => setParams({}, { replace: false })}
      onPick={(behavior) => navigate(paths.reportDetails(space.key, behavior.id))}
    />
  ) : (
    <CategoryStep
      title={title}
      categories={categories}
      onPick={(next) => setParams({ c: next.key })}
    />
  )
}

/* ------------------------------------------------------------------ step 1 */

function CategoryStep({ title, categories, onPick }) {
  return (
    <WizardShell title={title} step={1} backTo={paths.app} backLabel="חזרה לבחירת מרחב">
      <WizardCard>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--l-ink)]">באיזה הקשר זה קרה?</h2>
          <p className="mt-1 text-sm text-[var(--l-muted)]">בחר/י את הסוג המתאים</p>
        </div>

        <ul className="mt-6 flex flex-col gap-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.key] ?? Tag
            return (
              <li key={category.key}>
                <button
                  type="button"
                  onClick={() => onPick(category)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-[var(--l-ring)] bg-white px-4 py-4 text-start transition-all hover:-translate-y-0.5 hover:border-[var(--l-primary)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--l-soft)] text-[var(--l-primary)] transition-transform group-hover:scale-105">
                    <Icon size={20} aria-hidden="true" />
                  </span>

                  <span className="flex-1 text-[15px] font-semibold text-[var(--l-ink)]">
                    {category.label}
                  </span>

                  <ChevronLeft
                    size={18}
                    className="shrink-0 text-[var(--l-muted)] transition-transform group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </WizardCard>
    </WizardShell>
  )
}

/* ------------------------------------------------------------------ step 2 */

function BehaviorStep({ title, space, category, behaviors, onBack, onPick }) {
  const [term, setTerm] = useState('')
  const query = term.trim()

  // Typing searches the whole space, not just the chosen category - the
  // wording someone remembers rarely tells them which category we filed it
  // under. With no search term, the chosen category alone is shown.
  const groups = useMemo(() => {
    const matching = query
      ? behaviors.filter((b) => b.name.includes(query))
      : behaviors.filter((b) => b.categoryKey === category?.key)

    const byCategory = new Map()
    for (const behavior of matching) {
      const list = byCategory.get(behavior.categoryKey)
      if (list) list.push(behavior)
      else byCategory.set(behavior.categoryKey, [behavior])
    }

    return [...byCategory.entries()].map(([key, items]) => ({
      key,
      label: items[0].categoryLabel,
      items,
    }))
  }, [behaviors, category?.key, query])

  return (
    <WizardShell title={title} step={2} backTo={paths.space(space.key)} backLabel="חזרה">
      <WizardCard>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--l-ink)]">
            {query ? 'כל ההתנהגויות' : (category?.label ?? 'כל ההתנהגויות')}
          </h2>
          <p className="mt-1 text-sm text-[var(--l-muted)]">
            חפש/י או דפדפ/י ברשימה המלאה
          </p>
        </div>

        <div className="relative mt-5">
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

        {groups.length === 0 ? (
          <p className="mt-8 text-center text-sm text-[var(--l-muted)]">
            לא נמצאה התנהגות מתאימה.{' '}
            <button
              type="button"
              onClick={onBack}
              className="font-semibold text-[var(--l-primary)] hover:underline"
            >
              חזרה לקטגוריות
            </button>
          </p>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="rounded-lg bg-[var(--l-soft)]/70 px-3 py-2 text-sm font-bold text-[var(--l-ink)]">
                  {group.label}
                </h3>

                <ul className="mt-2 flex flex-col gap-2">
                  {group.items.map((behavior) => (
                    <li key={behavior.id}>
                      <button
                        type="button"
                        onClick={() => onPick(behavior)}
                        className="w-full rounded-xl border border-[var(--l-ring)] bg-white px-4 py-3.5 text-start text-[15px] leading-relaxed text-[var(--l-ink)] transition-all hover:-translate-y-0.5 hover:border-[var(--l-primary)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]"
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
      </WizardCard>
    </WizardShell>
  )
}
