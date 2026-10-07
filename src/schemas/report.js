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
/** Where and when - shared by the catalogue form and the custom Hook form. */
const momentFields = {
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
}

export const reportDetailsSchema = z.object({
  behaviorId: z.uuid('התנהגות לא תקינה'),
  ...momentFields,
})

/** Who a custom Hook is about. Mirrors TARGET_TYPES on the server. */
export const TARGET_TYPES = ['employee', 'my_org', 'local_authority', 'business']

/** The category option that means "none of these - here is a new one". */
export const NEW_CATEGORY = '__new'

/**
 * The "Hook is not on the list" form. Unlike the catalogue form it needs a
 * description, a category and a target, since there is no behaviour row to
 * supply them.
 *
 * description + category are exactly what a behaviors row is made of (name,
 * category_key / category_label), so an approved Hook can join the catalogue
 * as written - see approveMessage on the server.
 */
export const customReportSchema = z
  .object({
    description: z.string().trim().min(3, 'יש לתאר את ה-Hook במשפט').max(200),
    category: z.string().min(1, 'יש לבחור קטגוריה'),
    newCategory: optionalText(80),
    targetType: z.enum(TARGET_TYPES, 'יש לבחור על מי ה-Hook'),
    targetName: optionalText(120),
    ...momentFields,
  })
  .refine((v) => v.category !== NEW_CATEGORY || (v.newCategory?.length ?? 0) >= 2, {
    message: 'יש לתת שם לקטגוריה החדשה',
    path: ['newCategory'],
  })
  .refine((v) => v.targetType !== 'employee' || v.targetName, {
    message: 'יש להזין את שם העובד/ת',
    path: ['targetName'],
  })

/** The fields both request bodies share: place, time and notes. */
function momentPayload(form) {
  const payload = {
    localityName: form.locality.name,
    notes: form.notes || undefined,
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

/** Form state to the request body the API expects. */
export function toReportPayload(form, photoPublicId) {
  return {
    behaviorId: form.behaviorId,
    ...momentPayload(form),
    photoPublicId: photoPublicId || undefined,
  }
}

export function toCustomReportPayload(space, form) {
  const named = form.targetType === 'employee' || form.targetType === 'business'
  const category =
    form.category === NEW_CATEGORY
      ? { categoryLabel: form.newCategory.trim() }
      : { categoryKey: form.category }
  return {
    space,
    description: form.description.trim(),
    ...category,
    targetType: form.targetType,
    targetName: named ? form.targetName.trim() || undefined : undefined,
    ...momentPayload(form),
  }
}
