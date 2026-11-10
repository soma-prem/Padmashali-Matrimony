import { useAdminStats } from '../../context/AdminStatsContext.jsx'

export default function AdminDashboardPage() {
  const { stats, error, loading } = useAdminStats()

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
            <div className="num">{stats.uniqueVisitors}</div>
            <div className="lbl">Unique visitors</div>
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
