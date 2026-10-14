/**
 * Everything that has to be re-read after a Hook is approved or denied.
 *
 * Three separate queries show the same `reports.review_status`: the badge
 * counts it, the queue filters on it, and HOOKS של משתמשים displays it.
 * The server cannot disagree with itself - they all read one column - but
 * three caches can, and did: approving from the queue left the list showing
 * a Hook as ממתין לאישור while the badge had already dropped.
 *
 * So the invalidation lives in one place rather than being repeated at each
 * call site, where the next one added would be one line short.
 */
export function invalidateAfterReview(queryClient, { space } = {}) {
  // The queue itself.
  queryClient.invalidateQueries({ queryKey: ['messages'] })
  // The badge, which polls on its own timer and would otherwise keep the
  // old number long enough to read as the click not having worked.
  queryClient.invalidateQueries({ queryKey: ['message-count'] })
  // HOOKS של משתמשים, whichever filters it happens to be showing.
  queryClient.invalidateQueries({ queryKey: ['hooks'] })
  // An approval can add a catalogue row; drop the cached copy so the report
  // wizard offers it without waiting out its staleTime.
  if (space) queryClient.invalidateQueries({ queryKey: ['behaviors', space] })
}
