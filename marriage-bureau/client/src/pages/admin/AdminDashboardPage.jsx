import { useEffect, useState } from 'react'
import { api } from '../../api/api.js'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await api('/admin/stats')
        if (!cancelled) setStats(data.data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <h1 className="dashboard-title" style={{ marginBottom: 16 }}>Admin Dashboard</h1>

      {loading && <div className="page-loading">Loading stats…</div>}
      {error && <p className="form-error">{error}</p>}

      {stats && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="num">{stats.totalUsers}</div>
            <div className="lbl">Total users</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.pendingProfiles}</div>
            <div className="lbl">Pending profiles</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.approvedProfiles}</div>
            <div className="lbl">Approved profiles</div>
          </div>
          <div className={`stat-card ${stats.pendingRequests === 0 ? 'is-zero' : ''}`}>
            <div className="num">{stats.pendingRequests}</div>
            <div className="lbl">Pending requests</div>
            <div className="stage-hint">Starts in Stage 4</div>
          </div>
          <div className={`stat-card ${stats.totalConnections === 0 ? 'is-zero' : ''}`}>
            <div className="num">{stats.totalConnections}</div>
            <div className="lbl">Total connections</div>
            <div className="stage-hint">Starts in Stage 4</div>
          </div>
        </div>
      )}
    </div>
  )
}
