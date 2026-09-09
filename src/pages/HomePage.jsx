import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paths } from '@/routes/paths'
import { SPACES, SPACE_TONES } from '@/lib/spaces'

export function HomePage() {
  return (
    <section className="flex flex-col gap-10">
      <header className="text-center">
        <h1 className="text-[clamp(1.75rem,5vw,2.25rem)] font-extrabold tracking-tight text-[var(--l-ink)]">
          יצירת <bdi>HOOK</bdi> חדש
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-[var(--l-muted)]">
          בחר/י את המרחב שבו התרחשה ההתנהגות שברצונך לדווח עליה.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {SPACES.map(({ key, label, description, icon: Icon, tone }) => {
          const styles = SPACE_TONES[tone]
          return (
            <li key={key}>
              <Link
                to={paths.space(key)}
                className={cn(
                  'group flex h-full flex-col items-center justify-center gap-4 rounded-2xl',
                  'border border-slate-200 bg-white px-6 py-8 text-center transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-md',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--l-primary)]',
                  styles.hover,
                )}
              >
                <span
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-2xl transition-transform',
                    'group-hover:scale-105',
                    styles.tile,
                  )}
                >
                  <Icon size={28} aria-hidden="true" />
                </span>

                <span className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-[var(--l-ink)]">{label}</span>
                  <span className="text-sm text-[var(--l-muted)]">{description}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--l-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                  להמשך
                  <ChevronLeft size={15} aria-hidden="true" />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <p className="mx-auto max-w-lg text-center text-xs leading-relaxed text-[var(--l-muted)]">
        ה-<bdi>HOOK</bdi> שלך אנונימי לחלוטין — איש לא יידע מי תרם אותו.
      </p>
    </section>
  )
}
