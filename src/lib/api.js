import axios from 'axios'
import { env } from './env'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize errors so callers always get a predictable shape,
// and clear the session on 401 so the router can bounce to /login.
api.interceptors.response.use(
  (response) => {
    // A 200 carrying HTML means the request never reached the API: a proxy
    // or a static-host rewrite answered it with the app's own index.html.
    // Axios calls that a success and hands the caller a string, so the
    // failure surfaces much later as "Cannot read properties of undefined"
    // inside whichever component destructured the body - a white screen
    // that says nothing about the real cause.
    //
    // Rejecting here turns it into an ordinary request failure, which every
    // page already knows how to render.
    const expectsJson =
      !response.config.responseType || response.config.responseType === 'json'
    const contentType = response.headers?.['content-type'] ?? ''

    // 204 has no body and no content type, and is a perfectly good answer.
    if (expectsJson && response.status !== 204 && !contentType.includes('json')) {
      return Promise.reject({
        status: response.status,
        code: 'not_json',
        message: 'לא הצלחנו להגיע לשרת. ייתכן שהבקשה לא נותבה אל ה-API.',
      })
    }

    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clear()
    }
    return Promise.reject({
      status: error.response?.status ?? 0,
      code: error.response?.data?.code ?? 'network_error',
      message:
        error.response?.data?.message ??
        error.message ??
        'Unexpected error contacting the server.',
    })
  },
)
