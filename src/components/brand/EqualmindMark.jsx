/**
 * The Equalmind mark: the same artwork the browser tab shows.
 *
 * Inlined rather than <img src="/favicon.svg"> so it renders at the first
 * paint with everything else - a separate request for a 24px logo shows as
 * a blank square on a cold load, which is exactly where a brand mark is
 * most noticed.
 *
 * KEEP IN STEP WITH public/favicon.svg. Two copies of a logo is one more
 * than anyone wants, but the alternatives are worse: a fetch for the tab
 * icon, or a build step that inlines it. If the artwork changes, change
 * both - they are meant to be the same mark, and a visitor comparing the
 * tab to the page will notice before any of us do.
 *
 * The mark carries its own rounded-square background, so it is never
 * wrapped in another tile.
 */
export function EqualmindMark({ size = 36, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Equalmind"
    >
      <rect width="32" height="32" rx="7" fill="#17505E" />
      <circle cx="16" cy="16" r="11" fill="#FFFFFF" />
      <rect x="10" y="11.5" width="12" height="3.2" rx="1.6" fill="#17505E" />
      <rect x="10" y="17.3" width="12" height="3.2" rx="1.6" fill="#17505E" />
    </svg>
  )
}
