import { z } from 'zod'

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v))

const locality = z
  .object({
    code: z.string().nullable(),
    name: z.string().trim().min(1).max(120),
  })
  .nullable()

/**
 * Where and when - shared by the catalogue form and the custom Hook form.
 *
 * Everything here is optional, including the locality: a report that is
 * awkward to file does not get filed. The catalogue form puts the
 * locality requirement back on top, because a known behaviour without a
 * place is much less use in aggregate; the custom form leaves it off,
 * since that is where someone goes precisely when the prepared wording
 * does not fit what they are describing.
 */
const momentFields = {
  locality,

  // 'now' | 'exact' | 'text' | 'unknown'
  whenMode: z.enum(['now', 'exact', 'text', 'unknown']).default('unknown'),
  occurredAt: z.string().optional(),
  occurredText: optionalText(120),

  notes: optionalText(1000),
}

export const reportDetailsSchema = z.object({
  behaviorId: z.uuid('התנהגות לא תקינה'),
  ...momentFields,
  // After the spread, so it overrides the optional one above.
  locality: locality.refine((v) => v !== null, {
    message: 'יש לבחור יישוב או להשתמש בזיהוי מיקום',
  }),
})

/** Who a custom Hook is about. Mirrors TARGET_TYPES on the server. */
export const TARGET_TYPES = ['employee', 'my_org', 'local_authority', 'business']

/**
 * "None of these - a new one". A system admin's option, both when approving
 * and when filing a Hook themselves (which goes straight to the catalogue).
 */
export const NEW_CATEGORY = '__new'

/** The reporter's option that means "I don't know which category". */
export const NO_CATEGORY = '__none'

/**
 * The "Hook is not on the list" form. Unlike the catalogue form it needs a
 * description, a category choice and a target, since there is no behaviour
 * row to supply them.
 *
 * description + category are what a behaviors row is made of (name,
 * category_key). "ללא קטגוריה" is a valid choice: the system admin then
 * picks the category at approval - see approveMessage on the server. A
 * system admin filing themselves skips approval, so they choose an existing
 * category or name a new one (NEW_CATEGORY + newCategory).
 */
export const customReportSchema = z
  .object({
    description: z.string().trim().min(3, 'יש לתאר את ה-Hook במשפט').max(200),
    category: z.string().min(1, 'יש לבחור קטגוריה'),
    newCategory: optionalText(80),
    targetType: z.enum(TARGET_TYPES, 'יש לבחור על מי ה-Hook'),
    targetName: optionalText(120),
    targetWorkerId: z.string().optional(),
    ...momentFields,
  })
  .refine((v) => v.category !== NEW_CATEGORY || (v.newCategory?.length ?? 0) >= 2, {
    message: 'יש לתת שם לקטגוריה החדשה',
    path: ['newCategory'],
  })
  .refine((v) => v.targetType !== 'employee' || v.targetWorkerId || v.targetName, {
    message: 'יש לבחור עובד/ת מהרשימה או להקליד שם',
    path: ['targetName'],
  })

/** The fields both request bodies share: place, time and notes. */
function momentPayload(form) {
  const payload = {
    notes: form.notes || undefined,
  }

  // Absent on a custom Hook whose reporter did not name a place.
  if (form.locality) {
    payload.localityName = form.locality.name
    if (form.locality.code) payload.localityCode = form.locality.code
  }

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
  // "ללא קטגוריה" sends neither field; a new category (system admin) sends
  // its name.
  const category =
    form.category === NO_CATEGORY
      ? {}
      : form.category === NEW_CATEGORY
        ? { categoryLabel: form.newCategory.trim() }
        : { categoryKey: form.category }
  return {
    space,
    description: form.description.trim(),
    ...category,
    targetType: form.targetType,
    // A picked colleague goes by id only; the server reads the name from its
    // own list. A typed name goes as text.
    targetWorkerId:
      form.targetType === 'employee' ? form.targetWorkerId || undefined : undefined,
    targetName:
      named && !(form.targetType === 'employee' && form.targetWorkerId)
        ? form.targetName.trim() || undefined
        : undefined,
    ...momentPayload(form),
  }
}
