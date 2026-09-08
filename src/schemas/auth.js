import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('כתובת אימייל לא תקינה'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
})

export const registerSchema = loginSchema
  .extend({
    fullName: z.string().min(2, 'נא להזין שם מלא'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'הסיסמאות אינן תואמות',
    path: ['confirmPassword'],
  })

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string().nullable(),
  role: z.enum(['user', 'admin']),
})
