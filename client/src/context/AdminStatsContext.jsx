import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { api } from '../api/api.js'

const AdminStatsContext = createContext({
  stats: null,
  loading: false,
  error: '',
})

export function AdminStatsProvider({ children }) {
  const { isAdmin, user } = useAuth()
  const location = useLocation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) {
      setStats(null)
      setLoading(false)
      setError('')
      return undefined
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api('/admin/stats')
        if (!cancelled) setStats(response.data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [isAdmin, user?.id, location.pathname])

  return (
    <AdminStatsContext.Provider value={{ stats, loading, error }}>
      {children}
    </AdminStatsContext.Provider>
  )
}

export function useAdminStats() {
  return useContext(AdminStatsContext)
}
