import { z } from 'zod'
import { emailSchema } from './auth'

/** Israeli mobile: 05X-XXXXXXX, with or without the separator. */
const mobileSchema = z
  .string()
  .trim()
  .regex(/^05\d[- ]?\d{7}$/, 'מספר נייד לא תקין (למשל 050-1234567)')
  .transform((value) => value.replace(/[-\s]/g, ''))

const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === '' ? undefined : value))

/**
 * Interest in registering an organisation.
 *
 * No password: this form does not create an account. Organisation admins are
 * invited after verification, so there is nothing here to sign in with.
 */
export const orgRequestSchema = z.object({
  fullName: z.string().trim().min(2, 'נא להזין שם מלא').max(100),
  mobile: mobileSchema,
  contactEmail: emailSchema,

  orgName: z.string().trim().min(2, 'נא להזין שם ארגון').max(150),
  orgAddress: optionalText(250),
  industry: z.string().trim().min(2, 'נא להזין ענף או סוג עיסוק').max(120),
  companyNumber: optionalText(30),
  employeeCount: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(1_000_000)])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value)),
  extraNotes: optionalText(1000),
})

/**
 * The onboarding form an invited admin completes.
 *
 * Same organisation fields as the public request form, plus the admin's own
 * details and a password - the account exists from the invitation but has no
 * password until this is submitted.
 */
export const orgOnboardingSchema = z
  .object({
    fullName: z.string().trim().min(2, 'נא להזין שם מלא').max(100),
    mobile: mobileSchema,
    contactEmail: emailSchema,
    password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים').max(72),
    confirmPassword: z.string(),

    orgName: z.string().trim().min(2, 'נא להזין שם ארגון').max(150),
    orgAddress: optionalText(250),
    industry: z.string().trim().min(2, 'נא להזין ענף או סוג עיסוק').max(120),
    companyNumber: optionalText(30),
    employeeCount: z
      .union([z.literal(''), z.coerce.number().int().min(0).max(1_000_000)])
      .optional()
      .transform((value) => (value === '' || value === undefined ? undefined : value)),
    extraNotes: optionalText(1000),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  })

/** The optional employee CSV is a File, so it sits outside the schema. */
export const EMPLOYEE_CSV = {
  required: ['שם', 'שם משפחה', "מס' נייד", 'דוא"ל'],
  optional: ['מגדר', 'ארגון'],
  accept: '.csv,text/csv',
  maxBytes: 2 * 1024 * 1024,
}
