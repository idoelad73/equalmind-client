import { z } from 'zod'

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v))

/**
 * Step three of the report wizard.
 *
 * The locality is the only required field. Everything else is optional by
 * design: a report that is awkward to file does not get filed, and the one
 * thing the alert engine cannot work without is where it happened.
 */
export const reportDetailsSchema = z.object({
  behaviorId: z.uuid('התנהגות לא תקינה'),

  locality: z
    .object({
      code: z.string().nullable(),
      name: z.string().trim().min(1).max(120),
    })
    .nullable()
    .refine((v) => v !== null, { message: 'יש לבחור יישוב או להשתמש בזיהוי מיקום' }),

  // 'now' | 'exact' | 'text' | 'unknown'
  whenMode: z.enum(['now', 'exact', 'text', 'unknown']).default('unknown'),
  occurredAt: z.string().optional(),
  occurredText: optionalText(120),

  notes: optionalText(1000),
})

/** Form state to the request body the API expects. */
export function toReportPayload(form, photoPublicId) {
  const payload = {
    behaviorId: form.behaviorId,
    localityName: form.locality.name,
    notes: form.notes || undefined,
    photoPublicId: photoPublicId || undefined,
  }

  if (form.locality.code) payload.localityCode = form.locality.code

  if (form.whenMode === 'now') {
    payload.occurredAt = new Date().toISOString()
  } else if (form.whenMode === 'exact' && form.occurredAt) {
    // <input type="datetime-local"> has no zone; it means local time.
    payload.occurredAt = new Date(form.occurredAt).toISOString()
  } else if (form.whenMode === 'text' && form.occurredText) {
    payload.occurredText = form.occurredText
  }

  return payload
}
