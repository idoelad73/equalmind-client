import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY,
)

export const supabase = isSupabaseConfigured
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Surfaced as a normal auth error so the form can show it like any other. */
export function assertConfigured() {
  if (!supabase) {
    throw new Error(
      'החיבור לשרת ההזדהות אינו מוגדר. יש להשלים את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY בקובץ client/.env.',
    )
  }
}
