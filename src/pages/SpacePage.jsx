import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { findSpace, SPACE_TONES } from '@/lib/spaces'

/** Step two of creating a HOOK. The behaviour list is not built yet. */
export function SpacePage() {
  const { space: key } = useParams()
  const space = findSpace(key)

  // An unknown space in the URL is a broken link, not a page.
  if (!space) return <Navigate to={paths.app} replace />

  const { icon: Icon, label, description, tone } = space

  return (
    <section className="flex flex-col gap-8">
      <Link
        to={paths.app}
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-[var(--l-primary)] hover:underline"
      >
        <ChevronRight size={16} aria-hidden="true" />
        חזרה לבחירת מרחב
      </Link>

      <header className="flex items-center gap-4">
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
            SPACE_TONES[tone].tile,
          )}
        >
          <Icon size={24} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--l-ink)]">
            {label}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--l-muted)]">{description}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-[15px] font-medium text-[var(--l-ink)]">
          בחירת ההתנהגות תופיע כאן
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--l-muted)]">
          המערכת תציע סוגים שונים של התנהגויות אופייניות ל{label}, ובמספר צעדים
          קצרים אפשר יהיה לעשות <bdi>HOOK</bdi>.
        </p>
      </div>
    </section>
  )
}
