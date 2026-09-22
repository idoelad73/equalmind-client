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
