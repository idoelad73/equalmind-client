import { api } from './api'

/**
 * The employee roster for the signed-in admin's own organisation.
 *
 * None of these take an organisation: the server reads it from the caller's
 * membership. An admin who could name the organisation could seed another
 * company's roster, and a name typed by hand is what caused every mismatch
 * this replaced.
 */
/**
 * `organizationId` is sent only by Equalmind staff, who have no organisation
 * of their own and must name one. For an org admin the server ignores it and
 * uses their own membership, so passing it changes nothing.
 */
export async function fetchRoster(organizationId) {
  const { data } = await api.get('/org/roster', {
    params: organizationId ? { organizationId } : undefined,
  })
  return data
}

/** Every organisation, for the staff picker. Staff only; 403 otherwise. */
export async function fetchOrganizations() {
  const { data } = await api.get('/org/organizations')
  return data.organizations
}

/**
 * Import a roster. This never sends anything - inviting is a separate,
 * reviewed step, so that a CSV upload can never quietly message people.
 */
export async function uploadRoster(file, onProgress, organizationId) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post('/org/roster', form, {
    // On the query string, not in the form: the scope has to be resolved
    // before multer parses the body.
    params: organizationId ? { organizationId } : undefined,
    // Cleared so the browser sets the multipart boundary itself; the shared
    // instance defaults to JSON, which multer cannot parse.
    headers: { 'Content-Type': undefined },
    timeout: 120_000,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return data
}

export async function clearRoster() {
  const { data } = await api.delete('/org/roster')
  return data
}

/**
 * Read a CSV's header row in the browser, so an obviously wrong file is
 * caught before it is uploaded. The server validates properly regardless -
 * this is only to give a faster answer. (An .xlsx is checked on the server
 * only; reading one here would mean shipping a spreadsheet parser.)
 *
 * The column names mirror server/lib/rosterImport.js.
 */
const REQUIRED_COLUMNS = [
  { label: 'שם', keys: ['full_name', 'name', 'employee_name', 'שם', 'שם מלא', 'שם העובד', 'שם עובד'] },
  { label: 'טלפון', keys: ['phone', 'mobile', 'employee_phone', 'טלפון', 'נייד', 'טלפון נייד', 'מספר טלפון'] },
  { label: 'מחלקה', keys: ['department', 'מחלקה'] },
  { label: 'תפקיד', keys: ['job_title', 'title', 'role', 'position', 'תפקיד'] },
]

export function inspectCsvHeader(text) {
  const firstLine = text.replace(/^﻿/, '').split(/\r?\n/)[0] ?? ''
  // Same rule as detectDelimiter on the server: comma, semicolon or tab,
  // whichever the header line actually uses.
  const delimiter =
    [',', ';', '\t']
      .map((d) => [d, firstLine.split(d).length - 1])
      .sort((a, b) => b[1] - a[1])
      .find(([, count]) => count > 0)?.[0] ?? ','
  const columns = firstLine
    .split(delimiter)
    .map((c) => c.trim().replace(/^"|"$/g, '').trim().replace(/\s+/g, ' ').toLowerCase())

  const missing = REQUIRED_COLUMNS
    .filter((column) => !column.keys.some((k) => columns.includes(k)))
    .map((column) => column.label)

  return { columns, missing }
}

/* ------------------------------------------------------------ invitations */

/** The organisation's invitation text, with the rendered preview and cost. */
export async function fetchTemplate() {
  const { data } = await api.get('/org/template')
  return data
}

/** `null` clears it, falling back to the built-in default. */
export async function saveTemplate(template) {
  const { data } = await api.put('/org/template', { template })
  return data
}

/**
 * Invite roster members who have not registered.
 *
 * `dryRun` defaults to true on the server too: when the action reaches real
 * phones, the ambiguous call should be the harmless one.
 */
export async function notifyRoster({
  dryRun = true,
  resend = false,
  organizationId,
  since,
} = {}) {
  const { data } = await api.post(
    '/org/roster/notify',
    // `since` is the timestamp of the import this dialog came from. It is
    // what makes "only the new ones" mean the rows that import added,
    // rather than everyone we have not messaged yet.
    { dryRun, resend, ...(since ? { since } : null) },
    // Staff name the organisation; ignored for an org admin, who gets their
    // own either way.
    { params: organizationId ? { organizationId } : undefined },
  )
  return data
}
