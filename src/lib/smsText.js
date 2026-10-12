/**
 * SMS length maths, for live feedback while typing.
 *
 * MUST STAY IN STEP WITH server/lib/smsProvider.js segmentsFor(). The server
 * is the authority - it is what the gateway is actually billed on - and this
 * copy exists only so the counter can update on every keystroke without a
 * round trip. If the two ever disagree, the server is right.
 *
 * Why it matters at all: Hebrew is UCS-2, so a segment is 70 characters
 * rather than 160. A message that looks comfortably short in English is
 * three segments in Hebrew, and that multiplies across the whole roster.
 */

/** Characters GSM-7 can encode. Anything else forces UCS-2. */
const GSM7 =
  /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\\[~\]|€]*$/

export const MAX_TEMPLATE_LENGTH = 280

export function segmentsFor(body) {
  const text = body ?? ''
  const unicode = !GSM7.test(text)
  const limit = unicode ? 70 : 160
  const multipart = unicode ? 67 : 153
  if (text.length <= limit) return { segments: 1, unicode, limit, perSegment: limit }
  return {
    segments: Math.ceil(text.length / multipart),
    unicode,
    limit: multipart,
    perSegment: multipart,
  }
}

/**
 * What the counter shows.
 *
 * `remaining` counts down to the end of the CURRENT segment, not to the
 * 280-character cap — because crossing a segment boundary is the thing that
 * costs money, and the cap is far away. Someone watching "213 left" has no
 * idea they are two characters from doubling the bill.
 */
export function counterFor(body) {
  const text = body ?? ''
  const { segments, unicode, perSegment } = segmentsFor(text)
  const used = text.length
  const capacity = segments * perSegment

  return {
    used,
    segments,
    unicode,
    remaining: capacity - used,
    overLimit: used > MAX_TEMPLATE_LENGTH,
    maxLength: MAX_TEMPLATE_LENGTH,
    // Warn on the last 10 characters of a segment: that is the moment a
    // small edit silently adds a segment per recipient.
    nearBoundary: capacity - used <= 10,
  }
}

/** Fill {org} and {url} the way the server will, for a live preview. */
export function renderTemplate(template, vars) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '')
}

/** Mirror server/lib/smsProvider.js, which is the authority. */
export const INVITE_LINK_LINE = 'להרשמה: {url}'
/** Not appended automatically - mirrors the server. */
export const OPT_OUT_LINE = 'להסרה: {optout}'

/**
 * Complete a template so that no invitation ships without a way to act on
 * it. Only the registration link is added - writing a template without
 * {url} is an easy mistake and an invisible one, since there is nothing
 * left in the preview to miss.
 *
 * MUST STAY IN STEP WITH server/lib/smsProvider.js, which is the
 * authority. The line is ADDED rather than the template rejected. Nothing an admin
 * wrote is lost, and because the preview and the send both go through
 * here, what they approved is what goes out.
 *
 * NO OPT-OUT LINE IS ADDED. This message invites an employee to register
 * for a tool their own employer has adopted; it sells nothing and asks for
 * nothing, so it is not a דבר פרסומת and Communications Law s.30A does not
 * reach it. That is a judgement about THIS message - anything that becomes
 * promotional needs the opt-out back, and the machinery is still here for
 * it: put {optout} in a template and every recipient gets a personal
 * unsubscribe link (lib/optOut.js, migration 030). Opt-outs already
 * recorded are still honoured on every send - see SENDABLE in
 * org.controller.js.
 */
export function completeTemplate(template) {
  let text = String(template ?? '').trim()

  if (!text.includes('{url}')) {
    text = text ? `${text}\n${INVITE_LINK_LINE}` : INVITE_LINK_LINE
  }
  return text
}

/**
 * The body a phone will receive, from what is in the editor right now.
 *
 * Counting the template instead of this is the bug it replaces: {url} is
 * five characters, the link is about forty-five, and the gap is a whole
 * extra segment that only appears on the bill.
 */
export function bodyFor(template, { organizationName, inviteUrl, optOutUrl }) {
  return renderTemplate(completeTemplate(template), {
    org: organizationName ?? '',
    url: inviteUrl ?? '',
    // A sample of the real length. Each recipient gets their own token,
    // so there is no single true value here - only a true LENGTH, which
    // is what the counter needs.
    optout: optOutUrl ?? '',
  })
}
