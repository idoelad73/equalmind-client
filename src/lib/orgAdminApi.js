import { api } from './api'
import { uploadRoster } from './rosterApi'
import { supabase, assertConfigured } from './supabase'

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
    .select(
      'organization_id, full_name, mobile, organizations(name, industry, registry_id, registry_source, address, employee_count)',
    )
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
        org?.name && org?.registry_id
          ? {
              name: org.name,
              registryId: org.registry_id,
              source: org.registry_source,
            }
          : null,
      industry: org?.industry ?? '',
      companyNumber: org?.registry_id ?? '',
      orgAddress: org?.address ?? '',
      employeeCount: org?.employee_count == null ? '' : String(org.employee_count),
    },
  }
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
      employee_count: rest.employeeCount ?? null,
      extra_notes: rest.extraNotes ?? null,
      invite_sms_template: rest.inviteSmsTemplate ?? null,
    },
    { onConflict: 'user_id' },
  )

  if (saveError) {
    throw new Error(
      'הסיסמה נשמרה, אך שמירת הפרטים נכשלה. אפשר להתחבר ולהשלים את הפרטים שוב. ' +
        `(${saveError.message})`,
    )
  }

  // Not best-effort: this is what creates the organisation and attaches the
  // admin to it. Skipping it leaves them holding the role with nothing to
  // administer - no dashboard, no roster, no join code.
  // Distinct from the `organizationId` argument, which is whatever the
  // invitation already knew (usually nothing). This is the row activation
  // just created or reused.
  let createdOrganizationId
  try {
    const { data } = await api.post('/org/activate', {})
    createdOrganizationId = data.organizationId
  } catch (error) {
    throw new Error(
      'הפרטים נשמרו, אך יצירת הארגון נכשלה. יש להתחבר שוב כדי להשלים. ' +
        `(${error?.message ?? 'שגיאה לא ידועה'})`,
    )
  }

  // The roster can only be imported now: it needs the organisation that
  // activation just created, and the membership that authorises the upload.
  //
  // The file itself is never stored. It is parsed, each number is hashed,
  // and the numbers are discarded - which is the whole point, and why this
  // no longer drops the raw CSV into a storage bucket.
  let roster = null
  let rosterError = null
  if (csvFile) {
    try {
      roster = await uploadRoster(csvFile)
    } catch (error) {
      // Onboarding itself succeeded. A bad roster file is worth reporting,
      // not worth undoing an account for - it can be loaded again later.
      rosterError = error?.message ?? 'טעינת רשימת העובדים נכשלה.'
    }
  }

  return { organizationId: createdOrganizationId, roster, rosterError }
}

