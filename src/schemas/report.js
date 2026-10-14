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

/** Who a Hook is about. Mirrors the server's own fields. */
const targetFields = {
  targetType: z.string().optional(),
  targetName: optionalText(120),
  targetWorkerId: z.string().optional(),
}

const detailsShape = {
  behaviorId: z.uuid('התנהגות לא תקינה'),
  ...momentFields,
  // After the spread, so it overrides the optional one above.
  locality: locality.refine((v) => v !== null, {
    message: 'יש לבחור יישוב או להשתמש בזיהוי מיקום',
  }),
  ...targetFields,
}

export const reportDetailsSchema = z.object(detailsShape)

/**
 * The same form, with the work space's extra rule: a work Hook is about
 * someone, so it must say who.
 *
 * A function of the space rather than one schema with a space field,
 * because the space is already in the URL and in the catalogue row - and
 * a copy of it inside the submitted data would be a third place for it to
 * disagree with the other two. The server applies the same rule from the
 * behaviour row, which is the one that actually decides.
 */
export function reportDetailsSchemaFor(space) {
  if (space === 'consumption') return consumptionDetailsSchema
  if (space !== 'work') return reportDetailsSchema

  return z
    .object(detailsShape)
    .refine((v) => Boolean(v.targetType), {
      message: 'יש לציין על מי או על מה ה-Hook',
      path: ['targetType'],
    })
    .refine((v) => v.targetType !== 'employee' || v.targetWorkerId || v.targetName, {
      message: 'יש לבחור עובד/ת מהרשימה או להקליד שם',
      path: ['targetName'],
    })
}

/**
 * מרחב הצריכה: the report is about a BUSINESS, so that is the required
 * field and the locality is not asked for - the picked business brings its
 * town along (see toReportPayload). Mirrors createReport on the server,
 * which applies the same rule from the behaviour's space.
 *
 * `business` is { name, address?, city?, id? }: a search pick fills all of
 * it, a typed name only `name`.
 */
const consumptionDetailsSchema = z.object({
  behaviorId: z.uuid('התנהגות לא תקינה'),
  ...momentFields,
  business: z
    .looseObject({ name: z.string().trim().min(2, 'יש למלא את שם העסק').max(120) })
    .nullable()
    .refine((v) => v !== null, { message: 'יש למלא את שם העסק' }),
  staffName: optionalText(120),
  placeText: optionalText(200),
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
    ...targetPayload(form),
    ...businessPayload(form),
    photoPublicId: photoPublicId || undefined,
  }
}

/**
 * The consumption form's fields. The business goes as a business target;
 * a searched-and-picked one also fills the locality with its town, so the
 * aggregate "where" picture keeps working without asking twice. A typed
 * name carries no town, and the locality is then simply left out.
 */
function businessPayload(form) {
  if (!form.business) return {}
  const { name, address, city } = form.business
  return {
    targetType: 'business',
    targetName: name.trim(),
    ...(address ? { businessAddress: address } : null),
    ...(city && !form.locality ? { localityName: city } : null),
    ...(form.staffName?.trim() ? { staffName: form.staffName.trim() } : null),
    ...(form.placeText?.trim() ? { placeText: form.placeText.trim() } : null),
  }
}

/**
 * The target, when the form collected one.
 *
 * A picked colleague sends the id AND the name; the server ignores the
 * name and re-reads it from its own list, so the two cannot be made to
 * disagree. The name is still sent because it is what a typed-in,
 * not-on-the-list person has instead.
 */
function targetPayload(form) {
  if (!form.targetType) return {}
  return {
    targetType: form.targetType,
    ...(form.targetName ? { targetName: form.targetName.trim() } : null),
    ...(form.targetWorkerId ? { targetWorkerId: form.targetWorkerId } : null),
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
