import { supabase, assertConfigured } from './supabase'

/**
 * Translate Supabase's English auth errors into Hebrew the user can act on.
 * Anything unrecognised falls through with its original message rather than
 * being swallowed.
 */
function translate(error) {
  const message = error?.message ?? ''
  if (/already registered|already exists|user already/i.test(message))
    return 'כתובת האימייל הזו כבר רשומה. אפשר להתחבר או לבחור כתובת אחרת.'
  if (/invalid login credentials/i.test(message))
    return 'כתובת אימייל או סיסמה שגויים.'
  if (/password should be at least/i.test(message))
    return 'הסיסמה קצרה מדי.'
  if (/unable to validate email|invalid format|email address .* is invalid/i.test(message))
    return 'כתובת האימייל אינה בפורמט תקין.'
  if (/email .* not confirmed/i.test(message))
    return 'החשבון טרם אומת. יש לכבות אימות אימייל בהגדרות Supabase.'
  if (/rate limit|too many/i.test(message))
    return 'יותר מדי ניסיונות. נסה/י שוב בעוד מספר דקות.'
  return message || 'אירעה שגיאה. נסה/י שוב.'
}

/** Shape the parts of the Supabase user the app actually uses. */
function toUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? null,
    provider: user.app_metadata?.provider ?? 'email',
  }
}

export async function register({ email, password, organization }) {
  assertConfigured()

  // The affiliation rides along in signup metadata, which the database
  // trigger copies onto the profile. Safe here because it is a claim about
  // oneself, not a permission - account type is never read from metadata.
  const data_ = organization?.name
    ? {
        org_name: organization.name,
        org_registry_id: organization.registryId ?? '',
        org_registry_source: organization.source ?? '',
      }
    : undefined

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    ...(data_ ? { options: { data: data_ } } : {}),
  })
  if (error) throw new Error(translate(error))

  // With email confirmation switched on, Supabase returns a user but no
  // session. Say so plainly instead of appearing to hang.
  if (!data.session) {
    throw new Error(
      'החשבון נוצר אך לא ניתן להתחבר אוטומטית. יש לכבות אימות אימייל בהגדרות Supabase.',
    )
  }
  return { user: toUser(data.user), accessToken: data.session.access_token }
}

export async function login({ email, password }) {
  assertConfigured()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(translate(error))
  return { user: toUser(data.user), accessToken: data.session.access_token }
}

/** Redirects away from the page; resolves only if the redirect fails. */
export async function loginWithGoogle() {
  assertConfigured()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/app` },
  })
  if (error) throw new Error(translate(error))
}

export async function logout() {
  if (!supabase) return
  await supabase.auth.signOut()
}

/** Restore an existing session on page load (also completes the OAuth return). */
export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (!data.session) return null
  return {
    user: toUser(data.session.user),
    accessToken: data.session.access_token,
  }
}
