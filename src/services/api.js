import axios from 'axios'
import { getAccessToken, refreshToken, clearTokens } from './auth'

const api = axios.create({
  baseURL: (import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    if (!originalRequest || !err.response) return Promise.reject(err)

    if (err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((e) => Promise.reject(e))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { access } = await refreshToken()
        processQueue(null, access)
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearTokens()
        // Redirect to login when refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api
