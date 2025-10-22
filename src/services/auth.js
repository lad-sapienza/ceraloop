import axios from 'axios'

const STORAGE_TOKEN_KEY = 'directus_token'
const STORAGE_REFRESH_KEY = 'directus_refresh'

function baseUrl() {
  return (import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '')
}

export async function login(email, password) {
  const endpoint = `${baseUrl()}/auth/login`

  try {
    const res = await axios.post(endpoint, { email, password })
    const data = res.data?.data || res.data
    const access = data?.access_token || data?.token || null
    const refresh = data?.refresh_token || data?.refresh || null
    if (!access) throw new Error('No access token in response')
    // store tokens
    setTokens(access, refresh)
    return { access, refresh }
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message
    throw new Error(msg)
  }
}

export async function refreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No refresh token available')

  const endpoint = `${baseUrl()}/auth/refresh`
  try {
    const res = await axios.post(endpoint, { refresh_token: refresh })
    const data = res.data?.data || res.data
    const access = data?.access_token || data?.token || null
    const newRefresh = data?.refresh_token || data?.refresh || refresh
    if (!access) throw new Error('No access token in refresh response')
    setTokens(access, newRefresh)
    return { access, refresh: newRefresh }
  } catch (err) {
    const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message
    throw new Error(msg)
  }
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem(STORAGE_TOKEN_KEY, access)
  if (refresh) localStorage.setItem(STORAGE_REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_TOKEN_KEY)
  localStorage.removeItem(STORAGE_REFRESH_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_REFRESH_KEY)
}
