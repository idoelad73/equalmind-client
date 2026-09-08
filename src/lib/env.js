import { z } from 'zod'

/**
 * Validate client env at startup so a missing or malformed variable fails
 * loudly here instead of as a confusing runtime error deep in a component.
 */
const schema = z.object({
  VITE_API_URL: z.string().min(1).default('/api'),
  VITE_APP_NAME: z.string().min(1).default('Equalmind'),
})

const parsed = schema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('Invalid client environment:', z.treeifyError(parsed.error))
  throw new Error('Invalid client environment. Check your .env against .env.example.')
}

export const env = parsed.data
