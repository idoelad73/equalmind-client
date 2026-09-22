import { api } from './api'

/**
 * The employee roster for the signed-in admin's own organisation.
 *
 * None of these take an organisation: the server reads it from the caller's
 * membership. An admin who could name the organisation could seed another
 * company's roster, and a name typed by hand is what caused every mismatch
 * this replaced.
 */
export async function fetchRoster() {
  const { data } = await api.get('/org/roster')
  return data
}

/**
 * Import a roster. This never sends anything - inviting is a separate,
 * reviewed step, so that a CSV upload can never quietly message people.
 */
export async function uploadRoster(file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post('/org/roster', form, {
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
 * Read the header row in the browser, so an obviously wrong file is caught
 * before it is uploaded. The server validates properly regardless - this is
 * only to give a faster answer.
 */
export function inspectCsvHeader(text) {
  const firstLine = text.replace(/^﻿/, '').split(/\r?\n/)[0] ?? ''
  const columns = firstLine.split(',').map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase())

  const hasPhone = columns.some((c) =>
    ['phone', 'mobile', 'employee_phone', 'טלפון', 'נייד'].includes(c),
  )
  const hasName = columns.some((c) =>
    ['full_name', 'name', 'employee_name', 'שם', 'שם מלא'].includes(c),
  )

  return { columns, hasPhone, hasName }
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
export async function notifyRoster({ dryRun = true, resend = false } = {}) {
  const { data } = await api.post('/org/roster/notify', { dryRun, resend })
  return data
}
