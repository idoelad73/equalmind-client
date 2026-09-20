import { api } from './api'

/* ------------------------------------------------------------- catalogue */

/**
 * The whole behaviour catalogue for one space.
 *
 * One request returns the categories and every behaviour, because a space
 * holds tens of rows. That is what lets step two filter as you type without
 * a round trip, and step three read back the chosen behaviour from the same
 * cached query instead of fetching it again.
 */
export async function fetchBehaviors(space) {
  const { data } = await api.get('/behaviors', { params: { space } })
  return data
}

/* ------------------------------------------------------------ localities */

/** Locality autocomplete. Returns [] rather than throwing when degraded. */
export async function searchLocalities(q, limit = 8) {
  if (!q || q.trim().length < 1) return { results: [], degraded: false }
  const { data } = await api.get('/registry/localities', {
    params: { q: q.trim(), limit },
  })
  return data
}

/**
 * Ask the browser for a fix, then have the server name it.
 *
 * The coordinates are sent once, to our own API, and nothing stores them -
 * the response is a locality name. A report carries the locality, never the
 * position it was derived from.
 */
export function detectLocality() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('הדפדפן אינו תומך בזיהוי מיקום. אפשר לבחור יישוב מהרשימה.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await api.get('/registry/localities/by-coords', {
            params: { lat: coords.latitude, lon: coords.longitude },
          })
          if (!data.found) {
            reject(new Error('לא הצלחנו לזהות יישוב מהמיקום. אפשר לבחור מהרשימה.'))
            return
          }
          resolve(data)
        } catch (error) {
          reject(new Error(error?.message ?? 'זיהוי המיקום נכשל.'))
        }
      },
      (error) => {
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'לא ניתנה הרשאת מיקום. אפשר לבחור יישוב מהרשימה.'
              : 'זיהוי המיקום נכשל. אפשר לבחור יישוב מהרשימה.',
          ),
        )
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    )
  })
}

/* ---------------------------------------------------------------- upload */

/**
 * Upload one photo and get back its Cloudinary publicId.
 *
 * Content-Type is cleared so the browser sets the multipart boundary itself -
 * the shared axios instance defaults to JSON, which would produce a body
 * multer cannot parse.
 */
export async function uploadPhoto(file, onProgress) {
  const form = new FormData()
  form.append('photo', file)

  const { data } = await api.post('/media/upload', form, {
    headers: { 'Content-Type': undefined },
    timeout: 60_000,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })

  return data.media
}

/* ---------------------------------------------------------------- submit */

export async function submitReport(payload) {
  const { data } = await api.post('/reports', payload)
  return data
}
