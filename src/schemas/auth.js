import { z } from 'zod'

/**
 * The account identifier is an email address in valid format. It does not have
 * to be a mailbox the person actually reads - anonymity comes from choosing an
 * address that does not identify them, not from omitting the field.
 *
 * zod's own email validator is used rather than a hand-written regex: it
 * tracks the standard, and Supabase Auth validates the format again server
 * side, so a bad address is rejected on both ends.
 */
export const emailSchema = z
  .email('כתובת אימייל לא תקינה')
  .trim()
  .max(254, 'כתובת האימייל ארוכה מדי')
  .transform((value) => value.toLowerCase())

export const passwordSchema = z
  .string()
  .min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים')
  .max(72, 'הסיסמה ארוכה מדי')

/** Optional, self-declared workplace. Set from the profile page, not at signup. */
export const affiliationSchema = z
  .object({
    name: z.string().trim().min(2, 'נא לבחור ארגון'),
    registryId: z.string().nullable().optional(),
    source: z.enum(['companies', 'nonprofits']).nullable().optional(),
  })
  .nullable()

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

/**
 * Registration asks for the address twice. With no confirmation email to fall
 * back on, a typo would create an account the person can never sign into - so
 * the re-type does the job the confirmation link normally would.
 */
/** Israeli mobile, in any of the forms people type it. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?972[-\s]?|0)5\d[-\s]?\d{3}[-\s]?\d{4}$/, 'מספר נייד לא תקין (למשל 050-1234567)')

const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => (value === '' ? undefined : value))

/** Where the person lives, chosen from the CBS list rather than typed. */
export const residenceSchema = z
  .object({
    code: z.string().nullable(),
    name: z.string().trim().min(1).max(120),
  })
  // nullish, not nullable: the field is null while nothing is picked and
  // absent if a caller omits it entirely, and both should read as the same
  // Hebrew message rather than a zod type error.
  .nullish()
  .refine((value) => value != null, { message: 'יש לבחור מקום מגורים' })

export const registerSchema = z
  .object({
    // Required: it is what lets a report be read against where someone
    // actually lives, rather than only where an incident happened.
    residence: residenceSchema,

    // Optional: an anonymous account stays valid without any of these.
    organization: affiliationSchema.optional(),
    fullName: optionalText(100, 'השם ארוך מדי'),
    phone: phoneSchema.optional().or(z.literal('').transform(() => undefined)),
    address: optionalText(200, 'הכתובת ארוכה מדי'),
    gender: z.enum(['male', 'female', 'not_relevant']).optional(),

    email: emailSchema,
    emailConfirm: z
      .string()
      .min(1, 'נא להזין שוב את כתובת האימייל')
      .transform((value) => value.trim().toLowerCase()),
    password: passwordSchema,
  })
  .refine((data) => data.email === data.emailConfirm, {
    message: 'כתובות האימייל אינן תואמות',
    path: ['emailConfirm'],
  })

/** Flatten a ZodError into { field: firstMessage }. */
export function fieldErrors(error) {
  const out = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}
