import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until /auth/me check finishes

  // On first load: if a token exists, validate it via /auth/me
  useEffect(() => {
    const bootstrap = async () => {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const data = await api('/auth/me')
        setUser(data.data.user)
      } catch {
        setToken(null) // invalid/expired token
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  async function login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.data.token)
    setUser(data.data.user)
    return data.data.user
  }

  /** Step 1: send OTP to the given email */
  async function sendOtp(email) {
    return api('/auth/send-otp', { method: 'POST', body: { email } })
  }

  /** Step 2: verify the OTP — returns { emailVerifiedToken } */
  async function verifyOtp(email, otp) {
    const data = await api('/auth/verify-otp', { method: 'POST', body: { email, otp } })
    return data.data // { emailVerifiedToken }
  }

  /** Step 3: register with the verified token */
  async function register(name, password, emailVerifiedToken) {
    return api('/auth/register', { method: 'POST', body: { name, password, emailVerifiedToken } })
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  /** Forgot password step 1: send OTP to existing user's email */
  async function forgotPassword(email) {
    return api('/auth/forgot-password', { method: 'POST', body: { email } })
  }

  /** Forgot password step 2: verify OTP — returns { resetToken } */
  async function verifyForgotOtp(email, otp) {
    const data = await api('/auth/verify-forgot-otp', { method: 'POST', body: { email, otp } })
    return data.data // { resetToken }
  }

  /** Forgot password step 3: set new password */
  async function resetPassword(resetToken, password) {
    return api('/auth/reset-password', { method: 'POST', body: { resetToken, password } })
  }

  const value = {
    user,
    loading,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    login,
    sendOtp,
    verifyOtp,
    register,
    forgotPassword,
    verifyForgotOtp,
    resetPassword,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
