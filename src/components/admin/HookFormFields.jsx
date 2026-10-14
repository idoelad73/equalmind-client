import { cn } from '@/lib/utils'
import { LocalityPicker } from '@/components/ui/LocalityPicker'
import {
  SPACE_OPTIONS,
  TARGET_OPTIONS,
  field,
} from '@/lib/hookForm'

/**
 * The fields a Hook is made of, as staff edit them.
 *
 * The pure parts - the options, the class string and the form/body
 * transforms - live in lib/hookForm.js so they can be imported by
 * anything, a test runner included. A .jsx cannot be.
 */

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="text-slate-400"> ({hint})</span>}
      </span>
      {children}
    </label>
  )
}

/**
 * Used by both staff screens that edit a Hook: the Hooks list's add/edit
 * dialog (HooksPage) and the review queue's approval form (MessagesModal).
 * One component, so a field added or relabelled here changes both.
 *
 *   firstLegend    heading of the first section
 *   wordingLabel   label of the wording field
 *   children       extra fields at the end of the first section - the
 *                  approval form puts its catalogue category here
 *   detailsLegend  heading of the second section. On an edit it says what
 *                  an edit means: it changes someone's own account.
 */
export function HookFormFields({
  form,
  set,
  disabled,
  firstLegend = 'ה-Hook',
  wordingLabel = 'נוסח ה-Hook',
  detailsLegend = 'פרטי ה-Hook',
  children,
}) {
  return (
    <>
      {/* ---- what the Hook says ---- */}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xs font-semibold text-[var(--l-primary)]">{firstLegend}</legend>

        <Field label={wordingLabel}>
          <input
            type="text"
            maxLength={200}
            value={form.behaviorName}
            disabled={disabled}
            onChange={(event) => set({ behaviorName: event.target.value })}
            className={cn(field, 'h-10')}
          />
        </Field>

        <Field label="מרחב">
          <select
            value={form.space}
            disabled={disabled}
            onChange={(event) => set({ space: event.target.value })}
            className={cn(field, 'h-10')}
          >
            <option value="" disabled>
              בחר/י מרחב
            </option>
            {SPACE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        {children}
      </fieldset>

      {/* ---- the circumstances ---- */}
      <fieldset className="flex flex-col gap-3 border-t border-[var(--l-ring)] pt-4">
        <legend className="mb-1 text-xs font-semibold text-slate-600">{detailsLegend}</legend>

        <Field label="על מי">
          <select
            value={form.targetType}
            disabled={disabled}
            onChange={(event) => set({ targetType: event.target.value })}
            className={cn(field, 'h-10')}
          >
            {TARGET_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        {(form.targetType === 'employee' || form.targetType === 'business') && (
          <Field
            label={form.targetType === 'employee' ? 'שם העובד/ת' : 'שם בית העסק'}
            hint={form.targetType === 'employee' ? 'חובה' : undefined}
          >
            <input
              type="text"
              maxLength={120}
              value={form.targetName}
              disabled={disabled}
              onChange={(event) => set({ targetName: event.target.value })}
              className={cn(field, 'h-10')}
            />
          </Field>
        )}

        <LocalityPicker
          label="מיקום"
          required={false}
          value={form.locality}
          disabled={disabled}
          onChange={(locality) => set({ locality })}
        />

        <Field label="מתי">
          <select
            value={form.whenMode}
            disabled={disabled}
            onChange={(event) => set({ whenMode: event.target.value })}
            className={cn(field, 'h-10')}
          >
            <option value="none">לא צוין</option>
            <option value="exact">תאריך ושעה</option>
            <option value="text">טקסט חופשי</option>
          </select>
        </Field>

        {form.whenMode === 'exact' && (
          <input
            type="datetime-local"
            value={form.occurredAt}
            disabled={disabled}
            onChange={(event) => set({ occurredAt: event.target.value })}
            aria-label="תאריך ושעה"
            dir="ltr"
            className={cn(field, 'h-10')}
          />
        )}

        {form.whenMode === 'text' && (
          <input
            type="text"
            maxLength={120}
            value={form.occurredText}
            disabled={disabled}
            onChange={(event) => set({ occurredText: event.target.value })}
            placeholder="למשל: בשבוע שעבר"
            aria-label="מתי זה קרה"
            className={cn(field, 'h-10')}
          />
        )}

        <Field label="פרטים">
          <textarea
            rows={3}
            maxLength={1000}
            value={form.notes}
            disabled={disabled}
            onChange={(event) => set({ notes: event.target.value })}
            className={cn(field, 'resize-y py-2 leading-relaxed')}
          />
        </Field>
      </fieldset>
    </>
  )
}
