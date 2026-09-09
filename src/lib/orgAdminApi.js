import { api } from './api'
import { supabase, assertConfigured } from './supabase'

const EMPLOYEE_LIST_BUCKET = 'employee-lists'

/* ------------------------------------------------------------ public form */

/**
 * Submit interest in registering an organisation.
 *
 * This creates no account and grants nothing. Organisation admins see the
 * reports about their organisation, so that role is never handed out by a
 * public form - it is granted by invitation after verification.
 *
 * It goes to our own API rather than straight to Supabase: the requests table
 * has no RLS policies at all, so the anon key cannot read or write it and the
 * queue cannot be scraped.
 */
export async function submitOrgRequest(details) {
  const { organization, ...rest } = details
  const payload = {
    ...rest,
    orgName: organization?.name,
    companyNumber: organization?.registryId ?? rest.companyNumber ?? undefined,
    registrySource: organization?.source ?? undefined,
  }
  try {
    const { data } = await api.post('/org/requests', payload)
    return data
  } catch (error) {
    if (error?.status === 429) return Promise.reject(new Error('נשלחו יותר מדי בקשות. נסה/י שוב בעוד מספר דקות.'))
    if (error?.status === 400) return Promise.reject(new Error('חלק מהפרטים אינם תקינים. יש לבדוק את השדות המסומנים.'))
    return Promise.reject(new Error(error?.message ?? 'אירעה שגיאה בשליחת הבקשה. נסה/י שוב.'))
  }
}

/* -------------------------------------------------------------- invitation */

/**
 * What we already know about the invited admin, used to prefill the form.
 * The email comes from the invited account and the organisation from the row
 * we created before sending the invitation - no point asking again.
 */
export async function loadInviteContext() {
  assertConfigured()

  const { data } = await supabase.auth.getSession()
  if (!data.session) return null

  const { data: membership } = await supabase
    .from('org_admins')
    .select('organization_id, full_name, mobile, organizations(name, industry, company_number, address, employee_count)')
    .maybeSingle()

  const org = membership?.organizations ?? null

  return {
    email: data.session.user.email ?? '',
    organizationId: membership?.organization_id ?? null,
    prefill: {
      fullName: membership?.full_name ?? '',
      mobile: membership?.mobile ?? '',
      // Shaped for OrgAutocomplete. Only prefilled when we hold a registration
      // number, since a bare name is not a registry selection.
      organization:
        org?.name && org?.company_number
          ? {
              name: org.name,
              registryId: org.company_number,
              source: registrySourceFor(org.company_number),
            }
          : null,
      industry: org?.industry ?? '',
      companyNumber: org?.company_number ?? '',
      orgAddress: org?.address ?? '',
      employeeCount: org?.employee_count == null ? '' : String(org.employee_count),
    },
  }
}

/**
 * Israeli registration numbers are self-describing: עמותות are allocated the
 * 58 block, companies the 51-57 blocks. Enough to label a prefilled value
 * without a second lookup.
 */
function registrySourceFor(id) {
  return String(id).startsWith('58') ? 'nonprofits' : 'companies'
}

/**
 * Complete onboarding: set the account's first password, then store the
 * submitted details.
 *
 * Password first on purpose. If the details insert fails the account is still
 * usable and the form can be resubmitted; if it were the other way round a
 * failure would leave an account nobody can sign into.
 */
export async function completeOnboarding({ organizationId, details, csvFile }) {
  assertConfigured()

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    throw new Error('קישור ההזמנה אינו תקף או שפג תוקפו. יש לפנות אלינו לקבלת הזמנה חדשה.')
  }
  const userId = sessionData.session.user.id

  const { password, confirmPassword: _ignored, ...rest } = details

  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) {
    throw new Error(
      /should be at least/i.test(passwordError.message)
        ? 'הסיסמה קצרה מדי.'
        : passwordError.message,
    )
  }

  let employeeList = null
  if (csvFile) employeeList = await uploadEmployeeList(userId, csvFile)

  const { error: saveError } = await supabase.from('org_admin_details').upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      full_name: rest.fullName,
      mobile: rest.mobile,
      contact_email: rest.contactEmail,
      org_name: rest.organization?.name ?? null,
      registry_id: rest.organization?.registryId ?? null,
      registry_source: rest.organization?.source ?? null,
      org_address: rest.orgAddress ?? null,
      industry: rest.industry,
      company_number: rest.companyNumber ?? null,
      employee_count: rest.employeeCount ?? null,
      extra_notes: rest.extraNotes ?? null,
      employee_list: employeeList,
    },
    { onConflict: 'user_id' },
  )

  if (saveError) {
    throw new Error(
      'הסיסמה נשמרה, אך שמירת הפרטים נכשלה. אפשר להתחבר ולהשלים את הפרטים שוב. ' +
        `(${saveError.message})`,
    )
  }

  // Best effort - org_admins has no UPDATE policy for end users.
  try {
    await api.post('/org/activate', {})
  } catch {
    // The account works; the timestamp can wait.
  }

  return true
}

async function uploadEmployeeList(userId, file) {
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_').slice(-80)}`

  const { error } = await supabase.storage
    .from(EMPLOYEE_LIST_BUCKET)
    .upload(path, file, { contentType: 'text/csv', upsert: false })

  if (error) {
    // Losing an optional attachment should not fail onboarding.
    console.error('[orgAdmin] employee list upload failed:', error.message)
    return null
  }

  return { bucket: EMPLOYEE_LIST_BUCKET, path, name: file.name, size: file.size }
}
