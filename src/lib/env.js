import { z } from 'zod'

/**
 * Validate client env at startup so a missing or malformed variable fails
 * loudly here instead of as a confusing runtime error deep in a component.
 */
const schema = z.object({
  VITE_API_URL: z.string().min(1).default('/api'),
  VITE_APP_NAME: z.string().min(1).default('Equalmind'),
  // Optional at build time so the app still runs before Supabase is
  // configured; lib/supabase.js reports a clear error if they are missing.
  VITE_SUPABASE_URL: z.string().default(''),
  VITE_SUPABASE_ANON_KEY: z.string().default(''),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Invalid client environment:', z.treeifyError(parsed.error))
  throw new Error('Invalid client environment. Check your .env against .env.example.')
}

export const env = parsed.data
