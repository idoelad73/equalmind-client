import { api } from './api'

/**
 * Organisation lookup against the Israeli registries, proxied by our server.
 *
 * A failure is reported as `degraded` rather than thrown: the registry being
 * unreachable should not read as "this organisation does not exist", and the
 * form has to stay usable either way.
 */
export async function searchOrganizations(q, { limit = 8 } = {}) {
  try {
    const { data } = await api.get('/registry/companies', { params: { q, limit } })
    return { results: data.results ?? [], degraded: Boolean(data.degraded) }
  } catch {
    return { results: [], degraded: true }
  }
}

export async function findOrganizationById(id) {
  try {
    const { data } = await api.get('/registry/companies/by-id', { params: { id } })
    return data.company ?? null
  } catch {
    return null
  }
}

/** Save (or clear) the signed-in user's self-declared workplace. */
export async function saveAffiliation(organization) {
  const { data } = await api.put('/org/affiliation', {
    name: organization?.name ?? null,
    registryId: organization?.registryId ?? null,
    source: organization?.source ?? null,
  })
  return data.organization
}

/**
 * Attach by phone number, matched against a roster the employer uploaded.
 *
 * `matched: false` still saves the number - it is how we reach them later -
 * it just means no roster mentions it.
 */
export async function claimByPhone(phone) {
  const { data } = await api.post('/org/claim-phone', { phone })
  return data
}

/** Attach with the organisation's join code. */
export async function joinByCode(code) {
  const { data } = await api.post('/org/join', { code })
  return data
}

/** Detach from an organisation, however the link was made. */
export async function clearAffiliation() {
  const { data } = await api.delete('/org/affiliation')
  return data.organization
}

/** The caller's own join code and roster counts. Org admins only. */
export async function fetchJoinCode() {
  const { data } = await api.get('/org/join-code')
  return data
}

export async function rotateJoinCode() {
  const { data } = await api.post('/org/join-code/rotate')
  return data
}

/** The current user's profile row, including how it is linked. */
export async function fetchMyProfile() {
  const { supabase } = await import('./supabase')
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select(
      'email, full_name, user_type, phone, org_name, org_registry_id, org_registry_source, org_source',
    )
    .maybeSingle()
  return data ?? null
}
