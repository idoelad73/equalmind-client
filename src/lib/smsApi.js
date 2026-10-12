import { api } from './api'

/**
 * The opt-out link's endpoint. Public - no token, no session.
 *
 * The server answers every token the same way, known or not, so there is
 * nothing here to branch on: a resolved call means the page can say "done".
 */
export async function optOut(token) {
  const { data } = await api.post('/sms/opt-out', { token })
  return data
}
