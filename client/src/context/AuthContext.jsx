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

  async function register(name, email, password) {
    return api('/auth/register', { method: 'POST', body: { name, email, password } })
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    loading,
    role: user?.role ?? null,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
