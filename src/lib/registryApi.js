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

/** The current user's profile row, including any declared workplace. */
export async function fetchMyProfile() {
  const { supabase } = await import('./supabase')
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('email, full_name, user_type, org_name, org_registry_id, org_registry_source')
    .maybeSingle()
  return data ?? null
}
