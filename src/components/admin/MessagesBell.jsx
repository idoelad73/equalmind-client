import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { fetchMessageCount } from '@/lib/messagesApi'
import { MessagesModal } from './MessagesModal'

/**
 * The review queue, in the navbar. Staff only.
 *
 * Visibility is decided by the server, not by the client reading a role: the
 * count endpoint sits behind requireSystemAdmin, so a regular account gets a
 * 403 and this renders nothing. One source of truth, and no window where a
 * stale cached profile shows a control that would only 403 when clicked.
 *
 * `retry: false` matters for that - a 403 is an answer, not a failure worth
 * retrying, and retrying it would mean four rejected requests per page load
 * for every non-staff user.
 */
export function MessagesBell() {
  const [open, setOpen] = useState(false)

  const count = useQuery({
    queryKey: ['message-count'],
    queryFn: fetchMessageCount,
    retry: false,
    // A queue that fills a few times a day does not need a tighter loop than
    // this, and the modal refetches on open anyway.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  if (count.isError || count.data === undefined) return null

  const pending = count.data

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={pending > 0 ? `הודעות מערכת, ${pending} ממתינות` : 'הודעות מערכת'}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--l-muted)] transition-colors hover:bg-[var(--l-soft)] hover:text-[var(--l-primary)]"
      >
        {/* Inbox, not a bell. A bell says "something happened"; this is a
            queue of items waiting for a decision, and it is the same shape
            the dialog opens with - so the icon and what it opens agree.
            Even size and stroke so the lines land on whole pixels at 20px
            instead of rendering soft. */}
        <Inbox size={20} strokeWidth={2} aria-hidden="true" />

        {pending > 0 && (
          <span
            // Orange, not the product green: this is a count of work waiting,
            // and it should not read as a success state.
            className="absolute -top-0.5 -end-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white ring-2 ring-white"
            aria-hidden="true"
          >
            {pending > 99 ? '99+' : pending}
          </span>
        )}
      </button>

      <MessagesModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
