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
  (response) => response,
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
