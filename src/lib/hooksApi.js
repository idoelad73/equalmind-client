import { api } from './api'

/**
 * Every Hook in the system. Equalmind staff only.
 *
 * All four sit behind requireSystemAdmin on the server, so a regular
 * account gets a 403 rather than a list. This is the one view where a
 * report's reporter and its target are both readable - the organisation's
 * dashboard reads a different endpoint that returns neither.
 */

export async function fetchHooks(params = {}) {
  // Blank filters are left out rather than sent empty: the server treats an
  // absent filter as "no clause", and an empty string would be a filter
  // that matches nothing.
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  )
  const { data } = await api.get('/reports/all', { params: clean })
  return data
}

export async function createHook(body) {
  const { data } = await api.post('/reports/all', body)
  return data
}

export async function updateHook(id, body) {
  const { data } = await api.patch(`/reports/${id}`, body)
  return data
}

export async function deleteHook(id) {
  const { data } = await api.delete(`/reports/${id}`)
  return data
}
