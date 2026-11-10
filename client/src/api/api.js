const configuredBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace(/\/+$/, '')
const BASE_URL = /\/api$/i.test(configuredBaseUrl)
  ? configuredBaseUrl
  : `${configuredBaseUrl}/api`

const TOKEN_KEY = 'mb_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * League of helpers: any 401 (invalid/expired JWT) clears the stored token
 * and returns the user to the login page — except for the login/register
 * requests themselves (401 there just means "wrong credentials").
 */
function handle401(path) {
  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/send-otp') || path.startsWith('/auth/verify-otp') || path.startsWith('/auth/forgot-password') || path.startsWith('/auth/verify-forgot-otp') || path.startsWith('/auth/reset-password')
  if (!isAuthCall) {
    setToken(null)
    if (window.location.pathname !== '/login') {
      window.location.assign('/login?expired=1')
    }
  }
}

/**
 * Fetch wrapper for the backend API.
 * - attaches the JWT token automatically
 * - parses JSON
 * - throws Error(message) with `.status` on failure
 * - auto-logs-out on 401 (expired/invalid token)
 *
 * Usage: api('/auth/login', { method: 'POST', body: { email, password } })
 */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    if (response.status === 401 && token) handle401(path)
    const error = new Error(data?.message || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }

  return data
}

/**
 * Multipart upload (Photos / Kundli images).
 * - field: the multipart field name the backend expects (default "image")
 * - otherwise behaves like api(): JSON response, throws on !ok
 */
export async function apiUpload(path, { file, field = 'image', method = 'POST', fields = {} } = {}) {
  const formData = new FormData()
  formData.append(field, file)
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value))

  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: formData })
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    if (response.status === 401 && token) handle401(path)
    const error = new Error(data?.message || `Upload failed (${response.status})`)
    error.status = response.status
    throw error
  }

  return data
}

/**
 * Success/error toasts — tiny global pub-sub used by the <Toaster/> in App.jsx.
 * toast.success('Saved!'), toast.error('Something failed.')
 */
const TOAST_EVENT = 'mb-toast'
export function toast(kind, text, ms = 2000) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { kind, text, key: Date.now() + Math.random(), duration: ms },
  }))
}
toast.success = (text, ms) => toast('success', text, ms)
toast.error = (text, ms) => toast('error', text, ms)

export function onToast(callback) {
  const handler = (e) => callback(e.detail)
  window.addEventListener(TOAST_EVENT, handler)
  return () => window.removeEventListener(TOAST_EVENT, handler)
}
