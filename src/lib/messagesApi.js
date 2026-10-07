import { api } from './api'

/**
 * The system admin's review queue.
 *
 * Every one of these is behind requireSystemAdmin on the server, so a
 * regular account gets a 403 rather than an empty list. The navbar treats
 * that 403 as "not staff" and shows nothing, which is why none of these
 * retry on failure.
 */

/** Just the number, for the badge. Polled, so it stays deliberately small. */
export async function fetchMessageCount() {
  const { data } = await api.get('/messages/count')
  return data.pending
}

export async function fetchMessages(status = 'pending') {
  const { data } = await api.get('/messages', { params: { status } })
  return data
}

/**
 * Approve a proposal, which also adds it to the behaviour catalogue.
 * `changes` may carry { name, categoryKey | categoryLabel, note }; anything
 * left out falls back to what the reporter submitted.
 */
export async function approveMessage(id, changes = {}) {
  const { data } = await api.post(`/messages/${id}/approve`, changes)
  return data
}

export async function denyMessage(id, note) {
  const { data } = await api.post(`/messages/${id}/deny`, note ? { note } : {})
  return data
}
